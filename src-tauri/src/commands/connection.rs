use crate::config::storage::{self, SavedConnection};
use crate::db::pool;
use crate::state::connections::AppState;
use tauri::State;

#[tauri::command]
pub async fn list_saved_connections() -> Result<Vec<SavedConnection>, String> {
    Ok(storage::load_connections())
}

#[tauri::command]
pub async fn save_connection(connection: SavedConnection) -> Result<(), String> {
    let mut connections = storage::load_connections();
    if let Some(idx) = connections.iter().position(|c| c.id == connection.id) {
        connections[idx] = connection;
    } else {
        connections.push(connection);
    }
    storage::save_connections(&connections)
}

#[tauri::command]
pub async fn delete_connection(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let removed = {
        let mut pools = state.pools.lock().map_err(|e| e.to_string())?;
        pools.remove(&id)
    };
    if let Some(p) = removed {
        p.close().await;
    }
    let mut connections = storage::load_connections();
    connections.retain(|c| c.id != id);
    storage::save_connections(&connections)
}

#[tauri::command]
pub async fn test_connection(connection: SavedConnection) -> Result<String, String> {
    let conn_str = connection.connection_string();
    let p = pool::create_pool(&conn_str).await.map_err(|e| e.to_string())?;
    let version: (String,) = sqlx::query_as("SELECT version()")
        .fetch_one(&p)
        .await
        .map_err(|e| e.to_string())?;
    p.close().await;
    Ok(version.0)
}

#[tauri::command]
pub async fn connect(id: String, state: State<'_, AppState>) -> Result<String, String> {
    let connections = storage::load_connections();
    let conn = connections
        .iter()
        .find(|c| c.id == id)
        .ok_or("Connection not found")?;

    let conn_str = conn.connection_string();
    let p = pool::create_pool(&conn_str).await.map_err(|e| e.to_string())?;

    let version: (String,) = sqlx::query_as("SELECT version()")
        .fetch_one(&p)
        .await
        .map_err(|e| e.to_string())?;

    {
        let mut pools = state.pools.lock().map_err(|e| e.to_string())?;
        pools.insert(id, p);
    }

    Ok(version.0)
}

#[tauri::command]
pub async fn disconnect(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let removed = {
        let mut pools = state.pools.lock().map_err(|e| e.to_string())?;
        pools.remove(&id)
    };
    if let Some(p) = removed {
        p.close().await;
    }
    Ok(())
}
