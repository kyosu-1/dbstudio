import { X, Plus, Terminal } from "lucide-react";
import { useAppStore } from "../../store/appStore";
import { TableBrowser } from "../datagrid/TableBrowser";
import { SqlEditor } from "../editor/SqlEditor";

export function MainPanel() {
  const { tabs, activeTabId, setActiveTabId, removeTab, addTab } = useAppStore();

  const activeTab = tabs.find((t) => t.id === activeTabId);

  const newQueryTab = () => {
    const id = `query-${Date.now()}`;
    addTab({
      id,
      type: "query",
      title: "New Query",
    });
  };

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
        {!activeTab && (
          <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
            <div className="text-center">
              <p className="text-lg mb-2">DB Studio</p>
              <p className="text-sm">
                Select a table or{" "}
                <button
                  className="text-[var(--accent)] hover:underline"
                  onClick={newQueryTab}
                >
                  open a new query
                </button>
              </p>
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
