import { useEffect, useState, useCallback } from "react";
import { useAppStore } from "../../store/appStore";
import { api } from "../../lib/tauri";
import { EditableDataGrid } from "./EditableDataGrid";
import type { FetchResult, UpdateChange } from "../../lib/types";
import { Loader2 } from "lucide-react";

interface Props {
  schema: string;
  tableName: string;
}

export function TableBrowser({ schema, tableName }: Props) {
  const { activeConnectionId } = useAppStore();
  const [result, setResult] = useState<FetchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(100);
  const [sortColumn, setSortColumn] = useState<string | undefined>();
  const [sortDirection, setSortDirection] = useState<string | undefined>();
  const [primaryKeys, setPrimaryKeys] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!activeConnectionId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.fetchRows({
        connectionId: activeConnectionId,
        schema,
        table: tableName,
        page,
        pageSize,
        sortColumn,
        sortDirection,
      });
      setResult(data);
    } catch (e) {
      setError(String(e));
    }
    setLoading(false);
  }, [activeConnectionId, schema, tableName, page, pageSize, sortColumn, sortDirection]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!activeConnectionId) return;
    api
      .getPrimaryKeys(activeConnectionId, schema, tableName)
      .then(setPrimaryKeys)
      .catch(() => setPrimaryKeys([]));
  }, [activeConnectionId, schema, tableName]);

  const handleSave = async (
    updates: UpdateChange[],
    inserts: Record<string, unknown>[],
    deletes: Record<string, unknown>[]
  ) => {
    if (!activeConnectionId) return;
    try {
      if (updates.length > 0) {
        await api.updateRows(activeConnectionId, schema, tableName, updates);
      }
      if (inserts.length > 0) {
        await api.insertRows(activeConnectionId, schema, tableName, inserts);
      }
      if (deletes.length > 0) {
        await api.deleteRows(activeConnectionId, schema, tableName, deletes);
      }
      await fetchData();
    } catch (e) {
      setError(String(e));
      throw e;
    }
  };

  if (loading && !result) {
    return (
      <div className="flex items-center justify-center h-full gap-2 text-[var(--text-muted)]">
        <Loader2 size={16} className="animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  if (error && !result) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--error)] text-sm">
        {error}
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="flex flex-col h-full">
      {error && (
        <div className="px-3 py-1.5 text-xs text-[var(--error)] bg-[var(--error)]/10 border-b border-[var(--error)]/20">
          {error}
        </div>
      )}
      <EditableDataGrid
        columns={result.columns}
        rows={result.rows}
        totalCount={result.total_count}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onSort={(col, dir) => {
          setSortColumn(col);
          setSortDirection(dir);
          setPage(1);
        }}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        primaryKeys={primaryKeys}
        onSave={handleSave}
      />
    </div>
  );
}
