import { useState } from "react";
import type { SavedConnection } from "../../lib/types";

interface Props {
  initial?: SavedConnection;
  onSave: (conn: SavedConnection) => void;
  onTest: (conn: SavedConnection) => void;
  onCancel: () => void;
  testResult?: { success: boolean; message: string } | null;
  testing?: boolean;
}

export function ConnectionForm({
  initial,
  onSave,
  onTest,
  onCancel,
  testResult,
  testing,
}: Props) {
  const [form, setForm] = useState<SavedConnection>(
    initial ?? {
      id: crypto.randomUUID(),
      name: "",
      host: "localhost",
      port: 5432,
      database: "",
      username: "postgres",
      password: "",
      ssl_mode: "prefer",
    }
  );

  const update = (field: keyof SavedConnection, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="flex flex-col gap-3 p-4">
      <label className="flex flex-col gap-1">
        <span className="text-xs text-[var(--text-secondary)]">Name</span>
        <input
          className="bg-[var(--bg-surface)] border border-[var(--border)] rounded px-2 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="My Database"
        />
      </label>

      <div className="flex gap-3">
        <label className="flex flex-col gap-1 flex-1">
          <span className="text-xs text-[var(--text-secondary)]">Host</span>
          <input
            className="bg-[var(--bg-surface)] border border-[var(--border)] rounded px-2 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            value={form.host}
            onChange={(e) => update("host", e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 w-24">
          <span className="text-xs text-[var(--text-secondary)]">Port</span>
          <input
            type="number"
            className="bg-[var(--bg-surface)] border border-[var(--border)] rounded px-2 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            value={form.port}
            onChange={(e) => update("port", parseInt(e.target.value) || 5432)}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-[var(--text-secondary)]">Database</span>
        <input
          className="bg-[var(--bg-surface)] border border-[var(--border)] rounded px-2 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
          value={form.database}
          onChange={(e) => update("database", e.target.value)}
          placeholder="postgres"
        />
      </label>

      <div className="flex gap-3">
        <label className="flex flex-col gap-1 flex-1">
          <span className="text-xs text-[var(--text-secondary)]">Username</span>
          <input
            className="bg-[var(--bg-surface)] border border-[var(--border)] rounded px-2 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            value={form.username}
            onChange={(e) => update("username", e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 flex-1">
          <span className="text-xs text-[var(--text-secondary)]">Password</span>
          <input
            type="password"
            className="bg-[var(--bg-surface)] border border-[var(--border)] rounded px-2 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-[var(--text-secondary)]">SSL Mode</span>
        <select
          className="bg-[var(--bg-surface)] border border-[var(--border)] rounded px-2 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
          value={form.ssl_mode}
          onChange={(e) => update("ssl_mode", e.target.value)}
        >
          <option value="disable">Disable</option>
          <option value="prefer">Prefer</option>
          <option value="require">Require</option>
        </select>
      </label>

      {testResult && (
        <div
          className={`text-xs px-3 py-2 rounded ${
            testResult.success
              ? "bg-[var(--success)]/10 text-[var(--success)]"
              : "bg-[var(--error)]/10 text-[var(--error)]"
          }`}
        >
          {testResult.message}
        </div>
      )}

      <div className="flex gap-2 justify-end mt-2">
        <button
          className="px-3 py-1.5 text-sm rounded border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="px-3 py-1.5 text-sm rounded border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
          onClick={() => onTest(form)}
          disabled={testing}
        >
          {testing ? "Testing..." : "Test Connection"}
        </button>
        <button
          className="px-3 py-1.5 text-sm rounded bg-[var(--accent)] text-[var(--bg-primary)] font-medium hover:bg-[var(--accent-hover)]"
          onClick={() => onSave(form)}
        >
          Save
        </button>
      </div>
    </div>
  );
}
