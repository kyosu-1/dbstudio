use crate::state::connections::AppState;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Deserialize)]
pub struct UpdateChange {
    pub pk: std::collections::HashMap<String, serde_json::Value>,
    pub column: String,
    pub old_value: serde_json::Value,
    pub new_value: serde_json::Value,
}

#[derive(Debug, Serialize)]
pub struct MutationResult {
    pub affected: u64,
}

fn get_pool(state: &AppState, id: &str) -> Result<sqlx::PgPool, String> {
    let pools = state.pools.lock().map_err(|e| e.to_string())?;
    pools
        .get(id)
        .cloned()
        .ok_or_else(|| "Not connected".to_string())
}

fn escape_ident(s: &str) -> String {
    format!("\"{}\"", s.replace('"', "\"\""))
}

fn value_to_sql_literal(v: &serde_json::Value) -> String {
    match v {
        serde_json::Value::Null => "NULL".to_string(),
        serde_json::Value::Bool(b) => b.to_string(),
        serde_json::Value::Number(n) => n.to_string(),
        serde_json::Value::String(s) => format!("'{}'", s.replace('\'', "''")),
        other => format!("'{}'", other.to_string().replace('\'', "''")),
    }
}

#[tauri::command]
pub async fn get_primary_keys(
    connection_id: String,
    schema: String,
    table: String,
    state: State<'_, AppState>,
) -> Result<Vec<String>, String> {
    let pool = get_pool(&state, &connection_id)?;

    let rows: Vec<(String,)> = sqlx::query_as(
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
    .map_err(|e| e.to_string())?;

    Ok(rows.into_iter().map(|r| r.0).collect())
}

#[tauri::command]
pub async fn update_rows(
    connection_id: String,
    schema: String,
    table: String,
    changes: Vec<UpdateChange>,
    state: State<'_, AppState>,
) -> Result<MutationResult, String> {
    let pool = get_pool(&state, &connection_id)?;
    let mut total_affected: u64 = 0;

    for change in &changes {
        let set_clause = format!(
            "{} = {}",
            escape_ident(&change.column),
            value_to_sql_literal(&change.new_value)
        );

        let mut where_parts: Vec<String> = Vec::new();
        for (pk_col, pk_val) in &change.pk {
            where_parts.push(format!(
                "{} = {}",
                escape_ident(pk_col),
                value_to_sql_literal(pk_val)
            ));
        }
        if change.old_value.is_null() {
            where_parts.push(format!("{} IS NULL", escape_ident(&change.column)));
        } else {
            where_parts.push(format!(
                "{} = {}",
                escape_ident(&change.column),
                value_to_sql_literal(&change.old_value)
            ));
        }

        let sql = format!(
            "UPDATE {}.{} SET {} WHERE {}",
            escape_ident(&schema),
            escape_ident(&table),
            set_clause,
            where_parts.join(" AND ")
        );

        let result = sqlx::query(&sql)
            .execute(&pool)
            .await
            .map_err(|e| e.to_string())?;

        if result.rows_affected() == 0 {
            return Err(format!(
                "Row not found or value changed (column: {}). Another user may have modified it.",
                change.column
            ));
        }
        total_affected += result.rows_affected();
    }

    Ok(MutationResult {
        affected: total_affected,
    })
}

#[tauri::command]
pub async fn insert_rows(
    connection_id: String,
    schema: String,
    table: String,
    rows: Vec<std::collections::HashMap<String, serde_json::Value>>,
    state: State<'_, AppState>,
) -> Result<MutationResult, String> {
    let pool = get_pool(&state, &connection_id)?;
    let mut total_affected: u64 = 0;

    for row in &rows {
        if row.is_empty() {
            continue;
        }
        let columns: Vec<String> = row.keys().map(|k| escape_ident(k)).collect();
        let values: Vec<String> = row.values().map(|v| value_to_sql_literal(v)).collect();

        let sql = format!(
            "INSERT INTO {}.{} ({}) VALUES ({})",
            escape_ident(&schema),
            escape_ident(&table),
            columns.join(", "),
            values.join(", ")
        );

        let result = sqlx::query(&sql)
            .execute(&pool)
            .await
            .map_err(|e| e.to_string())?;
        total_affected += result.rows_affected();
    }

    Ok(MutationResult {
        affected: total_affected,
    })
}

#[tauri::command]
pub async fn delete_rows(
    connection_id: String,
    schema: String,
    table: String,
    pk_values: Vec<std::collections::HashMap<String, serde_json::Value>>,
    state: State<'_, AppState>,
) -> Result<MutationResult, String> {
    let pool = get_pool(&state, &connection_id)?;
    let mut total_affected: u64 = 0;

    for pk in &pk_values {
        let where_parts: Vec<String> = pk
            .iter()
            .map(|(col, val)| format!("{} = {}", escape_ident(col), value_to_sql_literal(val)))
            .collect();

        let sql = format!(
            "DELETE FROM {}.{} WHERE {}",
            escape_ident(&schema),
            escape_ident(&table),
            where_parts.join(" AND ")
        );

        let result = sqlx::query(&sql)
            .execute(&pool)
            .await
            .map_err(|e| e.to_string())?;
        total_affected += result.rows_affected();
    }

    Ok(MutationResult {
        affected: total_affected,
    })
}
