import { invoke } from "@tauri-apps/api/core";
import type {
  SavedConnection,
  TableInfo,
  ColumnInfo,
  FetchResult,
  QueryResult,
  UpdateChange,
  MutationResult,
  CompletionMetadata,
} from "./types";
import { demoApi } from "./demo-api";

type Api = typeof realApi;

const realApi = {
  listSavedConnections: () =>
    invoke<SavedConnection[]>("list_saved_connections"),

  saveConnection: (connection: SavedConnection) =>
    invoke<void>("save_connection", { connection }),

  deleteConnection: (id: string) =>
    invoke<void>("delete_connection", { id }),

  testConnection: (connection: SavedConnection) =>
    invoke<string>("test_connection", { connection }),

  connect: (id: string) => invoke<string>("connect", { id }),

  disconnect: (id: string) => invoke<void>("disconnect", { id }),

  listSchemas: (connectionId: string) =>
    invoke<string[]>("list_schemas", { connectionId }),

  listTables: (connectionId: string, schema: string) =>
    invoke<TableInfo[]>("list_tables", { connectionId, schema }),

  describeTable: (connectionId: string, schema: string, table: string) =>
    invoke<ColumnInfo[]>("describe_table", { connectionId, schema, table }),

  fetchRows: (params: {
    connectionId: string;
    schema: string;
    table: string;
    page: number;
    pageSize: number;
    sortColumn?: string;
    sortDirection?: string;
  }) => invoke<FetchResult>("fetch_rows", params),

  executeSql: (connectionId: string, sql: string) =>
    invoke<QueryResult>("execute_sql", { connectionId, sql }),

  explainSql: (connectionId: string, sql: string) =>
    invoke<string>("explain_sql", { connectionId, sql }),

  getPrimaryKeys: (connectionId: string, schema: string, table: string) =>
    invoke<string[]>("get_primary_keys", { connectionId, schema, table }),

  updateRows: (
    connectionId: string,
    schema: string,
    table: string,
    changes: UpdateChange[]
  ) =>
    invoke<MutationResult>("update_rows", {
      connectionId,
      schema,
      table,
      changes,
    }),

  insertRows: (
    connectionId: string,
    schema: string,
    table: string,
    rows: Record<string, unknown>[]
  ) =>
    invoke<MutationResult>("insert_rows", {
      connectionId,
      schema,
      table,
      rows,
    }),

  deleteRows: (
    connectionId: string,
    schema: string,
    table: string,
    pkValues: Record<string, unknown>[]
  ) =>
    invoke<MutationResult>("delete_rows", {
      connectionId,
      schema,
      table,
      pkValues,
    }),

  getCompletionMetadata: (connectionId: string) =>
    invoke<CompletionMetadata>("get_completion_metadata", { connectionId }),
};

let _isDemoMode = false;

export function setDemoMode(enabled: boolean) {
  _isDemoMode = enabled;
}

export function isDemoMode(): boolean {
  return _isDemoMode;
}

// Proxy that delegates to the correct backend
export const api: Api = new Proxy(realApi, {
  get(_target, prop: string) {
    if (_isDemoMode) {
      return (demoApi as Record<string, unknown>)[prop];
    }
    return (realApi as Record<string, unknown>)[prop];
  },
});
