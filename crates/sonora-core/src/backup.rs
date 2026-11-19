//! Online backups using SQLite's backup API (consistent even while in use).

use std::path::Path;

use rusqlite::{backup::Backup, Connection};

use crate::error::{CoreError, Result};

/// Copy the full database to `dest`, then verify the copy.
/// Refuses to overwrite an existing file.
pub fn backup_to(conn: &Connection, dest: &Path) -> Result<()> {
    if dest.exists() {
        return Err(CoreError::InvalidInput(format!(
            "backup destination already exists: {}",
            dest.display()
        )));
    }
    if let Some(parent) = dest.parent() {
        std::fs::create_dir_all(parent).map_err(|source| CoreError::Io {
            path: parent.to_path_buf(),
            source,
        })?;
    }

    let mut out = Connection::open(dest)?;
    {
        let b = Backup::new(conn, &mut out)?;
        b.run_to_completion(256, std::time::Duration::from_millis(0), None)?;
    }
    verify_integrity(&out)?;
    Ok(())
}

pub fn verify_integrity(conn: &Connection) -> Result<()> {
    let result: String = conn.query_row("PRAGMA integrity_check", [], |r| r.get(0))?;
    if result != "ok" {
        return Err(CoreError::Integrity(result));
    }
    let mut stmt = conn.prepare("PRAGMA foreign_key_check")?;
    let violations: Vec<String> = stmt
        .query_map([], |r| r.get::<_, String>(0))?
        .collect::<std::result::Result<_, _>>()?;
    if !violations.is_empty() {
        return Err(CoreError::Integrity(format!(
            "foreign key violations in: {}",
            violations.join(", ")
        )));
    }
    Ok(())
}
