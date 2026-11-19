use std::path::{Path, PathBuf};

use rusqlite::Connection;
use serde::Serialize;

use crate::backup;
use crate::error::{CoreError, Result};
use crate::migrations;

/// Owns the SQLite connection. Open through [`Database::open`] so that pragmas,
/// pre-migration backups and migrations are always applied consistently.
pub struct Database {
    conn: Connection,
    path: Option<PathBuf>,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct DbStatus {
    pub path: Option<String>,
    pub schema_version: u32,
    pub latest_schema_version: u32,
    pub track_count: i64,
    pub audio_file_count: i64,
    pub playlist_count: i64,
    pub library_folder_count: i64,
}

impl Database {
    /// Open (or create) the database file, back it up if a migration is pending,
    /// and migrate it to the latest schema.
    pub fn open(path: impl AsRef<Path>) -> Result<Self> {
        let path = path.as_ref().to_path_buf();
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).map_err(|source| CoreError::Io {
                path: parent.to_path_buf(),
                source,
            })?;
        }

        let mut conn = Connection::open(&path)?;
        configure(&conn, true)?;

        let current = migrations::current_version(&conn)?;
        let latest = migrations::latest_version();
        if current > 0 && current < latest {
            let bak = path.with_extension(format!("db.pre-v{latest}.bak"));
            backup::backup_to(&conn, &bak)?;
            tracing::info!(backup = %bak.display(), "wrote pre-migration backup");
        }

        migrations::migrate(&mut conn)?;
        Ok(Self {
            conn,
            path: Some(path),
        })
    }

    /// In-memory database with the full schema; used by tests.
    pub fn open_in_memory() -> Result<Self> {
        let mut conn = Connection::open_in_memory()?;
        configure(&conn, false)?;
        migrations::migrate(&mut conn)?;
        Ok(Self { conn, path: None })
    }

    pub fn conn(&self) -> &Connection {
        &self.conn
    }

    pub fn conn_mut(&mut self) -> &mut Connection {
        &mut self.conn
    }

    pub fn path(&self) -> Option<&Path> {
        self.path.as_deref()
    }

    pub fn status(&self) -> Result<DbStatus> {
        let count = |table: &str| -> Result<i64> {
            Ok(self
                .conn
                .query_row(&format!("SELECT COUNT(*) FROM {table}"), [], |r| r.get(0))?)
        };
        Ok(DbStatus {
            path: self.path.as_ref().map(|p| p.display().to_string()),
            schema_version: migrations::current_version(&self.conn)?,
            latest_schema_version: migrations::latest_version(),
            track_count: count("tracks")?,
            audio_file_count: count("audio_files")?,
            playlist_count: count("playlists")?,
            library_folder_count: count("library_folders")?,
        })
    }

    /// Runs `PRAGMA integrity_check` and `foreign_key_check`.
    pub fn verify_integrity(&self) -> Result<()> {
        backup::verify_integrity(&self.conn)
    }
}

fn configure(conn: &Connection, on_disk: bool) -> Result<()> {
    conn.pragma_update(None, "foreign_keys", "ON")?;
    conn.busy_timeout(std::time::Duration::from_secs(5))?;
    if on_disk {
        // WAL lets the UI read while background jobs write.
        let mode: String = conn.query_row("PRAGMA journal_mode = WAL", [], |r| r.get(0))?;
        if !mode.eq_ignore_ascii_case("wal") {
            tracing::warn!(%mode, "could not enable WAL journal mode");
        }
        conn.pragma_update(None, "synchronous", "NORMAL")?;
    }
    Ok(())
}
