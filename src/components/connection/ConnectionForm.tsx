import { useState } from "react";
import type { SavedConnection, SshConfig } from "../../lib/types";

interface Props {
  initial?: SavedConnection;
  onSave: (conn: SavedConnection) => void;
  onTest: (conn: SavedConnection) => void;
  onCancel: () => void;
  testResult?: { success: boolean; message: string } | null;
  testing?: boolean;
}

const inputClass =
  "bg-[var(--bg-surface)] border border-[var(--border)] rounded px-2 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]";

const defaultSsh: SshConfig = {
  enabled: false,
  host: "",
  port: 22,
  username: "",
  auth: { type: "Password", password: "" },
};

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

  const ssh = form.ssh ?? defaultSsh;

  const update = (field: keyof SavedConnection, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }));

  const updateSsh = (updates: Partial<SshConfig>) =>
    setForm((f) => ({ ...f, ssh: { ...ssh, ...updates } }));

  const toggleSsh = () => {
    if (ssh.enabled) {
      setForm((f) => ({ ...f, ssh: { ...ssh, enabled: false } }));
    } else {
      setForm((f) => ({ ...f, ssh: { ...ssh, enabled: true } }));
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 max-h-[70vh] overflow-y-auto">
      <label className="flex flex-col gap-1">
        <span className="text-xs text-[var(--text-secondary)]">Name</span>
        <input
          className={inputClass}
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="My Database"
        />
      </label>

      <div className="flex gap-3">
        <label className="flex flex-col gap-1 flex-1">
          <span className="text-xs text-[var(--text-secondary)]">Host</span>
          <input
            className={inputClass}
            value={form.host}
            onChange={(e) => update("host", e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 w-24">
          <span className="text-xs text-[var(--text-secondary)]">Port</span>
          <input
            type="number"
            className={inputClass}
            value={form.port}
            onChange={(e) => update("port", parseInt(e.target.value) || 5432)}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-[var(--text-secondary)]">Database</span>
        <input
          className={inputClass}
          value={form.database}
          onChange={(e) => update("database", e.target.value)}
          placeholder="postgres"
        />
      </label>

      <div className="flex gap-3">
        <label className="flex flex-col gap-1 flex-1">
          <span className="text-xs text-[var(--text-secondary)]">Username</span>
          <input
            className={inputClass}
            value={form.username}
            onChange={(e) => update("username", e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 flex-1">
          <span className="text-xs text-[var(--text-secondary)]">Password</span>
          <input
            type="password"
            className={inputClass}
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-[var(--text-secondary)]">SSL Mode</span>
        <select
          className={inputClass}
          value={form.ssl_mode}
          onChange={(e) => update("ssl_mode", e.target.value)}
        >
          <option value="disable">Disable</option>
          <option value="prefer">Prefer</option>
          <option value="require">Require</option>
        </select>
      </label>

      {/* SSH Tunnel */}
      <div className="border-t border-[var(--border)] pt-3 mt-1">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={ssh.enabled}
            onChange={toggleSsh}
            className="accent-[var(--accent)]"
          />
          <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
            SSH Tunnel
          </span>
        </label>

        {ssh.enabled && (
          <div className="flex flex-col gap-3 mt-3">
            <div className="flex gap-3">
              <label className="flex flex-col gap-1 flex-1">
                <span className="text-xs text-[var(--text-secondary)]">SSH Host</span>
                <input
                  className={inputClass}
                  value={ssh.host}
                  onChange={(e) => updateSsh({ host: e.target.value })}
                  placeholder="bastion.example.com"
                />
              </label>
              <label className="flex flex-col gap-1 w-24">
                <span className="text-xs text-[var(--text-secondary)]">SSH Port</span>
                <input
                  type="number"
                  className={inputClass}
                  value={ssh.port}
                  onChange={(e) =>
                    updateSsh({ port: parseInt(e.target.value) || 22 })
                  }
                />
              </label>
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-[var(--text-secondary)]">SSH Username</span>
              <input
                className={inputClass}
                value={ssh.username}
                onChange={(e) => updateSsh({ username: e.target.value })}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-[var(--text-secondary)]">Auth Method</span>
              <select
                className={inputClass}
                value={ssh.auth.type}
                onChange={(e) => {
                  const authType = e.target.value as "Password" | "PrivateKey";
                  if (authType === "Password") {
                    updateSsh({ auth: { type: "Password", password: "" } });
                  } else {
                    updateSsh({
                      auth: { type: "PrivateKey", private_key_path: "", passphrase: "" },
                    });
                  }
                }}
              >
                <option value="Password">Password</option>
                <option value="PrivateKey">Private Key</option>
              </select>
            </label>

            {ssh.auth.type === "Password" && (
              <label className="flex flex-col gap-1">
                <span className="text-xs text-[var(--text-secondary)]">SSH Password</span>
                <input
                  type="password"
                  className={inputClass}
                  value={ssh.auth.password}
                  onChange={(e) =>
                    updateSsh({
                      auth: { type: "Password", password: e.target.value },
                    })
                  }
                />
              </label>
            )}

            {ssh.auth.type === "PrivateKey" && (
              <>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-[var(--text-secondary)]">
                    Private Key Path
                  </span>
                  <input
                    className={inputClass}
                    value={ssh.auth.private_key_path}
                    onChange={(e) =>
                      updateSsh({
                        auth: {
                          type: "PrivateKey",
                          private_key_path: e.target.value,
                          passphrase: ssh.auth.type === "PrivateKey" ? ssh.auth.passphrase : "",
                        },
                      })
                    }
                    placeholder="~/.ssh/id_rsa"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-[var(--text-secondary)]">
                    Passphrase (optional)
                  </span>
                  <input
                    type="password"
                    className={inputClass}
                    value={ssh.auth.type === "PrivateKey" ? ssh.auth.passphrase ?? "" : ""}
                    onChange={(e) =>
                      updateSsh({
                        auth: {
                          type: "PrivateKey",
                          private_key_path:
                            ssh.auth.type === "PrivateKey" ? ssh.auth.private_key_path : "",
                          passphrase: e.target.value || undefined,
                        },
                      })
                    }
                  />
                </label>
              </>
            )}
          </div>
        )}
      </div>

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
