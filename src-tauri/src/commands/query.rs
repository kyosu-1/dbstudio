use crate::db::types::{row_to_json_values, ColumnMeta};
use crate::state::connections::AppState;
use serde::Serialize;
use sqlx::{Column, Row};
use std::time::Instant;
use tauri::State;

#[derive(Debug, Serialize)]
#[serde(tag = "type")]
pub enum QueryResult {
    Select {
        columns: Vec<ColumnMeta>,
        rows: Vec<Vec<serde_json::Value>>,
        row_count: usize,
        execution_time_ms: u64,
    },
    Execute {
        rows_affected: u64,
        execution_time_ms: u64,
    },
    Error {
        message: String,
        position: Option<usize>,
    },
}

#[tauri::command]
pub async fn execute_sql(
    connection_id: String,
    sql: String,
    state: State<'_, AppState>,
) -> Result<QueryResult, String> {
    let pool = {
        let pools = state.pools.lock().map_err(|e| e.to_string())?;
        pools.get(&connection_id).cloned().ok_or("Not connected")?
    };

    let trimmed = sql.trim().to_uppercase();
    let is_select = trimmed.starts_with("SELECT")
        || trimmed.starts_with("WITH")
        || trimmed.starts_with("EXPLAIN")
        || trimmed.starts_with("SHOW")
        || trimmed.starts_with("TABLE")
        || trimmed.starts_with("VALUES");

    let start = Instant::now();

    if is_select {
        match sqlx::query(&sql).fetch_all(&pool).await {
            Ok(rows) => {
                let elapsed = start.elapsed().as_millis() as u64;
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

                let row_count = rows.len();
                let data: Vec<Vec<serde_json::Value>> = rows
                    .iter()
                    .map(|row| row_to_json_values(row, &columns))
                    .collect();

                Ok(QueryResult::Select {
                    columns,
                    rows: data,
                    row_count,
                    execution_time_ms: elapsed,
                })
            }
            Err(e) => Ok(QueryResult::Error {
                message: e.to_string(),
                position: None,
            }),
        }
    } else {
        match sqlx::query(&sql).execute(&pool).await {
            Ok(result) => {
                let elapsed = start.elapsed().as_millis() as u64;
                Ok(QueryResult::Execute {
                    rows_affected: result.rows_affected(),
                    execution_time_ms: elapsed,
                })
            }
            Err(e) => Ok(QueryResult::Error {
                message: e.to_string(),
                position: None,
            }),
        }
    }
}

#[tauri::command]
pub async fn explain_sql(
    connection_id: String,
    sql: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let pool = {
        let pools = state.pools.lock().map_err(|e| e.to_string())?;
        pools.get(&connection_id).cloned().ok_or("Not connected")?
    };

    let explain_sql = format!("EXPLAIN ANALYZE {}", sql);
    let rows: Vec<(String,)> = sqlx::query_as(&explain_sql)
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(rows.into_iter().map(|r| r.0).collect::<Vec<_>>().join("\n"))
}
