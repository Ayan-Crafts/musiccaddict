//! Embedded, append-only SQL migrations tracked with `PRAGMA user_version`.

use rusqlite::Connection;

use crate::error::{CoreError, Result};

pub struct Migration {
    pub version: u32,
    pub name: &'static str,
    pub sql: &'static str,
}

/// Ordered list of migrations. Versions must be contiguous starting at 1.
pub const MIGRATIONS: &[Migration] = &[Migration {
    version: 1,
    name: "initial",
    sql: include_str!("../migrations/0001_initial.sql"),
}];

pub fn latest_version() -> u32 {
    MIGRATIONS.last().map_or(0, |m| m.version)
}

pub fn current_version(conn: &Connection) -> Result<u32> {
    Ok(conn.query_row("PRAGMA user_version", [], |r| r.get(0))?)
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MigrationReport {
    pub from: u32,
    pub to: u32,
    pub applied: Vec<u32>,
}

/// Apply every pending migration. Each migration runs in its own transaction
/// together with the `user_version` bump, so a failure leaves the database at
/// the last successfully applied version.
pub fn migrate(conn: &mut Connection) -> Result<MigrationReport> {
    let from = current_version(conn)?;
    let latest = latest_version();
    if from > latest {
        return Err(CoreError::SchemaTooNew {
            found: from,
            supported: latest,
        });
    }

    let mut applied = Vec::new();
    for m in MIGRATIONS.iter().filter(|m| m.version > from) {
        let tx = conn.transaction()?;
        tx.execute_batch(m.sql)
            .and_then(|_| tx.pragma_update(None, "user_version", m.version))
            .map_err(|source| CoreError::Migration {
                version: m.version,
                name: m.name,
                source,
            })?;
        tx.commit()?;
        tracing::info!(version = m.version, name = m.name, "applied migration");
        applied.push(m.version);
    }

    Ok(MigrationReport {
        from,
        to: current_version(conn)?,
        applied,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn versions_are_contiguous_from_one() {
        for (i, m) in MIGRATIONS.iter().enumerate() {
            assert_eq!(
                m.version as usize,
                i + 1,
                "migration {} out of order",
                m.name
            );
        }
    }
}
