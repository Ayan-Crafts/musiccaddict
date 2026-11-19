//! Thin command layer: validate input → call a crate → map errors.
//! Every command here is listed in API_DOCUMENTATION.md.

use serde::Serialize;
use serde_json::Value;
use sonora_core::{backup, settings, DbStatus};
use tauri::State;

use crate::error::{IpcError, IpcResult};
use crate::state::AppState;

const MAX_SETTING_BYTES: usize = 64 * 1024;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppInfo {
    pub name: &'static str,
    pub version: &'static str,
    pub os: &'static str,
    pub arch: &'static str,
    pub data_dir: String,
}

#[tauri::command]
pub fn app_info(state: State<'_, AppState>) -> AppInfo {
    AppInfo {
        name: "SONORA",
        version: env!("CARGO_PKG_VERSION"),
        os: std::env::consts::OS,
        arch: std::env::consts::ARCH,
        data_dir: state.data_dir.display().to_string(),
    }
}

#[tauri::command]
pub fn db_status(state: State<'_, AppState>) -> IpcResult<DbStatus> {
    Ok(state.db()?.status()?)
}

#[tauri::command]
pub fn get_setting(state: State<'_, AppState>, key: String) -> IpcResult<Option<Value>> {
    Ok(settings::get_raw(state.db()?.conn(), &key)?)
}

#[tauri::command]
pub fn set_setting(state: State<'_, AppState>, key: String, value: Value) -> IpcResult<()> {
    let size = serde_json::to_string(&value)
        .map(|s| s.len())
        .unwrap_or(usize::MAX);
    if size > MAX_SETTING_BYTES {
        return Err(IpcError::new("INVALID_INPUT", "setting value too large"));
    }
    Ok(settings::set(state.db()?.conn(), &key, &value)?)
}

/// Writes a verified backup into `<data_dir>/backups/` and returns its path.
#[tauri::command]
pub fn backup_database(state: State<'_, AppState>) -> IpcResult<String> {
    let stamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    let dest = state
        .data_dir
        .join("backups")
        .join(format!("sonora-{stamp}.db"));
    backup::backup_to(state.db()?.conn(), &dest)?;
    Ok(dest.display().to_string())
}
