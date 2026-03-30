import { useState } from "react";
import { X } from "lucide-react";
import { ConnectionForm } from "./ConnectionForm";
import { useAppStore } from "../../store/appStore";
import { api } from "../../lib/tauri";
import type { SavedConnection } from "../../lib/types";

export function ConnectionDialog() {
  const { editingConnection, setShowConnectionDialog, setSavedConnections } =
    useAppStore();
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [testing, setTesting] = useState(false);

  const handleSave = async (conn: SavedConnection) => {
    await api.saveConnection(conn);
    const updated = await api.listSavedConnections();
    setSavedConnections(updated);
    setShowConnectionDialog(false);
  };

  const handleTest = async (conn: SavedConnection) => {
    setTesting(true);
    setTestResult(null);
    try {
      const version = await api.testConnection(conn);
      setTestResult({ success: true, message: `Connected! ${version}` });
    } catch (e) {
      setTestResult({ success: false, message: String(e) });
    }
    setTesting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg w-[480px] shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <h2 className="text-sm font-medium">
            {editingConnection ? "Edit Connection" : "New Connection"}
          </h2>
          <button
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            onClick={() => setShowConnectionDialog(false)}
          >
            <X size={16} />
          </button>
        </div>
        <ConnectionForm
          initial={editingConnection ?? undefined}
          onSave={handleSave}
          onTest={handleTest}
          onCancel={() => setShowConnectionDialog(false)}
          testResult={testResult}
          testing={testing}
        />
      </div>
    </div>
  );
}
