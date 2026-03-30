import { useEffect, useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Table2,
  Eye,
  Layers,
} from "lucide-react";
import { useAppStore } from "../../store/appStore";
import { api } from "../../lib/tauri";
import type { TableInfo, ColumnInfo } from "../../lib/types";

export function TableTree() {
  const { activeConnectionId, addTab } = useAppStore();
  const [schemas, setSchemas] = useState<string[]>([]);
  const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(new Set());
  const [tables, setTables] = useState<Record<string, TableInfo[]>>({});
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [columns, setColumns] = useState<Record<string, ColumnInfo[]>>({});

  useEffect(() => {
    if (!activeConnectionId) {
      setSchemas([]);
      setTables({});
      return;
    }
    api.listSchemas(activeConnectionId).then(setSchemas);
  }, [activeConnectionId]);

  const toggleSchema = async (schema: string) => {
    const next = new Set(expandedSchemas);
    if (next.has(schema)) {
      next.delete(schema);
    } else {
      next.add(schema);
      if (!tables[schema] && activeConnectionId) {
        const t = await api.listTables(activeConnectionId, schema);
        setTables((prev) => ({ ...prev, [schema]: t }));
      }
    }
    setExpandedSchemas(next);
  };

  const toggleTable = async (schema: string, table: string) => {
    const key = `${schema}.${table}`;
    const next = new Set(expandedTables);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
      if (!columns[key] && activeConnectionId) {
        const cols = await api.describeTable(activeConnectionId, schema, table);
        setColumns((prev) => ({ ...prev, [key]: cols }));
      }
    }
    setExpandedTables(next);
  };

  const openTable = (schema: string, table: string) => {
    addTab({
      id: `table-${schema}-${table}`,
      type: "table",
      title: table,
      schema,
      tableName: table,
    });
  };

  if (!activeConnectionId) {
    return (
      <div className="px-3 py-4 text-xs text-[var(--text-muted)]">
        Connect to a database to browse tables
      </div>
    );
  }

  return (
    <div className="flex flex-col text-sm">
      <div className="px-3 py-2 border-b border-[var(--border)]">
        <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
          Tables
        </span>
      </div>
      {schemas.map((schema) => (
        <div key={schema}>
          <div
            className="flex items-center gap-1 px-3 py-1 cursor-pointer hover:bg-[var(--bg-hover)]"
            onClick={() => toggleSchema(schema)}
          >
            {expandedSchemas.has(schema) ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
            <Layers size={14} className="text-[var(--text-muted)]" />
            <span>{schema}</span>
          </div>
          {expandedSchemas.has(schema) &&
            tables[schema]?.map((t) => {
              const key = `${schema}.${t.name}`;
              return (
                <div key={t.name}>
                  <div
                    className="flex items-center gap-1 pl-8 pr-3 py-1 cursor-pointer hover:bg-[var(--bg-hover)]"
                    onClick={() => toggleTable(schema, t.name)}
                    onDoubleClick={() => openTable(schema, t.name)}
                  >
                    {expandedTables.has(key) ? (
                      <ChevronDown size={12} />
                    ) : (
                      <ChevronRight size={12} />
                    )}
                    {t.table_type === "VIEW" ? (
                      <Eye size={12} className="text-[var(--accent)]" />
                    ) : (
                      <Table2 size={12} className="text-[var(--accent)]" />
                    )}
                    <span
                      className="flex-1 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        openTable(schema, t.name);
                      }}
                    >
                      {t.name}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      ~{t.estimated_rows}
                    </span>
                  </div>
                  {expandedTables.has(key) && columns[key] && (
                    <div className="pl-14 pr-3">
                      {columns[key].map((col) => (
                        <div
                          key={col.name}
                          className="flex items-center gap-2 py-0.5 text-xs"
                        >
                          <span
                            className={
                              col.is_primary_key
                                ? "text-[var(--warning)] font-medium"
                                : "text-[var(--text-primary)]"
                            }
                          >
                            {col.is_primary_key ? "PK " : ""}
                            {col.name}
                          </span>
                          <span className="text-[var(--text-muted)]">
                            {col.data_type}
                          </span>
                          {col.is_nullable && (
                            <span className="text-[var(--text-muted)] italic">
                              null
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      ))}
    </div>
  );
}
