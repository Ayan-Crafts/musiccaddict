mod commands;
mod error;
mod state;

use sonora_core::Database;
use tauri::Manager;
use tracing_subscriber::EnvFilter;

use crate::error::IpcError;
use crate::state::AppState;

pub fn run() {
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| EnvFilter::new("info,sonora=debug")),
        )
        .init();

    tauri::Builder::default()
        .setup(|app| {
            let data_dir = app.path().app_data_dir()?;
            let db = Database::open(data_dir.join("sonora.db")).map_err(IpcError::from);
            if let Err(e) = &db {
                tracing::error!(%e, "database unavailable; continuing in degraded mode");
            }
            app.manage(AppState::new(db, data_dir));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::app_info,
            commands::db_status,
            commands::get_setting,
            commands::set_setting,
            commands::backup_database,
        ])
        .run(tauri::generate_context!())
        .expect("error while running SONORA");
}
