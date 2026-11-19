//! SONORA core: the database layer shared by every other module.
//!
//! This crate has no UI, OS-integration or audio dependencies so that it can be
//! unit-tested in isolation and reused by the Tauri app, CLI tools and tests.

pub mod backup;
pub mod db;
pub mod error;
pub mod migrations;
pub mod settings;

pub use db::{Database, DbStatus};
pub use error::{CoreError, Result};
