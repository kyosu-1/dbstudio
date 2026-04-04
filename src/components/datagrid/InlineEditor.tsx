import { useState, useRef, useEffect } from "react";

interface Props {
  value: unknown;
  dataType: string;
  onSave: (newValue: unknown) => void;
  onCancel: () => void;
  onTab?: () => void;
}

export function InlineEditor({ value, dataType, onSave, onCancel, onTab }: Props) {
  const isBoolean = dataType.toLowerCase().includes("bool");
  const [text, setText] = useState(value === null ? "" : String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  if (isBoolean) {
    return (
      <input
        type="checkbox"
        checked={value === true || value === "true"}
        onChange={(e) => onSave(e.target.checked)}
        className="cursor-pointer"
        autoFocus
      />
    );
  }

  const inputType =
    dataType.toLowerCase().includes("int") ||
    dataType.toLowerCase().includes("numeric") ||
    dataType.toLowerCase().includes("float") ||
    dataType.toLowerCase().includes("decimal") ||
    dataType.toLowerCase().includes("real") ||
    dataType.toLowerCase().includes("double")
      ? "number"
      : "text";

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const parsed = parseValue(text, dataType);
      onSave(parsed);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    } else if (e.key === "Tab") {
      e.preventDefault();
      const parsed = parseValue(text, dataType);
      onSave(parsed);
      onTab?.();
    } else if (e.key === "n" && e.ctrlKey && e.shiftKey) {
      e.preventDefault();
      onSave(null);
    }
  };

  return (
    <input
      ref={inputRef}
      type={inputType}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => {
        const parsed = parseValue(text, dataType);
        onSave(parsed);
      }}
      className="w-full bg-[var(--bg-primary)] border border-[var(--accent)] rounded px-1 py-0.5 text-xs text-[var(--text-primary)] outline-none"
    />
  );
}

function parseValue(text: string, dataType: string): unknown {
  if (text === "") return null;
  const lower = dataType.toLowerCase();
  if (lower.includes("int")) return parseInt(text, 10);
  if (
    lower.includes("numeric") ||
    lower.includes("float") ||
    lower.includes("decimal") ||
    lower.includes("real") ||
    lower.includes("double")
  )
    return parseFloat(text);
  if (lower.includes("bool")) return text.toLowerCase() === "true";
  return text;
}
