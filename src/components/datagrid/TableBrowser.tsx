import { useEffect, useState } from "react";
import { useAppStore } from "../../store/appStore";
import { api } from "../../lib/tauri";
import { DataGrid } from "./DataGrid";
import type { FetchResult } from "../../lib/types";
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

  const fetchData = async () => {
    if (!activeConnectionId) return;
    setLoading(true);
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
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [activeConnectionId, schema, tableName, page, sortColumn, sortDirection]);

  if (loading && !result) {
    return (
      <div className="flex items-center justify-center h-full gap-2 text-[var(--text-muted)]">
        <Loader2 size={16} className="animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  if (!result) return null;

  return (
    <DataGrid
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
    />
  );
}
