use crate::db::types::{row_to_json_values, ColumnMeta};
use crate::state::connections::AppState;
use serde::Serialize;
use sqlx::{Column, Row};
use tauri::State;

#[derive(Debug, Serialize)]
pub struct FetchResult {
    pub columns: Vec<ColumnMeta>,
    pub rows: Vec<Vec<serde_json::Value>>,
    pub total_count: i64,
    pub page: i32,
    pub page_size: i32,
}

#[tauri::command]
pub async fn fetch_rows(
    connection_id: String,
    schema: String,
    table: String,
    page: i32,
    page_size: i32,
    sort_column: Option<String>,
    sort_direction: Option<String>,
    state: State<'_, AppState>,
) -> Result<FetchResult, String> {
    let pool = {
        let pools = state.pools.lock().map_err(|e| e.to_string())?;
        pools.get(&connection_id).cloned().ok_or("Not connected")?
    };

    let offset = (page - 1) * page_size;

    let order_clause = match (&sort_column, &sort_direction) {
        (Some(col), Some(dir)) => {
            let dir = if dir.to_uppercase() == "DESC" {
                "DESC"
            } else {
                "ASC"
            };
            format!("ORDER BY \"{}\" {}", col.replace('"', "\"\""), dir)
        }
        _ => String::new(),
    };

    let count_sql = format!(
        "SELECT count(*) FROM \"{}\".\"{}\"",
        schema.replace('"', "\"\""),
        table.replace('"', "\"\"")
    );
    let count_row: (i64,) = sqlx::query_as(&count_sql)
        .fetch_one(&pool)
        .await
        .map_err(|e| e.to_string())?;

    let data_sql = format!(
        "SELECT * FROM \"{}\".\"{}\" {} LIMIT {} OFFSET {}",
        schema.replace('"', "\"\""),
        table.replace('"', "\"\""),
        order_clause,
        page_size,
        offset
    );
    let rows = sqlx::query(&data_sql)
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;

    let columns: Vec<ColumnMeta> = if let Some(first) = rows.first() {
        first
            .columns()
            .iter()
            .map(|c| ColumnMeta {
                name: c.name().to_string(),
                data_type: c.type_info().to_string(),
            })
            .collect()
    } else {
        Vec::new()
    };

    let data: Vec<Vec<serde_json::Value>> = rows
        .iter()
        .map(|row| row_to_json_values(row, &columns))
        .collect();

    Ok(FetchResult {
        columns,
        rows: data,
        total_count: count_row.0,
        page,
        page_size,
    })
}
