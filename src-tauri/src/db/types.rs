use serde::Serialize;
use sqlx::postgres::PgRow;
use sqlx::Row;

#[derive(Debug, Serialize, Clone)]
pub struct ColumnMeta {
    pub name: String,
    pub data_type: String,
}

pub fn row_to_json_values(row: &PgRow, columns: &[ColumnMeta]) -> Vec<serde_json::Value> {
    columns
        .iter()
        .enumerate()
        .map(|(i, col)| column_value_to_json(row, i, &col.data_type))
        .collect()
}

fn column_value_to_json(row: &PgRow, idx: usize, _data_type: &str) -> serde_json::Value {
    // Try common types in order, falling back to string representation
    if let Ok(v) = row.try_get::<Option<bool>, _>(idx) {
        return match v {
            Some(b) => serde_json::Value::Bool(b),
            None => serde_json::Value::Null,
        };
    }
    if let Ok(v) = row.try_get::<Option<i32>, _>(idx) {
        return match v {
            Some(n) => serde_json::json!(n),
            None => serde_json::Value::Null,
        };
    }
    if let Ok(v) = row.try_get::<Option<i64>, _>(idx) {
        return match v {
            Some(n) => serde_json::json!(n),
            None => serde_json::Value::Null,
        };
    }
    if let Ok(v) = row.try_get::<Option<i16>, _>(idx) {
        return match v {
            Some(n) => serde_json::json!(n),
            None => serde_json::Value::Null,
        };
    }
    if let Ok(v) = row.try_get::<Option<f64>, _>(idx) {
        return match v {
            Some(n) => serde_json::json!(n),
            None => serde_json::Value::Null,
        };
    }
    if let Ok(v) = row.try_get::<Option<f32>, _>(idx) {
        return match v {
            Some(n) => serde_json::json!(n),
            None => serde_json::Value::Null,
        };
    }
    if let Ok(v) = row.try_get::<Option<serde_json::Value>, _>(idx) {
        return match v {
            Some(j) => j,
            None => serde_json::Value::Null,
        };
    }
    if let Ok(v) = row.try_get::<Option<chrono::NaiveDateTime>, _>(idx) {
        return match v {
            Some(dt) => serde_json::json!(dt.format("%Y-%m-%d %H:%M:%S").to_string()),
            None => serde_json::Value::Null,
        };
    }
    if let Ok(v) = row.try_get::<Option<chrono::DateTime<chrono::Utc>>, _>(idx) {
        return match v {
            Some(dt) => serde_json::json!(dt.to_rfc3339()),
            None => serde_json::Value::Null,
        };
    }
    if let Ok(v) = row.try_get::<Option<uuid::Uuid>, _>(idx) {
        return match v {
            Some(u) => serde_json::json!(u.to_string()),
            None => serde_json::Value::Null,
        };
    }
    if let Ok(v) = row.try_get::<Option<chrono::NaiveDate>, _>(idx) {
        return match v {
            Some(d) => serde_json::json!(d.format("%Y-%m-%d").to_string()),
            None => serde_json::Value::Null,
        };
    }
    if let Ok(v) = row.try_get::<Option<chrono::NaiveTime>, _>(idx) {
        return match v {
            Some(t) => serde_json::json!(t.format("%H:%M:%S").to_string()),
            None => serde_json::Value::Null,
        };
    }
    if let Ok(v) = row.try_get::<Option<Vec<u8>>, _>(idx) {
        return match v {
            Some(b) => serde_json::json!(format!("<binary {} bytes>", b.len())),
            None => serde_json::Value::Null,
        };
    }
    // Fallback: try as string
    match row.try_get::<Option<String>, _>(idx) {
        Ok(Some(s)) => serde_json::json!(s),
        Ok(None) => serde_json::Value::Null,
        Err(_) => serde_json::json!("<unsupported type>"),
    }
}
