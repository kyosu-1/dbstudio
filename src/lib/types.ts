export interface SavedConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl_mode: string;
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
