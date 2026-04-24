import type {
  SavedConnection,
  TableInfo,
  ColumnInfo,
  ColumnMeta,
  CompletionMetadata,
} from "./types";

export const DEMO_CONNECTION_ID = "demo-connection-001";

export const DEMO_CONNECTION: SavedConnection = {
  id: DEMO_CONNECTION_ID,
  name: "Demo Database",
  host: "localhost",
  port: 5432,
  database: "demo_ecommerce",
  username: "demo_user",
  password: "demo_password",
  ssl_mode: "disable",
};

export const DEMO_SCHEMAS = ["public"];

export const DEMO_TABLES: Record<string, TableInfo[]> = {
  public: [
    { name: "users", table_type: "BASE TABLE", estimated_rows: 8 },
    { name: "categories", table_type: "BASE TABLE", estimated_rows: 5 },
    { name: "products", table_type: "BASE TABLE", estimated_rows: 10 },
    { name: "orders", table_type: "BASE TABLE", estimated_rows: 12 },
    { name: "order_items", table_type: "BASE TABLE", estimated_rows: 25 },
    { name: "order_summary", table_type: "VIEW", estimated_rows: 12 },
  ],
};

export const DEMO_COLUMNS: Record<string, ColumnInfo[]> = {
  "public.users": [
    { name: "id", data_type: "integer", is_nullable: false, column_default: "nextval('users_id_seq')", is_primary_key: true, ordinal_position: 1 },
    { name: "name", data_type: "varchar(100)", is_nullable: false, column_default: null, is_primary_key: false, ordinal_position: 2 },
    { name: "email", data_type: "varchar(255)", is_nullable: false, column_default: null, is_primary_key: false, ordinal_position: 3 },
    { name: "age", data_type: "integer", is_nullable: true, column_default: null, is_primary_key: false, ordinal_position: 4 },
    { name: "is_active", data_type: "boolean", is_nullable: false, column_default: "true", is_primary_key: false, ordinal_position: 5 },
    { name: "created_at", data_type: "timestamp", is_nullable: false, column_default: "now()", is_primary_key: false, ordinal_position: 6 },
  ],
  "public.categories": [
    { name: "id", data_type: "integer", is_nullable: false, column_default: "nextval('categories_id_seq')", is_primary_key: true, ordinal_position: 1 },
    { name: "name", data_type: "varchar(50)", is_nullable: false, column_default: null, is_primary_key: false, ordinal_position: 2 },
    { name: "description", data_type: "text", is_nullable: true, column_default: null, is_primary_key: false, ordinal_position: 3 },
  ],
  "public.products": [
    { name: "id", data_type: "integer", is_nullable: false, column_default: "nextval('products_id_seq')", is_primary_key: true, ordinal_position: 1 },
    { name: "name", data_type: "varchar(200)", is_nullable: false, column_default: null, is_primary_key: false, ordinal_position: 2 },
    { name: "category_id", data_type: "integer", is_nullable: false, column_default: null, is_primary_key: false, ordinal_position: 3 },
    { name: "price", data_type: "numeric(10,2)", is_nullable: false, column_default: null, is_primary_key: false, ordinal_position: 4 },
    { name: "stock", data_type: "integer", is_nullable: false, column_default: "0", is_primary_key: false, ordinal_position: 5 },
    { name: "description", data_type: "text", is_nullable: true, column_default: null, is_primary_key: false, ordinal_position: 6 },
    { name: "is_available", data_type: "boolean", is_nullable: false, column_default: "true", is_primary_key: false, ordinal_position: 7 },
    { name: "created_at", data_type: "timestamp", is_nullable: false, column_default: "now()", is_primary_key: false, ordinal_position: 8 },
  ],
  "public.orders": [
    { name: "id", data_type: "integer", is_nullable: false, column_default: "nextval('orders_id_seq')", is_primary_key: true, ordinal_position: 1 },
    { name: "user_id", data_type: "integer", is_nullable: false, column_default: null, is_primary_key: false, ordinal_position: 2 },
    { name: "status", data_type: "varchar(20)", is_nullable: false, column_default: "'pending'", is_primary_key: false, ordinal_position: 3 },
    { name: "total_amount", data_type: "numeric(10,2)", is_nullable: false, column_default: null, is_primary_key: false, ordinal_position: 4 },
    { name: "ordered_at", data_type: "timestamp", is_nullable: false, column_default: "now()", is_primary_key: false, ordinal_position: 5 },
  ],
  "public.order_items": [
    { name: "id", data_type: "integer", is_nullable: false, column_default: "nextval('order_items_id_seq')", is_primary_key: true, ordinal_position: 1 },
    { name: "order_id", data_type: "integer", is_nullable: false, column_default: null, is_primary_key: false, ordinal_position: 2 },
    { name: "product_id", data_type: "integer", is_nullable: false, column_default: null, is_primary_key: false, ordinal_position: 3 },
    { name: "quantity", data_type: "integer", is_nullable: false, column_default: null, is_primary_key: false, ordinal_position: 4 },
    { name: "unit_price", data_type: "numeric(10,2)", is_nullable: false, column_default: null, is_primary_key: false, ordinal_position: 5 },
  ],
  "public.order_summary": [
    { name: "order_id", data_type: "integer", is_nullable: false, column_default: null, is_primary_key: false, ordinal_position: 1 },
    { name: "customer_name", data_type: "varchar(100)", is_nullable: false, column_default: null, is_primary_key: false, ordinal_position: 2 },
    { name: "status", data_type: "varchar(20)", is_nullable: false, column_default: null, is_primary_key: false, ordinal_position: 3 },
    { name: "total_amount", data_type: "numeric(10,2)", is_nullable: false, column_default: null, is_primary_key: false, ordinal_position: 4 },
    { name: "item_count", data_type: "bigint", is_nullable: false, column_default: null, is_primary_key: false, ordinal_position: 5 },
    { name: "ordered_at", data_type: "timestamp", is_nullable: false, column_default: null, is_primary_key: false, ordinal_position: 6 },
  ],
};

export const DEMO_PRIMARY_KEYS: Record<string, string[]> = {
  "public.users": ["id"],
  "public.categories": ["id"],
  "public.products": ["id"],
  "public.orders": ["id"],
  "public.order_items": ["id"],
  "public.order_summary": [],
};

type Row = (string | number | boolean | null)[];

export const DEMO_ROWS: Record<string, { columns: ColumnMeta[]; rows: Row[] }> = {
  "public.users": {
    columns: [
      { name: "id", data_type: "integer" },
      { name: "name", data_type: "varchar(100)" },
      { name: "email", data_type: "varchar(255)" },
      { name: "age", data_type: "integer" },
      { name: "is_active", data_type: "boolean" },
      { name: "created_at", data_type: "timestamp" },
    ],
    rows: [
      [1, "Alice Johnson", "alice@example.com", 28, true, "2025-01-15 09:30:00"],
      [2, "Bob Smith", "bob@example.com", 35, true, "2025-01-20 14:00:00"],
      [3, "Charlie Brown", "charlie@example.com", 22, true, "2025-02-01 10:15:00"],
      [4, "Diana Prince", "diana@example.com", 31, false, "2025-02-10 16:45:00"],
      [5, "Eve Wilson", "eve@example.com", 27, true, "2025-03-05 08:00:00"],
      [6, "Frank Miller", "frank@example.com", 42, true, "2025-03-12 11:30:00"],
      [7, "Grace Lee", "grace@example.com", null, true, "2025-04-01 13:00:00"],
      [8, "Hank Davis", "hank@example.com", 29, false, "2025-04-15 09:00:00"],
    ],
  },
  "public.categories": {
    columns: [
      { name: "id", data_type: "integer" },
      { name: "name", data_type: "varchar(50)" },
      { name: "description", data_type: "text" },
    ],
    rows: [
      [1, "Electronics", "Smartphones, laptops, and gadgets"],
      [2, "Books", "Physical and digital books"],
      [3, "Clothing", "Apparel and accessories"],
      [4, "Home & Garden", "Furniture and garden supplies"],
      [5, "Sports", "Sports equipment and outdoor gear"],
    ],
  },
  "public.products": {
    columns: [
      { name: "id", data_type: "integer" },
      { name: "name", data_type: "varchar(200)" },
      { name: "category_id", data_type: "integer" },
      { name: "price", data_type: "numeric(10,2)" },
      { name: "stock", data_type: "integer" },
      { name: "description", data_type: "text" },
      { name: "is_available", data_type: "boolean" },
      { name: "created_at", data_type: "timestamp" },
    ],
    rows: [
      [1, "Wireless Mouse", 1, 29.99, 150, "Ergonomic wireless mouse with USB receiver", true, "2025-01-10 10:00:00"],
      [2, "Mechanical Keyboard", 1, 89.99, 75, "RGB mechanical keyboard with Cherry MX switches", true, "2025-01-10 10:00:00"],
      [3, "The Great Gatsby", 2, 12.99, 200, "Classic novel by F. Scott Fitzgerald", true, "2025-01-15 12:00:00"],
      [4, "Running Shoes", 5, 119.99, 45, "Lightweight running shoes for trail and road", true, "2025-02-01 09:00:00"],
      [5, "Cotton T-Shirt", 3, 24.99, 300, "Comfortable 100% cotton crew neck t-shirt", true, "2025-02-05 14:00:00"],
      [6, "Standing Desk", 4, 399.99, 20, "Electric height-adjustable standing desk", true, "2025-02-10 10:00:00"],
      [7, "Python Cookbook", 2, 45.99, 80, "Recipes for mastering Python 3", true, "2025-03-01 11:00:00"],
      [8, "Yoga Mat", 5, 34.99, 120, "Non-slip exercise yoga mat, 6mm thick", true, "2025-03-05 08:00:00"],
      [9, "Desk Lamp", 4, 49.99, 0, "LED desk lamp with adjustable brightness", false, "2025-03-10 15:00:00"],
      [10, "USB-C Hub", 1, 59.99, 90, "7-in-1 USB-C hub with HDMI, USB 3.0, SD card reader", true, "2025-03-15 10:00:00"],
    ],
  },
  "public.orders": {
    columns: [
      { name: "id", data_type: "integer" },
      { name: "user_id", data_type: "integer" },
      { name: "status", data_type: "varchar(20)" },
      { name: "total_amount", data_type: "numeric(10,2)" },
      { name: "ordered_at", data_type: "timestamp" },
    ],
    rows: [
      [1, 1, "completed", 119.98, "2025-02-01 10:30:00"],
      [2, 2, "completed", 12.99, "2025-02-05 14:20:00"],
      [3, 1, "shipped", 89.99, "2025-02-15 09:00:00"],
      [4, 3, "completed", 144.98, "2025-02-20 11:00:00"],
      [5, 5, "pending", 399.99, "2025-03-01 16:00:00"],
      [6, 2, "completed", 59.98, "2025-03-05 10:30:00"],
      [7, 6, "shipped", 45.99, "2025-03-10 13:00:00"],
      [8, 4, "cancelled", 24.99, "2025-03-12 08:45:00"],
      [9, 3, "completed", 179.98, "2025-03-15 14:30:00"],
      [10, 7, "pending", 34.99, "2025-03-20 10:00:00"],
      [11, 1, "shipped", 109.98, "2025-03-25 09:15:00"],
      [12, 5, "pending", 72.98, "2025-04-01 11:00:00"],
    ],
  },
  "public.order_items": {
    columns: [
      { name: "id", data_type: "integer" },
      { name: "order_id", data_type: "integer" },
      { name: "product_id", data_type: "integer" },
      { name: "quantity", data_type: "integer" },
      { name: "unit_price", data_type: "numeric(10,2)" },
    ],
    rows: [
      [1, 1, 1, 2, 29.99],
      [2, 1, 5, 1, 24.99],
      [3, 1, 3, 1, 12.99],
      [4, 2, 3, 1, 12.99],
      [5, 3, 2, 1, 89.99],
      [6, 4, 4, 1, 119.99],
      [7, 4, 5, 1, 24.99],
      [8, 5, 6, 1, 399.99],
      [9, 6, 1, 1, 29.99],
      [10, 6, 8, 1, 34.99],
      [11, 7, 7, 1, 45.99],
      [12, 8, 5, 1, 24.99],
      [13, 9, 2, 1, 89.99],
      [14, 9, 10, 1, 59.99],
      [15, 9, 8, 1, 34.99],
      [16, 10, 8, 1, 34.99],
      [17, 11, 10, 1, 59.99],
      [18, 11, 1, 1, 29.99],
      [19, 11, 5, 1, 24.99],
      [20, 12, 7, 1, 45.99],
      [21, 12, 3, 1, 12.99],
      [22, 12, 5, 1, 24.99],
      [23, 4, 8, 1, 34.99],
      [24, 6, 3, 1, 12.99],
      [25, 9, 5, 1, 24.99],
    ],
  },
  "public.order_summary": {
    columns: [
      { name: "order_id", data_type: "integer" },
      { name: "customer_name", data_type: "varchar(100)" },
      { name: "status", data_type: "varchar(20)" },
      { name: "total_amount", data_type: "numeric(10,2)" },
      { name: "item_count", data_type: "bigint" },
      { name: "ordered_at", data_type: "timestamp" },
    ],
    rows: [
      [1, "Alice Johnson", "completed", 119.98, 3, "2025-02-01 10:30:00"],
      [2, "Bob Smith", "completed", 12.99, 1, "2025-02-05 14:20:00"],
      [3, "Alice Johnson", "shipped", 89.99, 1, "2025-02-15 09:00:00"],
      [4, "Charlie Brown", "completed", 144.98, 3, "2025-02-20 11:00:00"],
      [5, "Eve Wilson", "pending", 399.99, 1, "2025-03-01 16:00:00"],
      [6, "Bob Smith", "completed", 59.98, 3, "2025-03-05 10:30:00"],
      [7, "Frank Miller", "shipped", 45.99, 1, "2025-03-10 13:00:00"],
      [8, "Diana Prince", "cancelled", 24.99, 1, "2025-03-12 08:45:00"],
      [9, "Charlie Brown", "completed", 179.98, 4, "2025-03-15 14:30:00"],
      [10, "Grace Lee", "pending", 34.99, 1, "2025-03-20 10:00:00"],
      [11, "Alice Johnson", "shipped", 109.98, 3, "2025-03-25 09:15:00"],
      [12, "Eve Wilson", "pending", 72.98, 3, "2025-04-01 11:00:00"],
    ],
  },
};

export const DEMO_COMPLETION_METADATA: CompletionMetadata = {
  schemas: ["public"],
  tables: DEMO_TABLES.public.map((t) => ({
    schema: "public",
    name: t.name,
    table_type: t.table_type,
  })),
  columns: Object.entries(DEMO_COLUMNS).flatMap(([key, cols]) => {
    const [schema, table] = key.split(".");
    return cols.map((c) => ({
      schema,
      table,
      name: c.name,
      data_type: c.data_type,
    }));
  }),
  functions: [
    { name: "count", description: "Count rows" },
    { name: "sum", description: "Sum values" },
    { name: "avg", description: "Average values" },
    { name: "min", description: "Minimum value" },
    { name: "max", description: "Maximum value" },
    { name: "now", description: "Current timestamp" },
    { name: "coalesce", description: "Return first non-null value" },
    { name: "lower", description: "Convert to lowercase" },
    { name: "upper", description: "Convert to uppercase" },
  ],
};

// Sample queries for the demo welcome
export const DEMO_SAMPLE_QUERIES = [
  {
    title: "List all users",
    sql: "SELECT * FROM users;",
  },
  {
    title: "Products by category",
    sql: `SELECT p.name AS product, c.name AS category, p.price, p.stock
FROM products p
JOIN categories c ON p.category_id = c.id
ORDER BY c.name, p.name;`,
  },
  {
    title: "Order summary per customer",
    sql: `SELECT u.name, COUNT(o.id) AS order_count, SUM(o.total_amount) AS total_spent
FROM users u
JOIN orders o ON u.id = o.user_id
GROUP BY u.name
ORDER BY total_spent DESC;`,
  },
  {
    title: "Recent pending orders",
    sql: `SELECT * FROM order_summary
WHERE status = 'pending'
ORDER BY ordered_at DESC;`,
  },
  {
    title: "Top selling products",
    sql: `SELECT p.name, SUM(oi.quantity) AS total_sold, SUM(oi.quantity * oi.unit_price) AS revenue
FROM order_items oi
JOIN products p ON oi.product_id = p.id
GROUP BY p.name
ORDER BY total_sold DESC
LIMIT 5;`,
  },
];
