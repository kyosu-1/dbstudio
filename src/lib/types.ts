export type SshAuth =
  | { type: "Password"; password: string }
  | { type: "PrivateKey"; private_key_path: string; passphrase?: string };

export interface SshConfig {
  enabled: boolean;
  host: string;
  port: number;
  username: string;
  auth: SshAuth;
}

export interface SavedConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl_mode: string;
  ssh?: SshConfig;
}

export interface TableInfo {
  name: string;
  table_type: string;
  estimated_rows: number;
}

export interface ColumnInfo {
  name: string;
  data_type: string;
  is_nullable: boolean;
  column_default: string | null;
  is_primary_key: boolean;
  ordinal_position: number;
}

export interface ColumnMeta {
  name: string;
  data_type: string;
}

export interface FetchResult {
  columns: ColumnMeta[];
  rows: (string | number | boolean | null)[][];
  total_count: number;
  page: number;
  page_size: number;
}

export type QueryResult =
  | {
      type: "Select";
      columns: ColumnMeta[];
      rows: (string | number | boolean | null)[][];
      row_count: number;
      execution_time_ms: number;
    }
  | {
      type: "Execute";
      rows_affected: number;
      execution_time_ms: number;
    }
  | {
      type: "Error";
      message: string;
      position: number | null;
    };

export interface Tab {
  id: string;
  type: "table" | "query";
  title: string;
  schema?: string;
  tableName?: string;
  sql?: string;
}

// --- Mutation types ---

export interface UpdateChange {
  pk: Record<string, unknown>;
  column: string;
  old_value: unknown;
  new_value: unknown;
}

export interface MutationResult {
  affected: number;
}

export interface ChangeSet {
  updates: UpdateChange[];
  inserts: Record<string, unknown>[];
  deletes: Record<string, unknown>[];
}

// --- Completion metadata types ---

export interface TableMeta2 {
  schema: string;
  name: string;
  table_type: string;
}

export interface ColumnMeta2 {
  schema: string;
  table: string;
  name: string;
  data_type: string;
}

export interface FunctionMeta {
  name: string;
  description: string;
}

export interface CompletionMetadata {
  schemas: string[];
  tables: TableMeta2[];
  columns: ColumnMeta2[];
  functions: FunctionMeta[];
}
