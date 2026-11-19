//! Typed key/value settings stored as JSON in `user_settings`.

use rusqlite::{Connection, OptionalExtension};
use serde::{de::DeserializeOwned, Serialize};

use crate::error::{CoreError, Result};

/// Keys are lowercase dotted identifiers, e.g. `appearance.theme`.
pub fn validate_key(key: &str) -> Result<()> {
    let ok = !key.is_empty()
        && key.len() <= 128
        && key.bytes().all(|b| {
            b.is_ascii_lowercase() || b.is_ascii_digit() || matches!(b, b'.' | b'_' | b'-')
        })
        && !key.starts_with('.')
        && !key.ends_with('.');
    if ok {
        Ok(())
    } else {
        Err(CoreError::InvalidInput(format!(
            "invalid settings key: {key:?}"
        )))
    }
}

pub fn get_raw(conn: &Connection, key: &str) -> Result<Option<serde_json::Value>> {
    validate_key(key)?;
    let raw: Option<String> = conn
        .query_row(
            "SELECT value FROM user_settings WHERE key = ?1",
            [key],
            |r| r.get(0),
        )
        .optional()?;
    raw.map(|s| serde_json::from_str(&s).map_err(Into::into))
        .transpose()
}

pub fn get<T: DeserializeOwned>(conn: &Connection, key: &str) -> Result<Option<T>> {
    get_raw(conn, key)?
        .map(|v| serde_json::from_value(v).map_err(Into::into))
        .transpose()
}

pub fn set<T: Serialize + ?Sized>(conn: &Connection, key: &str, value: &T) -> Result<()> {
    validate_key(key)?;
    let json = serde_json::to_string(value)?;
    conn.execute(
        "INSERT INTO user_settings (key, value, updated_at)
         VALUES (?1, ?2, unixepoch('subsec') * 1000)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
        (key, json),
    )?;
    Ok(())
}

pub fn delete(conn: &Connection, key: &str) -> Result<bool> {
    validate_key(key)?;
    Ok(conn.execute("DELETE FROM user_settings WHERE key = ?1", [key])? > 0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn key_validation() {
        for good in [
            "appearance.theme",
            "audio.eq_preset",
            "a",
            "library.scan-on-start",
        ] {
            assert!(validate_key(good).is_ok(), "{good}");
        }
        for bad in ["", "Theme", ".x", "x.", "a b", "a/b", &"x".repeat(129)] {
            assert!(validate_key(bad).is_err(), "{bad}");
        }
    }
}
