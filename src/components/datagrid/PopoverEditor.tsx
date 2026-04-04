import { useState, useRef, useEffect } from "react";
import { X, Check } from "lucide-react";

interface Props {
  value: unknown;
  dataType: string;
  onSave: (newValue: unknown) => void;
  onCancel: () => void;
}

export function PopoverEditor({ value, dataType, onSave, onCancel }: Props) {
  const isJson =
    dataType.toLowerCase().includes("json") ||
    dataType.toLowerCase().includes("jsonb");
  const initial = isJson
    ? typeof value === "object" && value !== null
      ? JSON.stringify(value, null, 2)
      : String(value ?? "")
    : String(value ?? "");

  const [text, setText] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSave = () => {
    if (isJson) {
      try {
        const parsed = JSON.parse(text);
        onSave(parsed);
      } catch {
        setError("Invalid JSON");
        return;
      }
    } else {
      onSave(text || null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="absolute z-50 bg-[var(--bg-primary)] border border-[var(--border)] rounded shadow-lg p-2 min-w-[300px] max-w-[500px]">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[var(--text-muted)]">
          {isJson ? "JSON Editor" : "Text Editor"} — Ctrl+Enter to save
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleSave}
            className="p-0.5 rounded hover:bg-[var(--bg-hover)] text-[var(--success)]"
          >
            <Check size={14} />
          </button>
          <button
            onClick={onCancel}
            className="p-0.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setError(null);
        }}
        onKeyDown={handleKeyDown}
        rows={8}
        className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded px-2 py-1 text-xs text-[var(--text-primary)] font-mono outline-none focus:border-[var(--accent)] resize-y"
      />
      {error && (
        <div className="text-xs text-[var(--error)] mt-1">{error}</div>
      )}
    </div>
  );
}
