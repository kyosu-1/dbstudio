use crate::state::connections::AppState;
use serde::Serialize;
use tauri::State;

#[derive(Debug, Serialize)]
pub struct TableInfo {
    pub name: String,
    pub table_type: String,
    pub estimated_rows: i64,
}

#[derive(Debug, Serialize)]
pub struct ColumnInfo {
    pub name: String,
    pub data_type: String,
    pub is_nullable: bool,
    pub column_default: Option<String>,
    pub is_primary_key: bool,
    pub ordinal_position: i32,
}

fn get_pool(state: &AppState, id: &str) -> Result<sqlx::PgPool, String> {
    let pools = state.pools.lock().map_err(|e| e.to_string())?;
    pools.get(id).cloned().ok_or_else(|| "Not connected".to_string())
}

#[tauri::command]
pub async fn list_schemas(
    connection_id: String,
    state: State<'_, AppState>,
) -> Result<Vec<String>, String> {
    let pool = get_pool(&state, &connection_id)?;

    let rows: Vec<(String,)> = sqlx::query_as(
        "SELECT schema_name FROM information_schema.schemata
         WHERE schema_name NOT LIKE 'pg_%' AND schema_name != 'information_schema'
         ORDER BY schema_name",
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(rows.into_iter().map(|r| r.0).collect())
}

#[tauri::command]
pub async fn list_tables(
    connection_id: String,
    schema: String,
    state: State<'_, AppState>,
) -> Result<Vec<TableInfo>, String> {
    let pool = get_pool(&state, &connection_id)?;

    let rows: Vec<(String, String)> = sqlx::query_as(
        "SELECT table_name, table_type FROM information_schema.tables
         WHERE table_schema = $1
         ORDER BY table_name",
    )
    .bind(&schema)
    .fetch_all(&pool)
    .await
    .map_err(|e| e.to_string())?;

    let mut tables = Vec::new();
    for (name, table_type) in rows {
        let count: (Option<i64>,) = sqlx::query_as(
            "SELECT COALESCE(c.reltuples, 0)::bigint
             FROM pg_class c
             JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE c.relname = $1 AND n.nspname = $2",
        )
        .bind(&name)
        .bind(&schema)
        .fetch_one(&pool)
        .await
        .unwrap_or((Some(0),));

        tables.push(TableInfo {
            name,
            table_type,
            estimated_rows: count.0.unwrap_or(0),
        });
    }

    Ok(tables)
}

#[tauri::command]
pub async fn describe_table(
    connection_id: String,
    schema: String,
    table: String,
    state: State<'_, AppState>,
) -> Result<Vec<ColumnInfo>, String> {
    let pool = get_pool(&state, &connection_id)?;

    let rows: Vec<(String, String, String, Option<String>, i32)> = sqlx::query_as(
        "SELECT c.column_name, c.data_type, c.is_nullable, c.column_default, c.ordinal_position
         FROM information_schema.columns c
         WHERE c.table_schema = $1 AND c.table_name = $2
         ORDER BY c.ordinal_position",
    )
    .bind(&schema)
    .bind(&table)
    .fetch_all(&pool)
    .await
    .map_err(|e| e.to_string())?;

    let pk_rows: Vec<(String,)> = sqlx::query_as(
        "SELECT a.attname
         FROM pg_index i
         JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
         JOIN pg_class c ON c.oid = i.indrelid
         JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE i.indisprimary AND c.relname = $1 AND n.nspname = $2",
    )
    .bind(&table)
    .bind(&schema)
    .fetch_all(&pool)
    .await
    .unwrap_or_default();

    let pk_columns: Vec<String> = pk_rows.into_iter().map(|r| r.0).collect();

    Ok(rows
        .into_iter()
        .map(|(name, data_type, is_nullable, column_default, ordinal_position)| ColumnInfo {
            is_primary_key: pk_columns.contains(&name),
            name,
            data_type,
            is_nullable: is_nullable == "YES",
            column_default,
            ordinal_position,
        })
        .collect())
}
