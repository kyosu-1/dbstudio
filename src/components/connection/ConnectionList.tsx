import {
  Database,
  Plus,
  Pencil,
  Trash2,
  Power,
  PowerOff,
} from "lucide-react";
import { useAppStore } from "../../store/appStore";
import { api } from "../../lib/tauri";

export function ConnectionList() {
  const {
    savedConnections,
    activeConnectionId,
    connectionStatus,
    setActiveConnectionId,
    setConnectionStatus,
    setShowConnectionDialog,
    setEditingConnection,
    setSavedConnections,
  } = useAppStore();

  const handleConnect = async (id: string) => {
    try {
      await api.connect(id);
      setConnectionStatus(id, "connected");
      setActiveConnectionId(id);
    } catch (e) {
      alert(`Connection failed: ${e}`);
    }
  };

  const handleDisconnect = async (id: string) => {
    await api.disconnect(id);
    setConnectionStatus(id, "disconnected");
    if (activeConnectionId === id) {
      setActiveConnectionId(null);
    }
  };

  const handleDelete = async (id: string) => {
    await api.deleteConnection(id);
    const updated = await api.listSavedConnections();
    setSavedConnections(updated);
    if (activeConnectionId === id) {
      setActiveConnectionId(null);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)]">
        <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
          Connections
        </span>
        <button
          className="text-[var(--text-muted)] hover:text-[var(--accent)]"
          onClick={() => {
            setEditingConnection(null);
            setShowConnectionDialog(true);
          }}
          title="New Connection"
        >
          <Plus size={14} />
        </button>
      </div>
      <div className="flex flex-col">
        {savedConnections.map((conn) => {
          const isConnected = connectionStatus[conn.id] === "connected";
          const isActive = activeConnectionId === conn.id;
          return (
            <div
              key={conn.id}
              className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-[var(--bg-hover)] group ${
                isActive ? "bg-[var(--bg-surface)]" : ""
              }`}
              onClick={() => {
                if (isConnected) {
                  setActiveConnectionId(conn.id);
                } else {
                  handleConnect(conn.id);
                }
              }}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-[var(--success)]" : "bg-[var(--text-muted)]"
                }`}
              />
              <Database size={14} className="text-[var(--text-muted)]" />
              <span className="text-sm flex-1 truncate">{conn.name || conn.database}</span>
              <div className="hidden group-hover:flex gap-1">
                {isConnected ? (
                  <button
                    className="text-[var(--text-muted)] hover:text-[var(--error)]"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDisconnect(conn.id);
                    }}
                    title="Disconnect"
                  >
                    <PowerOff size={12} />
                  </button>
                ) : (
                  <button
                    className="text-[var(--text-muted)] hover:text-[var(--success)]"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConnect(conn.id);
                    }}
                    title="Connect"
                  >
                    <Power size={12} />
                  </button>
                )}
                <button
                  className="text-[var(--text-muted)] hover:text-[var(--accent)]"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingConnection(conn);
                    setShowConnectionDialog(true);
                  }}
                  title="Edit"
                >
                  <Pencil size={12} />
                </button>
                <button
                  className="text-[var(--text-muted)] hover:text-[var(--error)]"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(conn.id);
                  }}
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
