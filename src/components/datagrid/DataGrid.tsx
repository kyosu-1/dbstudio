import { useState } from "react";
import type { ColumnMeta } from "../../lib/types";
import { ArrowUp, ArrowDown } from "lucide-react";

interface Props {
  columns: ColumnMeta[];
  rows: (string | number | boolean | null)[][];
  totalCount?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onSort?: (column: string, direction: "ASC" | "DESC") => void;
  sortColumn?: string;
  sortDirection?: string;
}

function CellValue({ value }: { value: string | number | boolean | null }) {
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

export function DataGrid({
  columns,
  rows,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onSort,
  sortColumn,
  sortDirection,
}: Props) {
  const totalPages =
    totalCount !== undefined && pageSize ? Math.ceil(totalCount / pageSize) : 1;

  return (
    <div className="flex flex-col h-full">
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
            {rows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className="hover:bg-[var(--bg-surface)] border-b border-[var(--border)]/30"
              >
                <td className="px-2 py-1 text-[var(--text-muted)]">
                  {((page ?? 1) - 1) * (pageSize ?? rows.length) + rowIdx + 1}
                </td>
                {row.map((cell, colIdx) => (
                  <td
                    key={colIdx}
                    className="px-2 py-1 max-w-[300px] truncate"
                  >
                    <CellValue value={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="text-center py-8 text-[var(--text-muted)] text-sm">
            No data
          </div>
        )}
      </div>

      {onPageChange && totalCount !== undefined && page !== undefined && pageSize !== undefined && (
        <div className="flex items-center justify-between px-3 py-1.5 border-t border-[var(--border)] bg-[var(--bg-secondary)] text-xs text-[var(--text-secondary)]">
          <span>
            {totalCount.toLocaleString()} rows total
          </span>
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
    </div>
  );
}
