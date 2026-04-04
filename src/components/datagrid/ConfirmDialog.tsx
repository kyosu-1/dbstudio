interface Props {
  updateCount: number;
  insertCount: number;
  deleteCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  updateCount,
  insertCount,
  deleteCount,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg shadow-xl p-4 max-w-sm">
        <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">
          Confirm Changes
        </h3>
        <div className="text-xs text-[var(--text-secondary)] space-y-1 mb-4">
          {updateCount > 0 && <div>Update {updateCount} row(s)</div>}
          {insertCount > 0 && <div>Insert {insertCount} row(s)</div>}
          {deleteCount > 0 && (
            <div className="text-[var(--error)]">Delete {deleteCount} row(s)</div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs rounded border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 text-xs rounded bg-[var(--accent)] text-[var(--bg-primary)] font-medium hover:bg-[var(--accent-hover)]"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}
