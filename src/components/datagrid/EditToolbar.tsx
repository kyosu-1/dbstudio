import { Pencil, Plus, Trash2, Save, Undo2 } from "lucide-react";

interface Props {
  editMode: boolean;
  onToggleEdit: () => void;
  canEdit: boolean;
  updateCount: number;
  insertCount: number;
  deleteCount: number;
  onAddRow: () => void;
  onDeleteRow: () => void;
  onSave: () => void;
  onDiscard: () => void;
}

export function EditToolbar({
  editMode,
  onToggleEdit,
  canEdit,
  updateCount,
  insertCount,
  deleteCount,
  onAddRow,
  onDeleteRow,
  onSave,
  onDiscard,
}: Props) {
  const hasChanges = updateCount > 0 || insertCount > 0 || deleteCount > 0;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[var(--border)] bg-[var(--bg-secondary)] text-xs">
      <button
        onClick={onToggleEdit}
        disabled={!canEdit}
        className={`flex items-center gap-1 px-2 py-1 rounded border ${
          editMode
            ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10"
            : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
        } disabled:opacity-30`}
        title={canEdit ? "Toggle edit mode" : "Table has no primary key"}
      >
        <Pencil size={12} />
        Edit
      </button>

      {editMode && (
        <>
          <div className="w-px h-4 bg-[var(--border)]" />
          <button
            onClick={onAddRow}
            className="flex items-center gap-1 px-2 py-1 rounded border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
          >
            <Plus size={12} />
            Add Row
          </button>
          <button
            onClick={onDeleteRow}
            className="flex items-center gap-1 px-2 py-1 rounded border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
          >
            <Trash2 size={12} />
            Delete Row
          </button>
          <div className="w-px h-4 bg-[var(--border)]" />
          <button
            onClick={onSave}
            disabled={!hasChanges}
            className="flex items-center gap-1 px-2 py-1 rounded bg-[var(--accent)] text-[var(--bg-primary)] font-medium hover:bg-[var(--accent-hover)] disabled:opacity-30"
          >
            <Save size={12} />
            Save
          </button>
          <button
            onClick={onDiscard}
            disabled={!hasChanges}
            className="flex items-center gap-1 px-2 py-1 rounded border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] disabled:opacity-30"
          >
            <Undo2 size={12} />
            Discard
          </button>

          {hasChanges && (
            <span className="ml-auto text-[var(--text-muted)]">
              {updateCount > 0 && `${updateCount} updated`}
              {updateCount > 0 && (insertCount > 0 || deleteCount > 0) && ", "}
              {insertCount > 0 && `${insertCount} new`}
              {insertCount > 0 && deleteCount > 0 && ", "}
              {deleteCount > 0 && `${deleteCount} deleted`}
            </span>
          )}
        </>
      )}
    </div>
  );
}
