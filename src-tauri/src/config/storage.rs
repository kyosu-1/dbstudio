use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "type")]
pub enum SshAuth {
    Password { password: String },
    PrivateKey {
        private_key_path: String,
        passphrase: Option<String>,
    },
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SshConfig {
    pub enabled: bool,
    pub host: String,
    pub port: u16,
    pub username: String,
    pub auth: SshAuth,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SavedConnection {
    pub id: String,
    pub name: String,
    pub host: String,
    pub port: u16,
    pub database: String,
    pub username: String,
    pub password: String,
    #[serde(default = "default_ssl_mode")]
    pub ssl_mode: String,
    #[serde(default)]
    pub ssh: Option<SshConfig>,
}

fn default_ssl_mode() -> String {
    "prefer".to_string()
}

impl SavedConnection {
    pub fn connection_string(&self) -> String {
        self.connection_string_with(&self.host, self.port)
    }

    pub fn connection_string_with(&self, host: &str, port: u16) -> String {
        format!(
            "postgres://{}:{}@{}:{}/{}?sslmode={}",
            self.username, self.password, host, port, self.database, self.ssl_mode
        )
    }
}

fn config_path() -> PathBuf {
    let config_dir = dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("dbstudio");
    fs::create_dir_all(&config_dir).ok();
    config_dir.join("connections.json")
}

pub fn load_connections() -> Vec<SavedConnection> {
    let path = config_path();
    match fs::read_to_string(&path) {
        Ok(data) => serde_json::from_str(&data).unwrap_or_default(),
        Err(_) => Vec::new(),
    }
}

pub fn save_connections(connections: &[SavedConnection]) -> Result<(), String> {
    let path = config_path();
    let data = serde_json::to_string_pretty(connections).map_err(|e| e.to_string())?;
    fs::write(&path, data).map_err(|e| e.to_string())
}
