use crate::state::connections::AppState;
use serde::Serialize;
use tauri::State;

#[derive(Debug, Serialize)]
pub struct TableMeta {
    pub schema: String,
    pub name: String,
    pub table_type: String,
}

#[derive(Debug, Serialize)]
pub struct ColumnMeta {
    pub schema: String,
    pub table: String,
    pub name: String,
    pub data_type: String,
}

#[derive(Debug, Serialize)]
pub struct FunctionMeta {
    pub name: String,
    pub description: String,
}

#[derive(Debug, Serialize)]
pub struct CompletionMetadata {
    pub schemas: Vec<String>,
    pub tables: Vec<TableMeta>,
    pub columns: Vec<ColumnMeta>,
    pub functions: Vec<FunctionMeta>,
}

fn get_pool(state: &AppState, id: &str) -> Result<sqlx::PgPool, String> {
    let pools = state.pools.lock().map_err(|e| e.to_string())?;
    pools
        .get(id)
        .cloned()
        .ok_or_else(|| "Not connected".to_string())
}

#[tauri::command]
pub async fn get_completion_metadata(
    connection_id: String,
    state: State<'_, AppState>,
) -> Result<CompletionMetadata, String> {
    let pool = get_pool(&state, &connection_id)?;

    let schema_rows: Vec<(String,)> = sqlx::query_as(
        "SELECT schema_name FROM information_schema.schemata
         WHERE schema_name NOT LIKE 'pg_%' AND schema_name != 'information_schema'
         ORDER BY schema_name",
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| e.to_string())?;
    let schemas: Vec<String> = schema_rows.into_iter().map(|r| r.0).collect();

    let table_rows: Vec<(String, String, String)> = sqlx::query_as(
        "SELECT table_schema, table_name, table_type
         FROM information_schema.tables
         WHERE table_schema NOT LIKE 'pg_%' AND table_schema != 'information_schema'
         ORDER BY table_schema, table_name",
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| e.to_string())?;
    let tables: Vec<TableMeta> = table_rows
        .into_iter()
        .map(|(schema, name, table_type)| TableMeta {
            schema,
            name,
            table_type,
        })
        .collect();

    let column_rows: Vec<(String, String, String, String)> = sqlx::query_as(
        "SELECT table_schema, table_name, column_name, data_type
         FROM information_schema.columns
         WHERE table_schema NOT LIKE 'pg_%' AND table_schema != 'information_schema'
         ORDER BY table_schema, table_name, ordinal_position",
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| e.to_string())?;
    let columns: Vec<ColumnMeta> = column_rows
        .into_iter()
        .map(|(schema, table, name, data_type)| ColumnMeta {
            schema,
            table,
            name,
            data_type,
        })
        .collect();

    let func_rows: Vec<(String, Option<String>)> = sqlx::query_as(
        "SELECT p.proname, d.description
         FROM pg_proc p
         JOIN pg_namespace n ON n.oid = p.pronamespace
         LEFT JOIN pg_description d ON d.objoid = p.oid
         WHERE n.nspname = 'pg_catalog'
           AND p.prokind = 'f'
           AND p.proname NOT LIKE '\\_%'
         ORDER BY p.proname
         LIMIT 200",
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| e.to_string())?;
    let functions: Vec<FunctionMeta> = func_rows
        .into_iter()
        .map(|(name, desc)| FunctionMeta {
            name,
            description: desc.unwrap_or_default(),
        })
        .collect();

    Ok(CompletionMetadata {
        schemas,
        tables,
        columns,
        functions,
    })
}
