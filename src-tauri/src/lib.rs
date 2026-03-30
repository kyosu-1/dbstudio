mod commands;
mod config;
mod db;
mod ssh;
mod state;

use state::connections::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState::new())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::connection::list_saved_connections,
            commands::connection::save_connection,
            commands::connection::delete_connection,
            commands::connection::test_connection,
            commands::connection::connect,
            commands::connection::disconnect,
            commands::schema::list_schemas,
            commands::schema::list_tables,
            commands::schema::describe_table,
            commands::data::fetch_rows,
            commands::query::execute_sql,
            commands::query::explain_sql,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
