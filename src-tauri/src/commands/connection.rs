use crate::config::storage::{self, SavedConnection};
use crate::db::pool;
use crate::ssh::tunnel;
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
    let removed_pool = {
        let mut pools = state.pools.lock().map_err(|e| e.to_string())?;
        pools.remove(&id)
    };
    if let Some(p) = removed_pool {
        p.close().await;
    }
    let removed_tunnel = {
        let mut tunnels = state.tunnels.lock().map_err(|e| e.to_string())?;
        tunnels.remove(&id)
    };
    if let Some(t) = removed_tunnel {
        t.shutdown().await;
    }
    let mut connections = storage::load_connections();
    connections.retain(|c| c.id != id);
    storage::save_connections(&connections)
}

#[tauri::command]
pub async fn test_connection(connection: SavedConnection) -> Result<String, String> {
    let (conn_str, temp_tunnel) = if let Some(ref ssh_cfg) = connection.ssh {
        if ssh_cfg.enabled {
            let t = tunnel::start(ssh_cfg, &connection.host, connection.port).await?;
            let s = connection.connection_string_with("127.0.0.1", t.local_port());
            (s, Some(t))
        } else {
            (connection.connection_string(), None)
        }
    } else {
        (connection.connection_string(), None)
    };

    let p = pool::create_pool(&conn_str)
        .await
        .map_err(|e| e.to_string())?;
    let version: (String,) = sqlx::query_as("SELECT version()")
        .fetch_one(&p)
        .await
        .map_err(|e| e.to_string())?;
    p.close().await;

    if let Some(t) = temp_tunnel {
        t.shutdown().await;
    }

    Ok(version.0)
}

#[tauri::command]
pub async fn connect(id: String, state: State<'_, AppState>) -> Result<String, String> {
    let connections = storage::load_connections();
    let conn = connections
        .iter()
        .find(|c| c.id == id)
        .ok_or("Connection not found")?
        .clone();

    let (conn_host, conn_port) = if let Some(ref ssh_cfg) = conn.ssh {
        if ssh_cfg.enabled {
            let t = tunnel::start(ssh_cfg, &conn.host, conn.port).await?;
            let local_port = t.local_port();
            {
                let mut tunnels = state.tunnels.lock().map_err(|e| e.to_string())?;
                tunnels.insert(id.clone(), t);
            }
            ("127.0.0.1".to_string(), local_port)
        } else {
            (conn.host.clone(), conn.port)
        }
    } else {
        (conn.host.clone(), conn.port)
    };

    let conn_str = conn.connection_string_with(&conn_host, conn_port);
    let p = pool::create_pool(&conn_str)
        .await
        .map_err(|e| e.to_string())?;

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
    let removed_pool = {
        let mut pools = state.pools.lock().map_err(|e| e.to_string())?;
        pools.remove(&id)
    };
    if let Some(p) = removed_pool {
        p.close().await;
    }
    let removed_tunnel = {
        let mut tunnels = state.tunnels.lock().map_err(|e| e.to_string())?;
        tunnels.remove(&id)
    };
    if let Some(t) = removed_tunnel {
        t.shutdown().await;
    }
    Ok(())
}
