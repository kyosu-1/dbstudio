import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  name: string;
  shortcut?: string;
  detail?: string;
  isActive: boolean;
  disabled?: boolean;
  matchIndices?: number[];
  onClick: () => void;
}

export function CommandItem({
  icon: Icon,
  name,
  shortcut,
  detail,
  isActive,
  disabled,
  matchIndices,
  onClick,
}: Props) {
  const renderName = () => {
    if (!matchIndices || matchIndices.length === 0) {
      return <span>{name}</span>;
    }
    const chars = name.split("");
    return (
      <span>
        {chars.map((char, i) =>
          matchIndices.includes(i) ? (
            <span key={i} className="text-[var(--accent)] font-semibold">
              {char}
            </span>
          ) : (
            <span key={i}>{char}</span>
          )
        )}
      </span>
    );
  };

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm ${
        isActive
          ? "bg-[var(--bg-hover)] text-[var(--text-primary)]"
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
      onClick={() => !disabled && onClick()}
    >
      <Icon size={14} className="shrink-0 text-[var(--text-muted)]" />
      <span className="flex-1 truncate">{renderName()}</span>
      {detail && (
        <span className="text-xs text-[var(--text-muted)] truncate max-w-[150px]">
          {detail}
        </span>
      )}
      {shortcut && (
        <kbd className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-surface)] border border-[var(--border)] rounded px-1.5 py-0.5 font-mono">
          {shortcut}
        </kbd>
      )}
    </div>
  );
}
