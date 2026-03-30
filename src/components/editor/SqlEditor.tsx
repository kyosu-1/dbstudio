import { useState, useCallback } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql, PostgreSQL } from "@codemirror/lang-sql";
import { keymap, EditorView } from "@codemirror/view";
import { Play, Zap, Loader2 } from "lucide-react";
import { useAppStore } from "../../store/appStore";
import { api } from "../../lib/tauri";
import { DataGrid } from "../datagrid/DataGrid";
import type { QueryResult } from "../../lib/types";

interface Props {
  tabId: string;
  initialSql?: string;
}

export function SqlEditor({ tabId, initialSql }: Props) {
  const { activeConnectionId, updateTab } = useAppStore();
  const [sqlText, setSqlText] = useState(initialSql ?? "");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runQuery = useCallback(async () => {
    if (!activeConnectionId || !sqlText.trim()) return;
    setLoading(true);
    try {
      const res = await api.executeSql(activeConnectionId, sqlText);
      setResult(res);
    } catch (e) {
      setResult({ type: "Error", message: String(e), position: null });
    }
    setLoading(false);
  }, [activeConnectionId, sqlText]);

  const runExplain = useCallback(async () => {
    if (!activeConnectionId || !sqlText.trim()) return;
    setLoading(true);
    try {
      const plan = await api.explainSql(activeConnectionId, sqlText);
      setResult({ type: "Error", message: plan, position: null }); // reuse Error type for display
    } catch (e) {
      setResult({ type: "Error", message: String(e), position: null });
    }
    setLoading(false);
  }, [activeConnectionId, sqlText]);

  const executeKeymap = keymap.of([
    {
      key: "Mod-Enter",
      run: () => {
        runQuery();
        return true;
      },
    },
  ]);

  const theme = EditorView.theme({
    "&": {
      backgroundColor: "var(--bg-primary)",
      color: "var(--text-primary)",
      fontSize: "13px",
    },
    ".cm-gutters": {
      backgroundColor: "var(--bg-secondary)",
      borderRight: "1px solid var(--border)",
      color: "var(--text-muted)",
    },
    ".cm-activeLine": {
      backgroundColor: "var(--bg-surface)",
    },
    ".cm-selectionBackground": {
      backgroundColor: "var(--bg-hover) !important",
    },
    "&.cm-focused .cm-cursor": {
      borderLeftColor: "var(--accent)",
    },
  });

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <button
          className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-[var(--accent)] text-[var(--bg-primary)] font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50"
          onClick={runQuery}
          disabled={loading || !activeConnectionId}
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
          Run
        </button>
        <button
          className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] disabled:opacity-50"
          onClick={runExplain}
          disabled={loading || !activeConnectionId}
        >
          <Zap size={12} />
          Explain
        </button>
        <span className="text-xs text-[var(--text-muted)] ml-auto">
          {activeConnectionId ? "Cmd+Enter to run" : "No connection"}
        </span>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-[120px] overflow-hidden" style={{ maxHeight: "40%" }}>
        <CodeMirror
          value={sqlText}
          height="100%"
          theme="dark"
          extensions={[sql({ dialect: PostgreSQL }), executeKeymap, theme]}
          onChange={(val) => {
            setSqlText(val);
            updateTab(tabId, { sql: val });
          }}
        />
      </div>

      {/* Results */}
      <div className="flex-1 border-t border-[var(--border)] overflow-auto">
        {result === null && (
          <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">
            Run a query to see results
          </div>
        )}
        {result?.type === "Select" && (
          <div className="h-full flex flex-col">
            <DataGrid columns={result.columns} rows={result.rows} />
            <div className="px-3 py-1 text-xs text-[var(--text-muted)] border-t border-[var(--border)] bg-[var(--bg-secondary)]">
              {result.row_count} rows in {result.execution_time_ms}ms
            </div>
          </div>
        )}
        {result?.type === "Execute" && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-[var(--success)] text-sm">Query executed successfully</div>
              <div className="text-[var(--text-muted)] text-xs mt-1">
                {result.rows_affected} rows affected in {result.execution_time_ms}ms
              </div>
            </div>
          </div>
        )}
        {result?.type === "Error" && (
          <div className="p-3">
            <pre className="text-xs text-[var(--error)] whitespace-pre-wrap font-mono">
              {result.message}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
