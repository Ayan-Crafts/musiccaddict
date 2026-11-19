use serde::Serialize;
use sonora_core::CoreError;

/// Error shape returned by every command. Mirrors `IpcError` in `src/lib/ipc.ts`.
#[derive(Debug, Clone, Serialize, thiserror::Error)]
#[error("{code}: {message}")]
pub struct IpcError {
    pub code: String,
    pub message: String,
}

impl IpcError {
    pub fn new(code: &str, message: impl Into<String>) -> Self {
        Self {
            code: code.to_owned(),
            message: message.into(),
        }
    }
}

impl From<CoreError> for IpcError {
    fn from(e: CoreError) -> Self {
        tracing::error!(error = %e, "core error");
        Self::new(e.code(), e.to_string())
    }
}

pub type IpcResult<T> = Result<T, IpcError>;
