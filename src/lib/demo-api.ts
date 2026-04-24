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
import {
  DEMO_CONNECTION_ID,
  DEMO_CONNECTION,
  DEMO_SCHEMAS,
  DEMO_TABLES,
  DEMO_COLUMNS,
  DEMO_PRIMARY_KEYS,
  DEMO_ROWS,
  DEMO_COMPLETION_METADATA,
} from "./demo-data";

// Deep-clone rows so mutations don't affect the original import
const demoRowStore: Record<string, (string | number | boolean | null)[][]> = {};

function getRows(tableKey: string): (string | number | boolean | null)[][] {
  if (!demoRowStore[tableKey] && DEMO_ROWS[tableKey]) {
    demoRowStore[tableKey] = DEMO_ROWS[tableKey].rows.map((r) => [...r]);
  }
  return demoRowStore[tableKey] ?? [];
}

function delay(ms: number = 50): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// Simple SQL executor for demo mode
function executeDemoSql(sqlRaw: string): QueryResult {
  const sql = sqlRaw.trim().replace(/;$/, "").trim();
  const upper = sql.toUpperCase();
  const startTime = performance.now();

  // SELECT queries
  if (upper.startsWith("SELECT") || upper.startsWith("WITH") || upper.startsWith("TABLE")) {
    const result = trySelectQuery(sql, upper);
    const elapsed = Math.round(performance.now() - startTime);
    if (result) {
      return {
        type: "Select",
        columns: result.columns,
        rows: result.rows,
        row_count: result.rows.length,
        execution_time_ms: elapsed + Math.floor(Math.random() * 20),
      };
    }
    return {
      type: "Error",
      message: `Demo mode: query executed but returned no matching demo data.\nTry querying one of: users, categories, products, orders, order_items, order_summary`,
      position: null,
    };
  }

  // INSERT
  if (upper.startsWith("INSERT")) {
    const elapsed = Math.round(performance.now() - startTime);
    return {
      type: "Execute",
      rows_affected: 1,
      execution_time_ms: elapsed + Math.floor(Math.random() * 10),
    };
  }

  // UPDATE
  if (upper.startsWith("UPDATE")) {
    const elapsed = Math.round(performance.now() - startTime);
    return {
      type: "Execute",
      rows_affected: Math.floor(Math.random() * 3) + 1,
      execution_time_ms: elapsed + Math.floor(Math.random() * 10),
    };
  }

  // DELETE
  if (upper.startsWith("DELETE")) {
    const elapsed = Math.round(performance.now() - startTime);
    return {
      type: "Execute",
      rows_affected: Math.floor(Math.random() * 2) + 1,
      execution_time_ms: elapsed + Math.floor(Math.random() * 10),
    };
  }

  // CREATE, ALTER, DROP
  if (upper.startsWith("CREATE") || upper.startsWith("ALTER") || upper.startsWith("DROP")) {
    const elapsed = Math.round(performance.now() - startTime);
    return {
      type: "Execute",
      rows_affected: 0,
      execution_time_ms: elapsed + Math.floor(Math.random() * 5),
    };
  }

  // EXPLAIN
  if (upper.startsWith("EXPLAIN")) {
    const elapsed = Math.round(performance.now() - startTime);
    return {
      type: "Select",
      columns: [{ name: "QUERY PLAN", data_type: "text" }],
      rows: [
        ["Seq Scan on users  (cost=0.00..1.08 rows=8 width=200) (actual time=0.01..0.02 rows=8 loops=1)"],
        ["Planning Time: 0.05 ms"],
        [`Execution Time: ${elapsed + Math.floor(Math.random() * 5)} ms`],
      ],
      row_count: 3,
      execution_time_ms: elapsed + Math.floor(Math.random() * 10),
    };
  }

  return {
    type: "Error",
    message: `Unsupported query in demo mode: ${sql.substring(0, 50)}...`,
    position: null,
  };
}

function trySelectQuery(
  sql: string,
  upper: string
): { columns: { name: string; data_type: string }[]; rows: (string | number | boolean | null)[][] } | null {
  // Try to identify the FROM table
  const fromMatch = upper.match(/FROM\s+(?:public\.)?(\w+)/);
  if (!fromMatch) return null;

  const tableName = fromMatch[1].toLowerCase();
  const tableKey = `public.${tableName}`;
  const tableData = DEMO_ROWS[tableKey];
  if (!tableData) return null;

  let columns = tableData.columns;
  let rows = getRows(tableKey);

  // Handle specific column selection (not SELECT *)
  const selectMatch = sql.match(/^SELECT\s+(.*?)\s+FROM/i);
  if (selectMatch) {
    const selectPart = selectMatch[1].trim();
    if (selectPart !== "*") {
      // Check for aggregate functions
      if (/\b(COUNT|SUM|AVG|MIN|MAX)\s*\(/i.test(selectPart)) {
        return handleAggregateQuery(sql, upper, tableName, tableKey);
      }
    }
  }

  // Handle WHERE clause (simple equality)
  const whereMatch = sql.match(/WHERE\s+(?:\w+\.)?(\w+)\s*=\s*'([^']+)'/i);
  if (whereMatch) {
    const [, colName, value] = whereMatch;
    const colIndex = columns.findIndex(
      (c) => c.name.toLowerCase() === colName.toLowerCase()
    );
    if (colIndex >= 0) {
      rows = rows.filter((r) => String(r[colIndex]).toLowerCase() === value.toLowerCase());
    }
  }

  // Handle numeric WHERE
  const whereNumMatch = sql.match(/WHERE\s+(?:\w+\.)?(\w+)\s*=\s*(\d+)/i);
  if (whereNumMatch && !whereMatch) {
    const [, colName, value] = whereNumMatch;
    const colIndex = columns.findIndex(
      (c) => c.name.toLowerCase() === colName.toLowerCase()
    );
    if (colIndex >= 0) {
      rows = rows.filter((r) => r[colIndex] === Number(value));
    }
  }

  // Handle WHERE with > or <
  const whereCompMatch = sql.match(/WHERE\s+(?:\w+\.)?(\w+)\s*(>|<|>=|<=)\s*(\d+(?:\.\d+)?)/i);
  if (whereCompMatch && !whereMatch && !whereNumMatch) {
    const [, colName, op, value] = whereCompMatch;
    const colIndex = columns.findIndex(
      (c) => c.name.toLowerCase() === colName.toLowerCase()
    );
    if (colIndex >= 0) {
      const num = Number(value);
      rows = rows.filter((r) => {
        const v = Number(r[colIndex]);
        if (isNaN(v)) return false;
        switch (op) {
          case ">": return v > num;
          case "<": return v < num;
          case ">=": return v >= num;
          case "<=": return v <= num;
          default: return true;
        }
      });
    }
  }

  // Handle ORDER BY
  const orderMatch = sql.match(/ORDER\s+BY\s+(?:\w+\.)?(\w+)(?:\s+(ASC|DESC))?/i);
  if (orderMatch) {
    const [, colName, dir] = orderMatch;
    const colIndex = columns.findIndex(
      (c) => c.name.toLowerCase() === colName.toLowerCase()
    );
    if (colIndex >= 0) {
      const direction = dir?.toUpperCase() === "DESC" ? -1 : 1;
      rows = [...rows].sort((a, b) => {
        const va = a[colIndex];
        const vb = b[colIndex];
        if (va === null) return 1;
        if (vb === null) return -1;
        if (typeof va === "number" && typeof vb === "number") return (va - vb) * direction;
        return String(va).localeCompare(String(vb)) * direction;
      });
    }
  }

  // Handle LIMIT
  const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
  if (limitMatch) {
    rows = rows.slice(0, Number(limitMatch[1]));
  }

  // Handle JOIN queries - return pre-computed results
  if (upper.includes("JOIN")) {
    const joinResult = handleJoinQuery(sql, upper);
    if (joinResult) return joinResult;
  }

  return { columns, rows };
}

function handleAggregateQuery(
  _sql: string,
  upper: string,
  _tableName: string,
  tableKey: string
): { columns: { name: string; data_type: string }[]; rows: (string | number | boolean | null)[][] } | null {
  const rows = getRows(tableKey);

  // COUNT(*)
  if (/SELECT\s+COUNT\s*\(\s*\*\s*\)/i.test(upper)) {
    return {
      columns: [{ name: "count", data_type: "bigint" }],
      rows: [[rows.length]],
    };
  }

  // GROUP BY queries - provide pre-computed results for common patterns
  if (upper.includes("GROUP BY")) {
    // orders grouped by status
    if (tableKey === "public.orders" && upper.includes("STATUS")) {
      return {
        columns: [
          { name: "status", data_type: "varchar(20)" },
          { name: "count", data_type: "bigint" },
        ],
        rows: [
          ["completed", 4],
          ["shipped", 3],
          ["pending", 3],
          ["cancelled", 1],
        ],
      };
    }
  }

  // Fallback: just return count
  return {
    columns: [{ name: "count", data_type: "bigint" }],
    rows: [[rows.length]],
  };
}

function handleJoinQuery(
  _sql: string,
  upper: string
): { columns: { name: string; data_type: string }[]; rows: (string | number | boolean | null)[][] } | null {
  // Products with categories
  if (upper.includes("PRODUCTS") && upper.includes("CATEGORIES")) {
    return {
      columns: [
        { name: "product", data_type: "varchar(200)" },
        { name: "category", data_type: "varchar(50)" },
        { name: "price", data_type: "numeric(10,2)" },
        { name: "stock", data_type: "integer" },
      ],
      rows: [
        ["Python Cookbook", "Books", 45.99, 80],
        ["The Great Gatsby", "Books", 12.99, 200],
        ["Cotton T-Shirt", "Clothing", 24.99, 300],
        ["Mechanical Keyboard", "Electronics", 89.99, 75],
        ["USB-C Hub", "Electronics", 59.99, 90],
        ["Wireless Mouse", "Electronics", 29.99, 150],
        ["Desk Lamp", "Home & Garden", 49.99, 0],
        ["Standing Desk", "Home & Garden", 399.99, 20],
        ["Running Shoes", "Sports", 119.99, 45],
        ["Yoga Mat", "Sports", 34.99, 120],
      ],
    };
  }

  // Users with orders (aggregate)
  if (upper.includes("USERS") && upper.includes("ORDERS") && upper.includes("GROUP")) {
    return {
      columns: [
        { name: "name", data_type: "varchar(100)" },
        { name: "order_count", data_type: "bigint" },
        { name: "total_spent", data_type: "numeric(10,2)" },
      ],
      rows: [
        ["Alice Johnson", 3, 319.95],
        ["Charlie Brown", 2, 324.96],
        ["Eve Wilson", 2, 472.97],
        ["Bob Smith", 2, 72.97],
        ["Frank Miller", 1, 45.99],
        ["Grace Lee", 1, 34.99],
        ["Diana Prince", 1, 24.99],
      ],
    };
  }

  // Order items with products (top selling)
  if (upper.includes("ORDER_ITEMS") && upper.includes("PRODUCTS") && upper.includes("GROUP")) {
    const hasLimit = upper.match(/LIMIT\s+(\d+)/);
    const limit = hasLimit ? Number(hasLimit[1]) : 10;
    const allRows: (string | number | boolean | null)[][] = [
      ["Cotton T-Shirt", 5, 124.95],
      ["The Great Gatsby", 3, 38.97],
      ["Wireless Mouse", 3, 89.97],
      ["Yoga Mat", 3, 104.97],
      ["Mechanical Keyboard", 2, 179.98],
      ["USB-C Hub", 2, 119.98],
      ["Python Cookbook", 2, 91.98],
      ["Running Shoes", 1, 119.99],
      ["Standing Desk", 1, 399.99],
    ];
    return {
      columns: [
        { name: "name", data_type: "varchar(200)" },
        { name: "total_sold", data_type: "bigint" },
        { name: "revenue", data_type: "numeric(10,2)" },
      ],
      rows: allRows.slice(0, limit),
    };
  }

  return null;
}

export const demoApi = {
  listSavedConnections: async (): Promise<SavedConnection[]> => {
    await delay();
    return [DEMO_CONNECTION];
  },

  saveConnection: async (_connection: SavedConnection): Promise<void> => {
    await delay();
  },

  deleteConnection: async (_id: string): Promise<void> => {
    await delay();
  },

  testConnection: async (_connection: SavedConnection): Promise<string> => {
    await delay(300);
    return "Connection successful! (Demo mode)";
  },

  connect: async (_id: string): Promise<string> => {
    await delay(200);
    return "Connected to demo database";
  },

  disconnect: async (_id: string): Promise<void> => {
    await delay();
  },

  listSchemas: async (_connectionId: string): Promise<string[]> => {
    await delay();
    return DEMO_SCHEMAS;
  },

  listTables: async (_connectionId: string, schema: string): Promise<TableInfo[]> => {
    await delay();
    return DEMO_TABLES[schema] ?? [];
  },

  describeTable: async (
    _connectionId: string,
    schema: string,
    table: string
  ): Promise<ColumnInfo[]> => {
    await delay();
    return DEMO_COLUMNS[`${schema}.${table}`] ?? [];
  },

  fetchRows: async (params: {
    connectionId: string;
    schema: string;
    table: string;
    page: number;
    pageSize: number;
    sortColumn?: string;
    sortDirection?: string;
  }): Promise<FetchResult> => {
    await delay(100);
    const tableKey = `${params.schema}.${params.table}`;
    const tableData = DEMO_ROWS[tableKey];
    if (!tableData) {
      return { columns: [], rows: [], total_count: 0, page: params.page, page_size: params.pageSize };
    }

    let rows = getRows(tableKey);

    // Sort
    if (params.sortColumn) {
      const colIndex = tableData.columns.findIndex((c) => c.name === params.sortColumn);
      if (colIndex >= 0) {
        const dir = params.sortDirection === "DESC" ? -1 : 1;
        rows = [...rows].sort((a, b) => {
          const va = a[colIndex];
          const vb = b[colIndex];
          if (va === null) return 1;
          if (vb === null) return -1;
          if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
          return String(va).localeCompare(String(vb)) * dir;
        });
      }
    }

    // Paginate
    const start = (params.page - 1) * params.pageSize;
    const pageRows = rows.slice(start, start + params.pageSize);

    return {
      columns: tableData.columns,
      rows: pageRows,
      total_count: rows.length,
      page: params.page,
      page_size: params.pageSize,
    };
  },

  executeSql: async (_connectionId: string, sql: string): Promise<QueryResult> => {
    await delay(100);
    return executeDemoSql(sql);
  },

  explainSql: async (_connectionId: string, _sql: string): Promise<string> => {
    await delay(100);
    return `Seq Scan on users  (cost=0.00..1.08 rows=8 width=200) (actual time=0.012..0.015 rows=8 loops=1)
Planning Time: 0.052 ms
Execution Time: 0.031 ms`;
  },

  getPrimaryKeys: async (
    _connectionId: string,
    schema: string,
    table: string
  ): Promise<string[]> => {
    await delay();
    return DEMO_PRIMARY_KEYS[`${schema}.${table}`] ?? [];
  },

  updateRows: async (
    _connectionId: string,
    _schema: string,
    _table: string,
    changes: UpdateChange[]
  ): Promise<MutationResult> => {
    await delay(100);
    return { affected: changes.length };
  },

  insertRows: async (
    _connectionId: string,
    _schema: string,
    _table: string,
    rows: Record<string, unknown>[]
  ): Promise<MutationResult> => {
    await delay(100);
    return { affected: rows.length };
  },

  deleteRows: async (
    _connectionId: string,
    _schema: string,
    _table: string,
    pkValues: Record<string, unknown>[]
  ): Promise<MutationResult> => {
    await delay(100);
    return { affected: pkValues.length };
  },

  getCompletionMetadata: async (_connectionId: string): Promise<CompletionMetadata> => {
    await delay();
    return DEMO_COMPLETION_METADATA;
  },
};
