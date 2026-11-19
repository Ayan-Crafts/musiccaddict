use std::path::PathBuf;

pub type Result<T, E = CoreError> = std::result::Result<T, E>;

#[derive(Debug, thiserror::Error)]
pub enum CoreError {
    #[error("database error: {0}")]
    Sqlite(#[from] rusqlite::Error),

    #[error("i/o error at {path}: {source}")]
    Io {
        path: PathBuf,
        #[source]
        source: std::io::Error,
    },

    #[error("serialisation error: {0}")]
    Json(#[from] serde_json::Error),

    #[error(
        "database schema version {found} is newer than this build supports ({supported}); \
         refusing to open it to avoid data loss"
    )]
    SchemaTooNew { found: u32, supported: u32 },

    #[error("migration {version} ({name}) failed: {source}")]
    Migration {
        version: u32,
        name: &'static str,
        #[source]
        source: rusqlite::Error,
    },

    #[error("invalid input: {0}")]
    InvalidInput(String),

    #[error("integrity check failed: {0}")]
    Integrity(String),
}

impl CoreError {
    /// Stable machine-readable code, forwarded to the frontend as `IpcError.code`.
    pub fn code(&self) -> &'static str {
        match self {
            CoreError::Sqlite(_) => "DB_ERROR",
            CoreError::Io { .. } => "IO_ERROR",
            CoreError::Json(_) => "JSON_ERROR",
            CoreError::SchemaTooNew { .. } => "SCHEMA_TOO_NEW",
            CoreError::Migration { .. } => "MIGRATION_FAILED",
            CoreError::InvalidInput(_) => "INVALID_INPUT",
            CoreError::Integrity(_) => "INTEGRITY_FAILED",
        }
    }
}
