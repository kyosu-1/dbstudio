import {
  Database,
  Play,
  Table2,
  Terminal,
  Search,
  Pencil,
  ArrowRight,
} from "lucide-react";
import { DEMO_SAMPLE_QUERIES } from "../lib/demo-data";

interface Props {
  onStartDemo: () => void;
  onNewConnection: () => void;
}

export function WelcomeScreen({ onStartDemo, onNewConnection }: Props) {
  return (
    <div className="flex-1 flex items-center justify-center overflow-auto">
      <div className="max-w-2xl w-full px-8 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Database size={32} className="text-[var(--accent)]" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              DB Studio
            </h1>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            A modern PostgreSQL database client
          </p>
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          {/* Demo button */}
          <button
            onClick={onStartDemo}
            className="group flex flex-col items-start gap-3 p-5 rounded-lg border border-[var(--accent)] bg-[var(--accent)]/5 hover:bg-[var(--accent)]/10 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Play size={18} className="text-[var(--accent)]" />
              <span className="text-sm font-semibold text-[var(--accent)]">
                Start Demo
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Try DB Studio with sample e-commerce data.
              No database connection required.
            </p>
            <span className="flex items-center gap-1 text-xs text-[var(--accent)] group-hover:gap-2 transition-all">
              Launch <ArrowRight size={12} />
            </span>
          </button>

          {/* New connection */}
          <button
            onClick={onNewConnection}
            className="group flex flex-col items-start gap-3 p-5 rounded-lg border border-[var(--border)] hover:border-[var(--text-muted)] bg-[var(--bg-surface)]/50 hover:bg-[var(--bg-surface)] transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Database size={18} className="text-[var(--text-secondary)]" />
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                New Connection
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Connect to your PostgreSQL database with
              full SSH tunnel support.
            </p>
            <span className="flex items-center gap-1 text-xs text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] group-hover:gap-2 transition-all">
              Configure <ArrowRight size={12} />
            </span>
          </button>
        </div>

        {/* Features */}
        <div className="mb-10">
          <h2 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
            Features
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Table2, label: "Browse & edit table data" },
              { icon: Terminal, label: "SQL editor with autocomplete" },
              { icon: Search, label: "Schema explorer" },
              { icon: Pencil, label: "Inline CRUD operations" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-secondary)]"
              >
                <Icon size={13} className="text-[var(--text-muted)]" />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Sample queries preview */}
        <div>
          <h2 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
            Sample Queries in Demo
          </h2>
          <div className="flex flex-wrap gap-2">
            {DEMO_SAMPLE_QUERIES.map((q) => (
              <span
                key={q.title}
                className="px-2.5 py-1 rounded-full text-xs bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border)]"
              >
                {q.title}
              </span>
            ))}
          </div>
        </div>

        {/* Keyboard shortcut hint */}
        <div className="mt-8 text-center">
          <span className="text-xs text-[var(--text-muted)]">
            Press{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)] font-mono">
              Cmd+K
            </kbd>{" "}
            to open the command palette
          </span>
        </div>
      </div>
    </div>
  );
}
