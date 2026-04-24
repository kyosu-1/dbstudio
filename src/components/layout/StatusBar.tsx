import { Database, FlaskConical } from "lucide-react";
import { useAppStore } from "../../store/appStore";

export function StatusBar() {
  const { activeConnectionId, savedConnections, connectionStatus, isDemoMode } = useAppStore();
  const conn = savedConnections.find((c) => c.id === activeConnectionId);
  const isConnected = activeConnectionId
    ? connectionStatus[activeConnectionId] === "connected"
    : false;

  return (
    <div className="flex items-center px-3 py-1 bg-[var(--bg-secondary)] border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
      <div className="flex items-center gap-2">
        {isDemoMode ? (
          <FlaskConical size={11} className="text-[var(--accent)]" />
        ) : (
          <Database size={11} />
        )}
        {conn ? (
          <span>
            <span
              className={isConnected ? "text-[var(--success)]" : "text-[var(--text-muted)]"}
            >
              {conn.name || conn.database}
            </span>
            <span className="ml-2">
              {conn.host}:{conn.port}/{conn.database}
            </span>
          </span>
        ) : (
          <span>No connection</span>
        )}
      </div>
      <div className="ml-auto">
        {isDemoMode ? (
          <span className="text-[var(--accent)]">Demo Mode</span>
        ) : (
          "PostgreSQL"
        )}
      </div>
    </div>
  );
}
