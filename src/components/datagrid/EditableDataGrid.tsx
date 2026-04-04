import { useState, useCallback } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import type { ColumnMeta, UpdateChange } from "../../lib/types";
import { InlineEditor } from "./InlineEditor";
import { PopoverEditor } from "./PopoverEditor";
import { EditToolbar } from "./EditToolbar";
import { ConfirmDialog } from "./ConfirmDialog";

interface Props {
  columns: ColumnMeta[];
  rows: unknown[][];
  totalCount?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onSort?: (column: string, direction: "ASC" | "DESC") => void;
  sortColumn?: string;
  sortDirection?: string;
  primaryKeys: string[];
  onSave: (
    updates: UpdateChange[],
    inserts: Record<string, unknown>[],
    deletes: Record<string, unknown>[]
  ) => Promise<void>;
}

type CellEdit = {
  rowIdx: number;
  colIdx: number;
};

function CellValue({ value }: { value: unknown }) {
  if (value === null) {
    return <span className="text-[var(--text-muted)] italic">NULL</span>;
  }
  if (typeof value === "boolean") {
    return (
      <span className={value ? "text-[var(--success)]" : "text-[var(--error)]"}>
        {value ? "true" : "false"}
      </span>
    );
  }
  if (typeof value === "object") {
    return (
      <span className="text-[var(--accent)] cursor-pointer" title={JSON.stringify(value, null, 2)}>
        {JSON.stringify(value)}
      </span>
    );
  }
  return <span>{String(value)}</span>;
}

function needsPopover(value: unknown, dataType: string): boolean {
  const lower = dataType.toLowerCase();
  if (lower.includes("json") || lower.includes("jsonb")) return true;
  if (typeof value === "string" && value.length > 100) return true;
  return false;
}

export function EditableDataGrid({
  columns,
  rows: originalRows,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onSort,
  sortColumn,
  sortDirection,
  primaryKeys,
  onSave,
}: Props) {
  const canEdit = primaryKeys.length > 0;
  const [editMode, setEditMode] = useState(false);
  const [editingCell, setEditingCell] = useState<CellEdit | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Change tracking
  const [cellChanges, setCellChanges] = useState<
    Map<string, { rowIdx: number; colIdx: number; oldValue: unknown; newValue: unknown }>
  >(new Map());
  const [newRows, setNewRows] = useState<Record<string, unknown>[]>([]);
  const [deletedRowIndices, setDeletedRowIndices] = useState<Set<number>>(new Set());
  const [selectedRowIdx, setSelectedRowIdx] = useState<number | null>(null);

  const totalPages =
    totalCount !== undefined && pageSize ? Math.ceil(totalCount / pageSize) : 1;

  const getCellKey = (rowIdx: number, colIdx: number) => `${rowIdx}:${colIdx}`;

  const getDisplayValue = (rowIdx: number, colIdx: number): unknown => {
    const key = getCellKey(rowIdx, colIdx);
    const change = cellChanges.get(key);
    if (change) return change.newValue;
    return originalRows[rowIdx]?.[colIdx];
  };

  const handleCellSave = useCallback(
    (rowIdx: number, colIdx: number, newValue: unknown) => {
      const originalValue = originalRows[rowIdx]?.[colIdx];
      const key = getCellKey(rowIdx, colIdx);

      if (newValue === originalValue || (newValue === null && originalValue === null)) {
        setCellChanges((prev) => {
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
      } else {
        setCellChanges((prev) => {
          const next = new Map(prev);
          next.set(key, { rowIdx, colIdx, oldValue: originalValue, newValue });
          return next;
        });
      }
      setEditingCell(null);
    },
    [originalRows]
  );

  const handleAddRow = () => {
    const emptyRow: Record<string, unknown> = {};
    columns.forEach((col) => {
      emptyRow[col.name] = null;
    });
    setNewRows((prev) => [...prev, emptyRow]);
  };

  const handleDeleteRow = () => {
    if (selectedRowIdx === null) return;
    setDeletedRowIndices((prev) => {
      const next = new Set(prev);
      if (next.has(selectedRowIdx)) {
        next.delete(selectedRowIdx);
      } else {
        next.add(selectedRowIdx);
      }
      return next;
    });
  };

  const handleDiscard = () => {
    setCellChanges(new Map());
    setNewRows([]);
    setDeletedRowIndices(new Set());
    setEditingCell(null);
    setSelectedRowIdx(null);
  };

  const buildChanges = () => {
    const updatesByRow = new Map<number, UpdateChange[]>();
    cellChanges.forEach(({ rowIdx, colIdx, oldValue, newValue }) => {
      const pk: Record<string, unknown> = {};
      primaryKeys.forEach((pkCol) => {
        const pkColIdx = columns.findIndex((c) => c.name === pkCol);
        if (pkColIdx >= 0) pk[pkCol] = originalRows[rowIdx][pkColIdx];
      });
      const change: UpdateChange = {
        pk,
        column: columns[colIdx].name,
        old_value: oldValue,
        new_value: newValue,
      };
      if (!updatesByRow.has(rowIdx)) updatesByRow.set(rowIdx, []);
      updatesByRow.get(rowIdx)!.push(change);
    });
    const updates = Array.from(updatesByRow.values()).flat();

    const deletes: Record<string, unknown>[] = [];
    deletedRowIndices.forEach((rowIdx) => {
      const pk: Record<string, unknown> = {};
      primaryKeys.forEach((pkCol) => {
        const pkColIdx = columns.findIndex((c) => c.name === pkCol);
        if (pkColIdx >= 0) pk[pkCol] = originalRows[rowIdx][pkColIdx];
      });
      deletes.push(pk);
    });

    return { updates, inserts: newRows, deletes };
  };

  const handleSaveConfirm = async () => {
    const { updates, inserts, deletes } = buildChanges();
    await onSave(updates, inserts, deletes);
    handleDiscard();
    setShowConfirm(false);
  };

  const updateCount = new Set(
    Array.from(cellChanges.values()).map((c) => c.rowIdx)
  ).size;

  return (
    <div className="flex flex-col h-full">
      <EditToolbar
        editMode={editMode}
        onToggleEdit={() => {
          setEditMode(!editMode);
          if (editMode) handleDiscard();
        }}
        canEdit={canEdit}
        updateCount={updateCount}
        insertCount={newRows.length}
        deleteCount={deletedRowIndices.size}
        onAddRow={handleAddRow}
        onDeleteRow={handleDeleteRow}
        onSave={() => setShowConfirm(true)}
        onDiscard={handleDiscard}
      />

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 bg-[var(--bg-secondary)] z-10">
            <tr>
              <th className="px-2 py-1.5 text-left text-[var(--text-muted)] font-normal border-b border-[var(--border)] w-10">
                #
              </th>
              {columns.map((col) => (
                <th
                  key={col.name}
                  className="px-2 py-1.5 text-left font-medium border-b border-[var(--border)] cursor-pointer hover:bg-[var(--bg-hover)] select-none whitespace-nowrap"
                  onClick={() => {
                    if (!onSort) return;
                    const nextDir =
                      sortColumn === col.name && sortDirection === "ASC"
                        ? "DESC"
                        : "ASC";
                    onSort(col.name, nextDir);
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span>{col.name}</span>
                    <span className="text-[var(--text-muted)] text-[10px]">
                      {col.data_type}
                    </span>
                    {sortColumn === col.name &&
                      (sortDirection === "ASC" ? (
                        <ArrowUp size={10} />
                      ) : (
                        <ArrowDown size={10} />
                      ))}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {originalRows.map((row, rowIdx) => {
              const isDeleted = deletedRowIndices.has(rowIdx);
              const isSelected = selectedRowIdx === rowIdx;
              return (
                <tr
                  key={rowIdx}
                  className={`border-b border-[var(--border)]/30 ${
                    isDeleted
                      ? "bg-[var(--error)]/10 line-through opacity-60"
                      : isSelected && editMode
                      ? "bg-[var(--accent)]/10"
                      : "hover:bg-[var(--bg-surface)]"
                  }`}
                  onClick={() => editMode && setSelectedRowIdx(rowIdx)}
                >
                  <td className="px-2 py-1 text-[var(--text-muted)]">
                    {((page ?? 1) - 1) * (pageSize ?? originalRows.length) + rowIdx + 1}
                  </td>
                  {row.map((_cell, colIdx) => {
                    const displayValue = getDisplayValue(rowIdx, colIdx);
                    const isChanged = cellChanges.has(getCellKey(rowIdx, colIdx));
                    const isEditing =
                      editingCell?.rowIdx === rowIdx && editingCell?.colIdx === colIdx;

                    return (
                      <td
                        key={colIdx}
                        className={`px-2 py-1 max-w-[300px] relative ${
                          isChanged ? "bg-[var(--warning)]/15" : ""
                        } ${editMode && !isDeleted ? "cursor-pointer" : "truncate"}`}
                        onDoubleClick={() => {
                          if (!editMode || isDeleted) return;
                          setEditingCell({ rowIdx, colIdx });
                        }}
                      >
                        {isEditing ? (
                          needsPopover(displayValue, columns[colIdx].data_type) ? (
                            <PopoverEditor
                              value={displayValue}
                              dataType={columns[colIdx].data_type}
                              onSave={(v) => handleCellSave(rowIdx, colIdx, v)}
                              onCancel={() => setEditingCell(null)}
                            />
                          ) : (
                            <InlineEditor
                              value={displayValue}
                              dataType={columns[colIdx].data_type}
                              onSave={(v) => handleCellSave(rowIdx, colIdx, v)}
                              onCancel={() => setEditingCell(null)}
                              onTab={() => {
                                if (colIdx < columns.length - 1) {
                                  handleCellSave(rowIdx, colIdx, displayValue);
                                  setEditingCell({ rowIdx, colIdx: colIdx + 1 });
                                }
                              }}
                            />
                          )
                        ) : (
                          <CellValue value={displayValue} />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {/* New rows */}
            {newRows.map((newRow, nIdx) => (
              <tr
                key={`new-${nIdx}`}
                className="bg-[var(--success)]/10 border-b border-[var(--border)]/30"
              >
                <td className="px-2 py-1 text-[var(--success)] text-xs">+</td>
                {columns.map((col) => (
                  <td key={col.name} className="px-2 py-1 text-xs">
                    <input
                      className="w-full bg-transparent border-b border-[var(--border)] px-1 py-0.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                      value={newRow[col.name] === null ? "" : String(newRow[col.name])}
                      placeholder={col.name}
                      onChange={(e) => {
                        setNewRows((prev) =>
                          prev.map((r, i) =>
                            i === nIdx ? { ...r, [col.name]: e.target.value || null } : r
                          )
                        );
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {originalRows.length === 0 && newRows.length === 0 && (
          <div className="text-center py-8 text-[var(--text-muted)] text-sm">
            No data
          </div>
        )}
      </div>

      {onPageChange && totalCount !== undefined && page !== undefined && pageSize !== undefined && (
        <div className="flex items-center justify-between px-3 py-1.5 border-t border-[var(--border)] bg-[var(--bg-secondary)] text-xs text-[var(--text-secondary)]">
          <span>{totalCount.toLocaleString()} rows total</span>
          <div className="flex items-center gap-2">
            <button
              className="px-2 py-0.5 rounded border border-[var(--border)] hover:bg-[var(--bg-hover)] disabled:opacity-30"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              Prev
            </button>
            <span>
              {page} / {totalPages}
            </span>
            <button
              className="px-2 py-0.5 rounded border border-[var(--border)] hover:bg-[var(--bg-hover)] disabled:opacity-30"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showConfirm && (
        <ConfirmDialog
          updateCount={updateCount}
          insertCount={newRows.length}
          deleteCount={deletedRowIndices.size}
          onConfirm={handleSaveConfirm}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}
