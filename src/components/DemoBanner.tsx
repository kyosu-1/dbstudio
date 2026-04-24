import { FlaskConical, X } from "lucide-react";

interface Props {
  onExit: () => void;
}

export function DemoBanner({ onExit }: Props) {
  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-[var(--accent)]/10 border-b border-[var(--accent)]/20 text-xs">
      <FlaskConical size={12} className="text-[var(--accent)]" />
      <span className="text-[var(--accent)]">
        Demo Mode
      </span>
      <span className="text-[var(--text-muted)]">
        — Sample e-commerce database with mock data
      </span>
      <button
        onClick={onExit}
        className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
      >
        <X size={11} />
        Exit Demo
      </button>
    </div>
  );
}
