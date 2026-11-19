# SONORA — Development Roadmap

Status legend: ✅ done and tested · 🟡 partially done · ⬜ not started.
A feature counts as done only when it works end-to-end and has tests, not just because a UI exists.

## Phase 1 — Foundation 🟡

| Item | Status | Notes |
|---|---|---|
| Repository, workspace, tooling | ✅ | Cargo workspace + Vite/React/TS; dedicated git repo |
| Architecture, roadmap, schema docs | ✅ | ARCHITECTURE.md, DATABASE_SCHEMA.md, API_DOCUMENTATION.md |
| SQLite database + migrations + backup | ✅ | `sonora-core`, 13 Rust tests |
| Tauri 2 app crate + commands | 🟡 | Written; **not yet compiled** on this machine — needs the system packages in README › Prerequisites |
| Design system + Dark/Light themes | ✅ | Tokens, primitives, live theme previews |
| Theme runtime (registry, runtime, flow-aware motion) | ✅ | Tenet-ready: `motion.flow`, `layout.progress`, `layout.controls` |
| Navigation shell, 17 screens, persistent player shell | ✅ | Player is a UI shell; engine is Phase 4 |
| Frontend unit tests + Playwright smoke tests | ✅ | 28 Vitest + 2 Playwright |
| Linux packaging smoke build (`tauri build`) | ⬜ | Blocked on system packages |
| Windows build | ⬜ | Needs a Windows machine/CI |

**Exit criteria:** `npm run tauri dev` launches the window on Linux, the DB is created in the app data dir, Settings shows real schema version and backup works. Then CI (GitHub Actions: ubuntu-24.04 + windows-latest) runs all tests.

## Phase 2 — Music Library ⬜
1. `sonora-library` crate: library folder registry (`library_folders`), folder picker (tauri-plugin-dialog).
2. Background scanner: walk + mtime/size diff for incremental scans, `lofty` for tags and stream properties, BLAKE3 content hash, progress events, cancellation. Playback-safe (worker threads, batched transactions).
3. Artwork extraction → content-addressed cache on disk, thumbnails at 2 sizes, served via a custom protocol.
4. Migration 0002: FTS5 index over title/artist/album/genre; search command with filters (year, format).
5. Library screens: virtualised Songs list (10k+ rows at 60 fps), Albums grid, Artists, Genres, Favourites, Recently Added.
6. Playlists: CRUD, reorder, bulk add/remove, duplicate, M3U8 export/import, JSON backup.
7. Onboarding flow (theme → music folder → scan → optional Spotify → audio quality → done).
8. Tests: scanner against a generated fixture library (multiple formats, broken tags, unicode paths), 10k-track performance test, Playwright library flows.

## Phase 3 — Spotify ⬜
PKCE OAuth with loopback redirect; tokens in OS keyring; paged import of saved tracks, albums, followed artists and playlists with 429 handling; `sonora-match` crate (normalisation, scoring, version markers); match review UI; import dashboard (imported / local / missing / unmatched / duplicates); resync that respects `metadata_locked` and user match decisions. Tests use recorded API fixtures — no live network in CI.

## Phase 4 — Audio Engine ⬜
`sonora-audio`: symphonia decode, cpal output, rubato resampling, lock-free command channel, gapless priming, crossfade, queue with persistence (`queue_items`), seek, volume, speed (time-stretch only if quality acceptable), sleep timer, playback history + statistics, media keys / MPRIS (Linux) / SMTC (Windows), Now Playing screen, mini and full-screen players. Tests: decoder fixtures per format, sample-accurate seek tests, queue state machine tests.

## Phase 5 — Audio Lab ⬜
10-band graphic + parametric EQ (biquads), presets + user profiles, bass/treble shelves, balance, ReplayGain (track/album), limiter, output device selection, sample-rate/buffer config, exclusive mode (WASAPI exclusive on Windows; ALSA `hw:` on Linux where possible), bit-perfect bypass, spectrum/waveform visualisers.

## Phase 6 — Together Mode ⬜
Investigation spike first (dual cpal streams on PipeWire and WASAPI; Bluetooth limits), then Mode A dual output with drift correction, Mode B guided splitter UI, Mode C LAN host/guest (mDNS, WebSocket control, clock sync, LAN file streaming).

## Phase 7 — Device Studio ⬜
`sonora-devices`: removable-volume detection (UDisks2 / Win32), device profiles, browse, plan → copy → verify transfers, folder templates (Artist/Album/Track, Playlist/Track, Genre/Artist/Track, flat), FAT32 name sanitising, duplicate detection by hash, playlist export (M3U8 with relative paths), optional MP3 transcoding (encoder licence decision), safe eject. MTP (many Walkman models) as a follow-up milestone.

## Phase 8 — Music Providers ⬜
`MusicProvider` trait + registry with permission gate and compliance log; Manual Import; Music Acquisition Centre; MassTamilan Discovery (official-site link-out + manual import only — re-read the site's Terms and Disclaimer at implementation time and record the review date in the compliance log).

## Phase 9 — Theme Engine ⬜
ThemeAssetManager, ThemeSoundEngine, component slots (Background, Visualiser, PlayerBar, Loader), theme-scoped fonts; then the 12 signature themes. Tenet gets a dedicated pass: mirrored controls, RTL progress, inverted loaders and visualiser scroll, reversed panel choreography, plus Playwright assertions on animation direction. Optional reverse-audio mode only if the engine can do it cleanly and only when explicitly enabled.

## Phase 10 — Advanced Experience ⬜
Listening statistics screen, smart playlists (rule builder → SQL), radio stations from playlists (station artwork/colours), global hotkeys, advanced settings.

## Phase 11 — Optimisation & Release ⬜
Profiling (idle CPU, memory with large artwork sets), security review, Tauri E2E via `tauri-driver`, Windows + Linux CI matrix, NSIS installer, AppImage, DEB, signed builds, user documentation.
