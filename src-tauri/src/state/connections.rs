use crate::ssh::tunnel::SshTunnel;
use sqlx::PgPool;
use std::collections::HashMap;
use std::sync::Mutex;

pub struct AppState {
    pub pools: Mutex<HashMap<String, PgPool>>,
    pub tunnels: Mutex<HashMap<String, SshTunnel>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            pools: Mutex::new(HashMap::new()),
            tunnels: Mutex::new(HashMap::new()),
        }
    }
}
