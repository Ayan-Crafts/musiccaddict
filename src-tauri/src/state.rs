use std::path::PathBuf;
use std::sync::{Mutex, MutexGuard};

use sonora_core::Database;

use crate::error::{IpcError, IpcResult};

/// Application-wide state managed by Tauri.
///
/// If the database fails to open, the app still starts and every DB-backed
/// command returns the original error, so the UI can explain what happened
/// instead of the process crashing on launch.
pub struct AppState {
    db: Result<Mutex<Database>, IpcError>,
    pub data_dir: PathBuf,
}

impl AppState {
    pub fn new(db: Result<Database, IpcError>, data_dir: PathBuf) -> Self {
        Self {
            db: db.map(Mutex::new),
            data_dir,
        }
    }

    pub fn db(&self) -> IpcResult<MutexGuard<'_, Database>> {
        match &self.db {
            Ok(m) => m
                .lock()
                .map_err(|_| IpcError::new("DB_POISONED", "database lock poisoned")),
            Err(e) => Err(e.clone()),
        }
    }
}
