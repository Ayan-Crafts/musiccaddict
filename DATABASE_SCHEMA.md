# SONORA — Database Schema

Source of truth: [crates/sonora-core/migrations/](crates/sonora-core/migrations/). This document explains the design; the SQL is authoritative.

- Engine: SQLite (bundled via `rusqlite`), WAL mode, `foreign_keys=ON`.
- Version tracking: `PRAGMA user_version`. Current schema: **v1**.
- Timestamps: INTEGER unix milliseconds, UTC.
- JSON columns are validated with `CHECK (json_valid(...))`.

## Entity overview

```
users ─┬─ spotify_accounts                (tokens live in the OS keyring, not here)
       │
artists ◄── track_artists ──► tracks ◄── track_identifiers   (spotify / musicbrainz ids)
   ▲                            │  ▲
albums ◄────────────────────────┘  ├── track_genres ──► genres
                                   ├── audio_files ──► library_folders
                                   │      ▲
                                   ├── match_candidates (track ↔ file, confidence, decision)
                                   ├── playlist_tracks ──► playlists
                                   ├── playback_history / listening_statistics / queue_items
                                   └── favourites (polymorphic: track|album|artist|playlist)

music_providers ── provider_compliance_log
device_profiles ◄── connected_devices ◄── transfer_jobs
import_jobs · theme_configurations · user_settings
```

## Key relationships

| Requirement | How the schema satisfies it |
|---|---|
| A track may have multiple local audio files | `audio_files.track_id` → `tracks.id` (many-to-one). Deleting a track sets it to NULL; **files are never deleted by cascade**. |
| A track may belong to multiple playlists | `playlist_tracks` join table; the same track may appear twice in one playlist (Spotify allows it), ordered by `position`. |
| Spotify IDs stored independently of file paths | `track_identifiers (provider, external_id)` unique; no path columns anywhere near it. |
| An audio file has its own metadata record | `audio_files` stores measured stream properties (codec, bitrate, sample rate, bit depth, VBR) *and* raw tags, separately from the canonical `tracks` row. |
| Distinct recordings never merged | `tracks.version_tag`, `language`, `explicit`, `isrc` distinguish recordings; matching works on `match_candidates`, not by name equality. |
| User edits are protected | `tracks.metadata_locked = 1` forces resync to ask; `match_candidates.status` keeps `confirmed`/`rejected` decisions. |
| Honest quality reporting | `audio_files.quality_flag` (`suspected_upscale` etc.) is set from analysis, never from filenames. |
| Provider compliance | `music_providers.permission_status` (`missing` for MassTamilan by default) + `provider_compliance_log`. |

## Tables

| Table | Purpose | Notable columns / constraints |
|---|---|---|
| `users` | Local profile (single row today; multi-profile ready) | — |
| `spotify_accounts` | Connected Spotify identity and granted scopes | `spotify_user_id` UNIQUE |
| `artists` | Canonical artists | `name_normalized` indexed; `musicbrainz_id` UNIQUE |
| `albums` | Canonical albums | `album_artist_id`, `release_year`, `artwork_cache_key` |
| `tracks` | Canonical recordings | `title_normalized`, `duration_ms`, `version_tag`, `isrc`, `metadata_locked` |
| `track_artists` | Many-to-many with role (`primary`, `featured`, `composer`, `lyricist`) | PK (track, artist, role) |
| `genres`, `track_genres` | Normalised genres | `name_normalized` UNIQUE |
| `track_identifiers` | External IDs | UNIQUE (provider, external_id) |
| `library_folders` | User-chosen roots for scanning | `path` UNIQUE, `last_scan_at` |
| `audio_files` | Physical files | `path` UNIQUE, `modified_at` + `file_size` for incremental scan, `content_hash` for duplicates, `is_missing` |
| `match_candidates` | Matching-engine output | `confidence` 0–100, `status` ∈ auto/pending/confirmed/rejected, `reasons` JSON |
| `playlists` | Manual, smart, imported, radio | `smart_rules` JSON, `station_style` JSON, UNIQUE (source_provider_id, external_id) |
| `playlist_tracks` | Ordered entries | index (playlist_id, position) |
| `favourites` | Favourite tracks/albums/artists/playlists | UNIQUE (entity_type, entity_id) |
| `playback_history` | One row per play | `played_ms`, `completed`, `skipped`, context |
| `listening_statistics` | Incrementally maintained aggregates per track | `play_count`, `last_played_at` indexed |
| `queue_items` | Persisted queue | ordered by `position` |
| `music_providers` | Provider registry, permission state, rate limits | seeded: local, manual, spotify, masstamilan |
| `provider_compliance_log` | Audit trail of provider activity | index (provider, time) |
| `device_profiles` | Portable player capabilities | codecs, sample rate, FS limits, folder template; 2 conservative built-ins |
| `connected_devices` | Devices seen before | `volume_uuid` UNIQUE, `transport` mass_storage/mtp |
| `import_jobs` | Scan / sync / import jobs with progress | status lifecycle |
| `transfer_jobs` | Device transfers with verification counters | `plan` JSON, `files_verified` |
| `theme_configurations` | Per-theme user overrides | `theme_id` UNIQUE |
| `user_settings` | Typed key → JSON value | key format `section.name` (validated in Rust) |

## Migrations, backup and restore

- New migration = new file `NNNN_name.sql` + entry in `MIGRATIONS` (`crates/sonora-core/src/migrations.rs`). Never edit a released migration.
- Each migration and its `user_version` bump commit atomically.
- Opening a DB whose version is **newer** than the build supports fails with `SCHEMA_TOO_NEW` instead of risking data loss.
- Before migrating an existing DB, `sonora.db.pre-vN.bak` is written next to it.
- Manual backups (`backup_database` command) use SQLite's online backup API, then run `integrity_check` + `foreign_key_check` on the copy.
- Restore (Phase 2): validate backup → close connections → swap files → reopen + migrate.

## Planned migrations

- **0002 (Phase 2)**: FTS5 virtual table for search + triggers; artwork cache table.
- **0003 (Phase 3)**: Spotify sync cursors / snapshot ids per playlist.
