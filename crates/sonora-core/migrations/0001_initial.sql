-- SONORA migration 0001 — initial schema.
-- Append-only: never edit this file after release; add 0002_*.sql instead.
-- Timestamps are INTEGER unix milliseconds (UTC).

-- ───────────────────────── Users & accounts ─────────────────────────

CREATE TABLE users (
    id            INTEGER PRIMARY KEY,
    display_name  TEXT    NOT NULL DEFAULT 'Listener',
    created_at    INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000)
);

-- OAuth tokens are NOT stored here; they live in the OS keyring keyed by spotify_user_id.
CREATE TABLE spotify_accounts (
    id               INTEGER PRIMARY KEY,
    user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    spotify_user_id  TEXT    NOT NULL UNIQUE,
    display_name     TEXT,
    granted_scopes   TEXT    NOT NULL DEFAULT '',
    connected_at     INTEGER NOT NULL,
    last_sync_at     INTEGER
);

-- ───────────────────────── Catalogue ─────────────────────────

CREATE TABLE artists (
    id               INTEGER PRIMARY KEY,
    name             TEXT NOT NULL,
    sort_name        TEXT,
    name_normalized  TEXT NOT NULL,
    musicbrainz_id   TEXT UNIQUE,
    created_at       INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000)
);
CREATE INDEX idx_artists_name_norm ON artists(name_normalized);

CREATE TABLE albums (
    id                      INTEGER PRIMARY KEY,
    title                   TEXT NOT NULL,
    title_normalized        TEXT NOT NULL,
    album_artist_id         INTEGER REFERENCES artists(id) ON DELETE SET NULL,
    release_date            TEXT,            -- ISO-8601, precision varies (YYYY, YYYY-MM, YYYY-MM-DD)
    release_year            INTEGER,
    total_tracks            INTEGER,
    total_discs             INTEGER,
    artwork_cache_key       TEXT,            -- content hash of cached artwork image
    musicbrainz_release_id  TEXT UNIQUE,
    created_at              INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000)
);
CREATE INDEX idx_albums_title_norm ON albums(title_normalized);
CREATE INDEX idx_albums_artist ON albums(album_artist_id);
CREATE INDEX idx_albums_year ON albums(release_year);

-- A track is a *recording*. Distinct recordings (live, remaster, language version,
-- clean/explicit) are distinct tracks even when titles are identical.
CREATE TABLE tracks (
    id                INTEGER PRIMARY KEY,
    title             TEXT NOT NULL,
    title_normalized  TEXT NOT NULL,
    album_id          INTEGER REFERENCES albums(id) ON DELETE SET NULL,
    track_number      INTEGER,
    disc_number       INTEGER,
    duration_ms       INTEGER,
    release_year      INTEGER,
    explicit          INTEGER NOT NULL DEFAULT 0 CHECK (explicit IN (0, 1)),
    version_tag       TEXT,            -- e.g. 'live', 'remastered 2011', 'acoustic', 'telugu version'
    language          TEXT,            -- BCP-47 where known
    isrc              TEXT,
    metadata_locked   INTEGER NOT NULL DEFAULT 0 CHECK (metadata_locked IN (0, 1)), -- user edited: resync must ask
    created_at        INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
    updated_at        INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000)
);
CREATE INDEX idx_tracks_title_norm ON tracks(title_normalized);
CREATE INDEX idx_tracks_album ON tracks(album_id, disc_number, track_number);
CREATE INDEX idx_tracks_isrc ON tracks(isrc);
CREATE INDEX idx_tracks_year ON tracks(release_year);

CREATE TABLE track_artists (
    track_id   INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    artist_id  INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    role       TEXT    NOT NULL DEFAULT 'primary' CHECK (role IN ('primary', 'featured', 'composer', 'lyricist')),
    position   INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (track_id, artist_id, role)
);
CREATE INDEX idx_track_artists_artist ON track_artists(artist_id);

CREATE TABLE genres (
    id               INTEGER PRIMARY KEY,
    name             TEXT NOT NULL,
    name_normalized  TEXT NOT NULL UNIQUE
);

CREATE TABLE track_genres (
    track_id  INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    genre_id  INTEGER NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
    PRIMARY KEY (track_id, genre_id)
);
CREATE INDEX idx_track_genres_genre ON track_genres(genre_id);

-- External identifiers (Spotify, MusicBrainz, ISRC …) — independent of file paths.
CREATE TABLE track_identifiers (
    id           INTEGER PRIMARY KEY,
    track_id     INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    provider     TEXT    NOT NULL,       -- 'spotify', 'musicbrainz', …
    external_id  TEXT    NOT NULL,
    created_at   INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
    UNIQUE (provider, external_id)
);
CREATE INDEX idx_track_identifiers_track ON track_identifiers(track_id);

-- ───────────────────────── Providers ─────────────────────────

CREATE TABLE music_providers (
    id                   TEXT PRIMARY KEY,   -- 'local', 'manual', 'spotify', 'masstamilan'
    display_name         TEXT    NOT NULL,
    enabled              INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0, 1)),
    -- automated capabilities only run when status is 'granted' or 'not_required'
    permission_status    TEXT    NOT NULL DEFAULT 'missing'
                         CHECK (permission_status IN ('not_required', 'granted', 'missing')),
    permission_evidence  TEXT,               -- reference to written permission / agreement
    rate_limit_per_min   INTEGER,
    config               TEXT    NOT NULL DEFAULT '{}' CHECK (json_valid(config)),
    updated_at           INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000)
);

INSERT INTO music_providers (id, display_name, enabled, permission_status) VALUES
    ('local',       'Local Music',            1, 'not_required'),
    ('manual',      'Manual Import',          1, 'not_required'),
    ('spotify',     'Spotify (metadata)',     0, 'not_required'),
    ('masstamilan', 'MassTamilan Discovery',  0, 'missing');

CREATE TABLE provider_compliance_log (
    id           INTEGER PRIMARY KEY,
    provider_id  TEXT    NOT NULL REFERENCES music_providers(id) ON DELETE CASCADE,
    event        TEXT    NOT NULL,     -- 'activated', 'permission_recorded', 'request', 'blocked', …
    detail       TEXT,
    created_at   INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000)
);
CREATE INDEX idx_compliance_provider_time ON provider_compliance_log(provider_id, created_at);

-- ───────────────────────── Files ─────────────────────────

CREATE TABLE library_folders (
    id            INTEGER PRIMARY KEY,
    path          TEXT    NOT NULL UNIQUE,
    enabled       INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
    watch         INTEGER NOT NULL DEFAULT 1 CHECK (watch IN (0, 1)),
    last_scan_at  INTEGER,
    created_at    INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000)
);

-- Every physical file has its own metadata record. track_id is NULL until identified.
CREATE TABLE audio_files (
    id                    INTEGER PRIMARY KEY,
    track_id              INTEGER REFERENCES tracks(id) ON DELETE SET NULL,
    library_folder_id     INTEGER REFERENCES library_folders(id) ON DELETE SET NULL,
    source_provider_id    TEXT    REFERENCES music_providers(id),
    path                  TEXT    NOT NULL UNIQUE,
    file_size             INTEGER NOT NULL,
    modified_at           INTEGER NOT NULL,    -- filesystem mtime, used for incremental scans
    content_hash          TEXT,                -- BLAKE3 of audio payload, for duplicate detection
    -- measured stream properties (never derived from the filename)
    container             TEXT,                -- 'mp3', 'flac', 'mp4', 'ogg', 'wav' …
    codec                 TEXT,                -- 'mp3', 'flac', 'aac', 'alac', 'vorbis', 'opus', 'pcm'
    bitrate_kbps          INTEGER,
    is_vbr                INTEGER CHECK (is_vbr IN (0, 1)),
    sample_rate_hz        INTEGER,
    bit_depth             INTEGER,
    channels              INTEGER,
    duration_ms           INTEGER,
    is_lossless           INTEGER NOT NULL DEFAULT 0 CHECK (is_lossless IN (0, 1)),
    -- 'ok', 'suspected_upscale' (spectral cutoff inconsistent with bitrate), 'corrupt', 'unsupported'
    quality_flag          TEXT    NOT NULL DEFAULT 'ok',
    -- raw tags as read from the file
    tag_title             TEXT,
    tag_artist            TEXT,
    tag_album             TEXT,
    tag_album_artist      TEXT,
    tag_track_number      INTEGER,
    tag_disc_number       INTEGER,
    tag_year              INTEGER,
    tag_genre             TEXT,
    has_embedded_artwork  INTEGER NOT NULL DEFAULT 0 CHECK (has_embedded_artwork IN (0, 1)),
    artwork_cache_key     TEXT,
    replaygain_track_db   REAL,
    replaygain_album_db   REAL,
    is_missing            INTEGER NOT NULL DEFAULT 0 CHECK (is_missing IN (0, 1)), -- file vanished from disk
    last_scanned_at       INTEGER NOT NULL
);
CREATE INDEX idx_audio_files_track ON audio_files(track_id);
CREATE INDEX idx_audio_files_hash ON audio_files(content_hash);
CREATE INDEX idx_audio_files_folder ON audio_files(library_folder_id);
CREATE INDEX idx_audio_files_codec ON audio_files(codec);

-- Candidate associations produced by the matching engine.
-- Auto matches set audio_files.track_id directly AND record a row here (status 'auto').
-- User decisions ('confirmed' / 'rejected') are never overwritten by a resync.
CREATE TABLE match_candidates (
    id             INTEGER PRIMARY KEY,
    track_id       INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    audio_file_id  INTEGER NOT NULL REFERENCES audio_files(id) ON DELETE CASCADE,
    confidence     REAL    NOT NULL CHECK (confidence BETWEEN 0 AND 100),
    status         TEXT    NOT NULL CHECK (status IN ('auto', 'pending', 'confirmed', 'rejected')),
    reasons        TEXT    NOT NULL DEFAULT '[]' CHECK (json_valid(reasons)),
    decided_at     INTEGER,
    created_at     INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
    UNIQUE (track_id, audio_file_id)
);
CREATE INDEX idx_match_candidates_status ON match_candidates(status);
CREATE INDEX idx_match_candidates_file ON match_candidates(audio_file_id);

-- ───────────────────────── Playlists ─────────────────────────

CREATE TABLE playlists (
    id                  INTEGER PRIMARY KEY,
    name                TEXT    NOT NULL,
    description         TEXT,
    artwork_path        TEXT,
    kind                TEXT    NOT NULL DEFAULT 'manual'
                        CHECK (kind IN ('manual', 'smart', 'imported', 'radio')),
    smart_rules         TEXT    CHECK (smart_rules IS NULL OR json_valid(smart_rules)),
    station_style       TEXT    CHECK (station_style IS NULL OR json_valid(station_style)), -- radio stations
    source_provider_id  TEXT    REFERENCES music_providers(id),
    external_id         TEXT,            -- e.g. Spotify playlist id
    created_at          INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
    updated_at          INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
    UNIQUE (source_provider_id, external_id)
);

-- The same track may appear more than once in a playlist (Spotify allows this).
CREATE TABLE playlist_tracks (
    id           INTEGER PRIMARY KEY,
    playlist_id  INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    track_id     INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    position     INTEGER NOT NULL,
    added_at     INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000)
);
CREATE INDEX idx_playlist_tracks_order ON playlist_tracks(playlist_id, position);
CREATE INDEX idx_playlist_tracks_track ON playlist_tracks(track_id);

-- ───────────────────────── Listening ─────────────────────────

CREATE TABLE favourites (
    id           INTEGER PRIMARY KEY,
    entity_type  TEXT    NOT NULL CHECK (entity_type IN ('track', 'album', 'artist', 'playlist')),
    entity_id    INTEGER NOT NULL,
    created_at   INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
    UNIQUE (entity_type, entity_id)
);

CREATE TABLE playback_history (
    id             INTEGER PRIMARY KEY,
    track_id       INTEGER REFERENCES tracks(id) ON DELETE SET NULL,
    audio_file_id  INTEGER REFERENCES audio_files(id) ON DELETE SET NULL,
    started_at     INTEGER NOT NULL,
    played_ms      INTEGER NOT NULL DEFAULT 0,
    completed      INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
    skipped        INTEGER NOT NULL DEFAULT 0 CHECK (skipped IN (0, 1)),
    context_type   TEXT,      -- 'album', 'playlist', 'radio', 'search', 'together'
    context_id     INTEGER
);
CREATE INDEX idx_playback_history_time ON playback_history(started_at DESC);
CREATE INDEX idx_playback_history_track ON playback_history(track_id);

-- Materialised aggregates, updated incrementally when a history row is finalised.
CREATE TABLE listening_statistics (
    track_id         INTEGER PRIMARY KEY REFERENCES tracks(id) ON DELETE CASCADE,
    play_count       INTEGER NOT NULL DEFAULT 0,
    skip_count       INTEGER NOT NULL DEFAULT 0,
    total_played_ms  INTEGER NOT NULL DEFAULT 0,
    first_played_at  INTEGER,
    last_played_at   INTEGER
);
CREATE INDEX idx_listening_stats_count ON listening_statistics(play_count DESC);
CREATE INDEX idx_listening_stats_last ON listening_statistics(last_played_at DESC);

-- Persisted playback queue (restored on launch).
CREATE TABLE queue_items (
    position       INTEGER PRIMARY KEY,
    track_id       INTEGER REFERENCES tracks(id) ON DELETE CASCADE,
    audio_file_id  INTEGER REFERENCES audio_files(id) ON DELETE CASCADE,
    CHECK (track_id IS NOT NULL OR audio_file_id IS NOT NULL)
);

-- ───────────────────────── Devices ─────────────────────────

CREATE TABLE device_profiles (
    id                     INTEGER PRIMARY KEY,
    name                   TEXT    NOT NULL UNIQUE,
    builtin                INTEGER NOT NULL DEFAULT 0 CHECK (builtin IN (0, 1)),
    supported_codecs       TEXT    NOT NULL CHECK (json_valid(supported_codecs)), -- ["mp3","aac","flac"]
    max_sample_rate_hz     INTEGER,
    max_bit_depth          INTEGER,
    filesystems            TEXT    CHECK (filesystems IS NULL OR json_valid(filesystems)),
    max_file_size_bytes    INTEGER,
    max_path_length        INTEGER,
    music_root             TEXT    NOT NULL DEFAULT 'MUSIC',
    folder_template        TEXT    NOT NULL DEFAULT '{album_artist}/{album}/{track:02} {title}',
    embed_artwork          INTEGER NOT NULL DEFAULT 1 CHECK (embed_artwork IN (0, 1)),
    artwork_max_px         INTEGER,
    notes                  TEXT
);

INSERT INTO device_profiles
    (name, builtin, supported_codecs, max_sample_rate_hz, max_bit_depth, filesystems,
     max_file_size_bytes, max_path_length, music_root, folder_template, embed_artwork, artwork_max_px, notes)
VALUES
    ('Generic USB drive', 1, '["mp3","aac","flac","vorbis","opus","pcm","alac"]', NULL, NULL,
     '["vfat","exfat","ntfs","ext4"]', NULL, NULL, 'Music', '{album_artist}/{album}/{track:02} {title}', 1, NULL,
     'No playback constraints assumed; only filesystem limits apply.'),
    ('Conservative portable player', 1, '["mp3"]', 48000, 16,
     '["vfat"]', 4294967295, 255, 'MUSIC', '{album_artist}/{album}/{track:02} {title}', 1, 500,
     'Safe defaults for older players: MP3 only, FAT32, baseline JPEG artwork ≤ 500 px.');

CREATE TABLE connected_devices (
    id                 INTEGER PRIMARY KEY,
    volume_uuid        TEXT    NOT NULL UNIQUE,  -- filesystem UUID / volume serial
    label              TEXT,
    vendor             TEXT,
    model              TEXT,
    filesystem         TEXT,
    capacity_bytes     INTEGER,
    transport          TEXT    NOT NULL DEFAULT 'mass_storage' CHECK (transport IN ('mass_storage', 'mtp')),
    device_profile_id  INTEGER REFERENCES device_profiles(id) ON DELETE SET NULL,
    music_root         TEXT,
    first_seen_at      INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
    last_seen_at       INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000)
);

-- ───────────────────────── Jobs ─────────────────────────

CREATE TABLE import_jobs (
    id           INTEGER PRIMARY KEY,
    kind         TEXT    NOT NULL CHECK (kind IN ('local_scan', 'spotify_sync', 'manual_import', 'provider_sync')),
    provider_id  TEXT    REFERENCES music_providers(id),
    status       TEXT    NOT NULL DEFAULT 'queued'
                 CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
    total        INTEGER,
    processed    INTEGER NOT NULL DEFAULT 0,
    failed       INTEGER NOT NULL DEFAULT 0,
    error        TEXT,
    summary      TEXT    CHECK (summary IS NULL OR json_valid(summary)),
    created_at   INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
    started_at   INTEGER,
    finished_at  INTEGER
);
CREATE INDEX idx_import_jobs_status ON import_jobs(status, created_at);

CREATE TABLE transfer_jobs (
    id               INTEGER PRIMARY KEY,
    device_id        INTEGER NOT NULL REFERENCES connected_devices(id) ON DELETE CASCADE,
    direction        TEXT    NOT NULL CHECK (direction IN ('export', 'import')),
    status           TEXT    NOT NULL DEFAULT 'planned'
                     CHECK (status IN ('planned', 'running', 'verifying', 'completed', 'failed', 'cancelled')),
    folder_template  TEXT    NOT NULL,
    target_codec     TEXT,            -- NULL = copy as-is
    target_bitrate   INTEGER,
    plan             TEXT    CHECK (plan IS NULL OR json_valid(plan)),
    files_total      INTEGER NOT NULL DEFAULT 0,
    files_done       INTEGER NOT NULL DEFAULT 0,
    files_verified   INTEGER NOT NULL DEFAULT 0,
    bytes_total      INTEGER NOT NULL DEFAULT 0,
    bytes_done       INTEGER NOT NULL DEFAULT 0,
    error            TEXT,
    created_at       INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
    finished_at      INTEGER
);

-- ───────────────────────── Preferences ─────────────────────────

CREATE TABLE theme_configurations (
    id          INTEGER PRIMARY KEY,
    theme_id    TEXT    NOT NULL UNIQUE,
    overrides   TEXT    NOT NULL DEFAULT '{}' CHECK (json_valid(overrides)),
    updated_at  INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000)
);

CREATE TABLE user_settings (
    key         TEXT PRIMARY KEY,
    value       TEXT    NOT NULL CHECK (json_valid(value)),
    updated_at  INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000)
);

INSERT INTO users (id, display_name) VALUES (1, 'Listener');
