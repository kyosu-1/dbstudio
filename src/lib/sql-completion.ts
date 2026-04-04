import {
  type CompletionContext,
  type CompletionResult,
  type Completion,
} from "@codemirror/autocomplete";
import type { CompletionMetadata } from "./types";
import { SQL_KEYWORDS } from "./sql-keywords";

type CompletionIcon = "keyword" | "type" | "property" | "function";

function makeCompletion(
  label: string,
  type: CompletionIcon,
  detail?: string,
  boost?: number
): Completion {
  return { label, type, detail, boost };
}

function parseAliases(text: string): Map<string, string> {
  const aliases = new Map<string, string>();
  const fromRegex =
    /\bFROM\s+(?:"?(\w+)"?\.)?"?(\w+)"?(?:\s+(?:AS\s+)?"?(\w+)"?)?/gi;
  const joinRegex =
    /\bJOIN\s+(?:"?(\w+)"?\.)?"?(\w+)"?(?:\s+(?:AS\s+)?"?(\w+)"?)?/gi;

  for (const regex of [fromRegex, joinRegex]) {
    let match;
    while ((match = regex.exec(text)) !== null) {
      const tableName = match[2];
      const alias = match[3];
      if (alias) {
        aliases.set(alias.toLowerCase(), tableName.toLowerCase());
      }
    }
  }
  return aliases;
}

function getContext(textBefore: string): {
  type: "schema_dot" | "alias_dot" | "from" | "select" | "general";
  prefix?: string;
} {
  const dotMatch = textBefore.match(/(\w+)\.\s*$/);
  if (dotMatch) {
    return { type: "alias_dot", prefix: dotMatch[1] };
  }

  const fromMatch = textBefore.match(/\b(?:FROM|JOIN)\s+(\w*\.)?$/i);
  if (fromMatch) {
    if (fromMatch[1]) {
      return { type: "schema_dot", prefix: fromMatch[1].replace(".", "") };
    }
    return { type: "from" };
  }

  const selectMatch = textBefore.match(/\bSELECT\s+(?:[\w.*,\s]*,\s*)?$/i);
  if (selectMatch) {
    return { type: "select" };
  }

  return { type: "general" };
}

export function createCompletionSource(metadata: CompletionMetadata | null) {
  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/[\w.]*$/);
    if (!word) return null;
    if (word.from === word.to && !context.explicit) return null;

    const typed = word.text;
    if (typed.length < 2 && !context.explicit && !typed.includes(".")) {
      return null;
    }

    const fullText = context.state.doc.sliceString(0, word.from);
    const ctx = getContext(fullText);
    const options: Completion[] = [];

    if (!metadata) {
      const filter = typed.toUpperCase();
      SQL_KEYWORDS.forEach((kw) => {
        if (kw.startsWith(filter) || filter.length < 2) {
          options.push(makeCompletion(kw, "keyword", "keyword", -1));
        }
      });
      return { from: word.from, options };
    }

    const aliases = parseAliases(context.state.doc.toString());

    if (ctx.type === "alias_dot" && ctx.prefix) {
      const prefix = ctx.prefix.toLowerCase();
      const isSchema = metadata.schemas.some(
        (s) => s.toLowerCase() === prefix
      );
      if (isSchema) {
        metadata.tables
          .filter((t) => t.schema.toLowerCase() === prefix)
          .forEach((t) =>
            options.push(makeCompletion(t.name, "type", `${t.table_type} in ${t.schema}`))
          );
      } else {
        const tableName = aliases.get(prefix) || prefix;
        metadata.columns
          .filter((c) => c.table.toLowerCase() === tableName)
          .forEach((c) =>
            options.push(makeCompletion(c.name, "property", c.data_type))
          );
      }
      const dotPos = word.from + typed.indexOf(".") + 1;
      return { from: dotPos, options };
    }

    if (ctx.type === "from" || ctx.type === "schema_dot") {
      if (ctx.type === "schema_dot" && ctx.prefix) {
        metadata.tables
          .filter((t) => t.schema.toLowerCase() === ctx.prefix!.toLowerCase())
          .forEach((t) =>
            options.push(makeCompletion(t.name, "type", t.table_type))
          );
      } else {
        metadata.schemas.forEach((s) =>
          options.push(makeCompletion(s, "type", "schema", 1))
        );
        metadata.tables.forEach((t) =>
          options.push(
            makeCompletion(t.name, "type", `${t.table_type} in ${t.schema}`)
          )
        );
      }
      return { from: word.from, options };
    }

    if (ctx.type === "select") {
      metadata.columns.forEach((c) =>
        options.push(
          makeCompletion(c.name, "property", `${c.data_type} (${c.table})`)
        )
      );
      metadata.functions.forEach((f) =>
        options.push(makeCompletion(f.name + "(", "function", f.description))
      );
      options.push(makeCompletion("*", "keyword", "all columns", 2));
    }

    SQL_KEYWORDS.forEach((kw) =>
      options.push(makeCompletion(kw, "keyword", "keyword", -1))
    );
    metadata.tables.forEach((t) =>
      options.push(
        makeCompletion(t.name, "type", `${t.table_type} in ${t.schema}`)
      )
    );
    metadata.columns.forEach((c) =>
      options.push(
        makeCompletion(c.name, "property", `${c.data_type} (${c.table})`, -2)
      )
    );
    metadata.functions.forEach((f) =>
      options.push(makeCompletion(f.name + "(", "function", f.description, -2))
    );

    return { from: word.from, options };
  };
}
