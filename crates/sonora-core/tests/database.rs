use rusqlite::params;
use sonora_core::{backup, migrations, settings, CoreError, Database};

const REQUIRED_TABLES: &[&str] = &[
    "users",
    "spotify_accounts",
    "artists",
    "albums",
    "tracks",
    "audio_files",
    "track_identifiers",
    "playlists",
    "playlist_tracks",
    "genres",
    "playback_history",
    "listening_statistics",
    "favourites",
    "connected_devices",
    "device_profiles",
    "theme_configurations",
    "user_settings",
    "music_providers",
    "import_jobs",
    "transfer_jobs",
];

fn tables(db: &Database) -> Vec<String> {
    let mut stmt = db
        .conn()
        .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        .unwrap();
    stmt.query_map([], |r| r.get(0))
        .unwrap()
        .map(Result::unwrap)
        .collect()
}

#[test]
fn fresh_database_has_all_required_tables() {
    let db = Database::open_in_memory().unwrap();
    let t = tables(&db);
    for required in REQUIRED_TABLES {
        assert!(t.iter().any(|n| n == required), "missing table {required}");
    }
    assert_eq!(
        migrations::current_version(db.conn()).unwrap(),
        migrations::latest_version()
    );
    db.verify_integrity().unwrap();
}

#[test]
fn reopening_is_idempotent_and_persists_data() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("nested/sonora.db");
    {
        let db = Database::open(&path).unwrap();
        settings::set(db.conn(), "appearance.theme", "dark").unwrap();
    }
    let db = Database::open(&path).unwrap();
    let theme: Option<String> = settings::get(db.conn(), "appearance.theme").unwrap();
    assert_eq!(theme.as_deref(), Some("dark"));
    let mode: String = db
        .conn()
        .query_row("PRAGMA journal_mode", [], |r| r.get(0))
        .unwrap();
    assert_eq!(mode.to_lowercase(), "wal");
}

#[test]
fn refuses_database_from_newer_build() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("sonora.db");
    drop(Database::open(&path).unwrap());
    {
        let conn = rusqlite::Connection::open(&path).unwrap();
        conn.pragma_update(None, "user_version", migrations::latest_version() + 1)
            .unwrap();
    }
    match Database::open(&path) {
        Err(CoreError::SchemaTooNew { .. }) => {}
        Err(e) => panic!("unexpected error {e}"),
        Ok(_) => panic!("expected SchemaTooNew"),
    }
}

#[test]
fn foreign_keys_are_enforced() {
    let db = Database::open_in_memory().unwrap();
    let err = db
        .conn()
        .execute(
            "INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES (999, 999, 0)",
            [],
        )
        .unwrap_err();
    assert!(err.to_string().contains("FOREIGN KEY"), "{err}");
}

#[test]
fn track_can_have_many_files_and_spotify_id_is_separate_from_paths() {
    let db = Database::open_in_memory().unwrap();
    let c = db.conn();
    c.execute("INSERT INTO tracks (id, title, title_normalized, duration_ms) VALUES (1, 'Anbil Avan', 'anbil avan', 262000)", []).unwrap();
    c.execute("INSERT INTO track_identifiers (track_id, provider, external_id) VALUES (1, 'spotify', 'sp123')", []).unwrap();
    for (path, codec) in [("/music/a.mp3", "mp3"), ("/music/a.flac", "flac")] {
        c.execute(
            "INSERT INTO audio_files (track_id, path, file_size, modified_at, codec, last_scanned_at) VALUES (1, ?1, 100, 0, ?2, 0)",
            params![path, codec],
        ).unwrap();
    }
    let n: i64 = c
        .query_row(
            "SELECT COUNT(*) FROM audio_files WHERE track_id = 1",
            [],
            |r| r.get(0),
        )
        .unwrap();
    assert_eq!(n, 2);

    // Same Spotify id cannot be attached twice.
    c.execute("INSERT INTO tracks (id, title, title_normalized) VALUES (2, 'Anbil Avan (Live)', 'anbil avan')", []).unwrap();
    assert!(c.execute("INSERT INTO track_identifiers (track_id, provider, external_id) VALUES (2, 'spotify', 'sp123')", []).is_err());

    // Deleting the track keeps the user's files, just unlinks them.
    c.execute("DELETE FROM tracks WHERE id = 1", []).unwrap();
    let orphans: i64 = c
        .query_row(
            "SELECT COUNT(*) FROM audio_files WHERE track_id IS NULL",
            [],
            |r| r.get(0),
        )
        .unwrap();
    assert_eq!(orphans, 2);
    let ids: i64 = c
        .query_row("SELECT COUNT(*) FROM track_identifiers", [], |r| r.get(0))
        .unwrap();
    assert_eq!(ids, 0);
}

#[test]
fn playlist_allows_duplicate_entries_and_cascades() {
    let db = Database::open_in_memory().unwrap();
    let c = db.conn();
    c.execute(
        "INSERT INTO tracks (id, title, title_normalized) VALUES (1, 't', 't')",
        [],
    )
    .unwrap();
    c.execute("INSERT INTO playlists (id, name) VALUES (1, 'Mix')", [])
        .unwrap();
    for pos in 0..2 {
        c.execute(
            "INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES (1, 1, ?1)",
            [pos],
        )
        .unwrap();
    }
    c.execute("DELETE FROM playlists WHERE id = 1", []).unwrap();
    let n: i64 = c
        .query_row("SELECT COUNT(*) FROM playlist_tracks", [], |r| r.get(0))
        .unwrap();
    assert_eq!(n, 0);
}

#[test]
fn masstamilan_provider_starts_without_permission() {
    let db = Database::open_in_memory().unwrap();
    let (enabled, perm): (bool, String) = db
        .conn()
        .query_row(
            "SELECT enabled, permission_status FROM music_providers WHERE id = 'masstamilan'",
            [],
            |r| Ok((r.get(0)?, r.get(1)?)),
        )
        .unwrap();
    assert!(!enabled);
    assert_eq!(perm, "missing");
}

#[test]
fn check_constraints_reject_invalid_values() {
    let db = Database::open_in_memory().unwrap();
    let c = db.conn();
    assert!(c
        .execute(
            "INSERT INTO user_settings (key, value) VALUES ('k', 'not json')",
            []
        )
        .is_err());
    assert!(c
        .execute(
            "INSERT INTO playlists (name, kind) VALUES ('x', 'bogus')",
            []
        )
        .is_err());
    assert!(c
        .execute(
            "INSERT INTO favourites (entity_type, entity_id) VALUES ('song', 1)",
            []
        )
        .is_err());
}

#[test]
fn settings_roundtrip_typed_values() {
    let db = Database::open_in_memory().unwrap();
    let c = db.conn();
    assert_eq!(settings::get::<f32>(c, "audio.crossfade_s").unwrap(), None);
    settings::set(c, "audio.crossfade_s", &4.5f32).unwrap();
    settings::set(c, "audio.crossfade_s", &6.0f32).unwrap();
    assert_eq!(
        settings::get::<f32>(c, "audio.crossfade_s").unwrap(),
        Some(6.0)
    );
    assert!(settings::delete(c, "audio.crossfade_s").unwrap());
    assert!(settings::set(c, "Bad Key", &1).is_err());
}

#[test]
fn backup_produces_verified_copy_and_never_overwrites() {
    let dir = tempfile::tempdir().unwrap();
    let db = Database::open(dir.path().join("sonora.db")).unwrap();
    settings::set(db.conn(), "general.language", "ta").unwrap();

    let dest = dir.path().join("backups/sonora-1.db");
    backup::backup_to(db.conn(), &dest).unwrap();
    let copy = Database::open(&dest).unwrap();
    assert_eq!(
        settings::get::<String>(copy.conn(), "general.language")
            .unwrap()
            .as_deref(),
        Some("ta")
    );

    assert!(matches!(
        backup::backup_to(db.conn(), &dest),
        Err(CoreError::InvalidInput(_))
    ));
}

#[test]
fn status_reports_real_counts() {
    let db = Database::open_in_memory().unwrap();
    let s = db.status().unwrap();
    assert_eq!(
        (s.track_count, s.audio_file_count, s.playlist_count),
        (0, 0, 0)
    );
    assert_eq!(s.schema_version, s.latest_schema_version);
}
