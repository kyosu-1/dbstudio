import { X, Plus, Terminal, Play, Database, ArrowRight } from "lucide-react";
import { useAppStore } from "../../store/appStore";
import { TableBrowser } from "../datagrid/TableBrowser";
import { SqlEditor } from "../editor/SqlEditor";
import { DEMO_SAMPLE_QUERIES } from "../../lib/demo-data";

interface Props {
  onStartDemo?: () => void;
}

export function MainPanel({ onStartDemo }: Props) {
  const {
    tabs,
    activeTabId,
    setActiveTabId,
    removeTab,
    addTab,
    isDemoMode,
    activeConnectionId,
    setShowConnectionDialog,
    setEditingConnection,
  } = useAppStore();

  const activeTab = tabs.find((t) => t.id === activeTabId);

  const newQueryTab = () => {
    const id = `query-${Date.now()}`;
    addTab({
      id,
      type: "query",
      title: "New Query",
    });
  };

  const handleNewConnection = () => {
    setEditingConnection(null);
    setShowConnectionDialog(true);
  };

  // Welcome state: no connection, no tabs, not in demo mode
  const showWelcome = !activeConnectionId && tabs.length === 0 && !isDemoMode;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center bg-[var(--bg-secondary)] border-b border-[var(--border)] min-h-[32px]">
        <div className="flex-1 flex overflow-x-auto">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer border-r border-[var(--border)] whitespace-nowrap ${
                tab.id === activeTabId
                  ? "bg-[var(--bg-primary)] text-[var(--text-primary)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"
              }`}
              onClick={() => setActiveTabId(tab.id)}
            >
              {tab.type === "query" && <Terminal size={11} />}
              <span>{tab.title}</span>
              <button
                className="ml-1 hover:text-[var(--error)]"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTab(tab.id);
                }}
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
        <button
          className="px-2 py-1.5 text-[var(--text-muted)] hover:text-[var(--accent)]"
          onClick={newQueryTab}
          title="New Query Tab"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {showWelcome && (
          <div className="flex items-center justify-center h-full">
            <div className="max-w-lg w-full px-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Database size={28} className="text-[var(--accent)]" />
                <h1 className="text-xl font-bold text-[var(--text-primary)]">
                  DB Studio
                </h1>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-8">
                A modern PostgreSQL database client
              </p>

              <div className="flex gap-3 justify-center mb-8">
                {onStartDemo && (
                  <button
                    onClick={onStartDemo}
                    className="group flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--accent)] text-[var(--bg-primary)] font-medium text-sm hover:bg-[var(--accent-hover)] transition-colors"
                  >
                    <Play size={14} />
                    Start Demo
                    <ArrowRight
                      size={14}
                      className="group-hover:translate-x-0.5 transition-transform"
                    />
                  </button>
                )}
                <button
                  onClick={handleNewConnection}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] transition-colors"
                >
                  <Database size={14} />
                  New Connection
                </button>
              </div>

              <p className="text-xs text-[var(--text-muted)]">
                Press{" "}
                <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)] font-mono">
                  Cmd+K
                </kbd>{" "}
                for command palette
              </p>
            </div>
          </div>
        )}

        {!showWelcome && !activeTab && (
          <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
            <div className="text-center max-w-md">
              <p className="text-lg mb-2">DB Studio</p>
              <p className="text-sm mb-4">
                Select a table from the sidebar or{" "}
                <button
                  className="text-[var(--accent)] hover:underline"
                  onClick={newQueryTab}
                >
                  open a new query
                </button>
              </p>
              {isDemoMode && (
                <div className="mt-4">
                  <p className="text-xs text-[var(--text-muted)] mb-3 uppercase tracking-wider font-medium">
                    Try a sample query
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {DEMO_SAMPLE_QUERIES.map((q) => (
                      <button
                        key={q.title}
                        className="flex items-center gap-2 px-3 py-2 rounded text-xs text-left bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border)] transition-colors"
                        onClick={() => {
                          const id = `query-${Date.now()}`;
                          addTab({ id, type: "query", title: q.title, sql: q.sql });
                        }}
                      >
                        <Play size={10} className="text-[var(--accent)] shrink-0" />
                        <span className="text-[var(--text-secondary)]">{q.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab?.type === "table" && activeTab.schema && activeTab.tableName && (
          <TableBrowser schema={activeTab.schema} tableName={activeTab.tableName} />
        )}
        {activeTab?.type === "query" && (
          <SqlEditor tabId={activeTab.id} initialSql={activeTab.sql} />
        )}
      </div>
    </div>
  );
}
