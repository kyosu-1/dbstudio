use sqlx::PgPool;
use std::collections::HashMap;
use std::sync::Mutex;

pub struct AppState {
    pub pools: Mutex<HashMap<String, PgPool>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            pools: Mutex::new(HashMap::new()),
        }
    }
}
