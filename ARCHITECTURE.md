# SONORA — Technical Architecture

> Status: Phase 1 (Foundation). Sections marked **[planned]** describe designs that are not yet implemented.
> See [DEVELOPMENT_ROADMAP.md](DEVELOPMENT_ROADMAP.md) for what exists today.

## 1. System overview

SONORA is a Tauri 2 desktop application. A Rust process owns every long-lived or
hardware-facing concern (database, filesystem, audio, devices, network, credentials).
A React/TypeScript web UI renders the product and talks to Rust only through a typed
IPC layer.

```
┌──────────────────────────── WebView (React + TS) ────────────────────────────┐
│  App Shell ── Router store ── Screens (Library, Audio Lab, Device Studio …)   │
│      │                                                                        │
│  Theme Runtime (tokens · layout · motion · component slots · sound)           │
│      │                                                                        │
│  Zustand stores = *mirrors* of Rust state  ◄── events ──┐                     │
│      │                                                  │                     │
│  lib/ipc.ts  (typed invoke wrappers) ── commands ──►    │                     │
└──────────────────────────────────────────────│──────────│─────────────────────┘
                                               ▼          │
┌──────────────────────────── Rust (src-tauri) ─────────────────────────────────┐
│  Command layer (thin: validate input → call crate → map errors)               │
│     │                                                                         │
│  sonora-core      DB, migrations, settings, backup, domain types       [done] │
│  sonora-library   scanner, metadata (lofty), artwork cache, search  [planned] │
│  sonora-match     normalisation + confidence scoring               [planned]  │
│  sonora-audio     decode (symphonia) → DSP → output (cpal) thread  [planned]  │
│  sonora-providers Provider trait: local, manual, spotify, masstamilan[planned]│
│  sonora-devices   removable volume detection, profiles, transfers  [planned]  │
│  sonora-together  multi-output + LAN session sync                  [planned]  │
└───────────────────────────────────────────────────────────────────────────────┘
```

### Why the audio engine lives in Rust, not the WebView

The core product promise is *playback never stops* — not on theme change, not on
navigation, not during a 10,000-file scan. Playing audio through `<audio>` in the
WebView would tie playback to React's lifecycle and would make the equaliser,
gapless playback, ReplayGain, exclusive output and dual-device routing impossible.
The audio engine therefore runs on dedicated Rust threads. React can unmount,
remount, or reload entirely and the music keeps playing; the UI simply re-subscribes
to `player://state` events.

## 2. Repository layout

```
musiccc/
├── Cargo.toml                 Rust workspace
├── crates/
│   └── sonora-core/           DB + migrations + settings + backup (no UI/OS deps)
│       ├── migrations/        0001_initial.sql, …  (embedded at compile time)
│       ├── src/
│       └── tests/
├── src-tauri/                 Tauri 2 application crate (commands, app wiring)
│   ├── capabilities/          Tauri permission manifests
│   └── tauri.conf.json
├── src/                       React frontend
│   ├── app/                   shell, sidebar, router store, route registry
│   ├── player/                persistent player bar + player store
│   ├── screens/               one folder/file per screen
│   ├── theme/                 Theme runtime, registry, motion engine, themes/
│   ├── components/ui/         design-system primitives
│   └── lib/                   ipc, formatting helpers
└── *.md                       project documentation
```

Crates are only split out when they carry real code. A new crate is created at the
start of the phase that needs it, not before (rule: avoid unnecessary abstraction).

## 3. Module responsibilities and public interfaces

| Module | Owns | Public interface (Rust) | UI surface |
|---|---|---|---|
| **Core** | SQLite connection, migrations, settings KV, backup/restore | `Database::open(path)`, `Database::open_in_memory()`, `settings::{get,set}`, `backup::backup_to(path)` | Settings › Privacy |
| **Library** [planned] | Library folders, incremental scan, tag reading, artwork cache, FTS search | `Scanner::scan(folder, progress_tx)`, `Library::search(query, filter, page)` | All Songs, Albums, Artists, Genres |
| **Matching** [planned] | Text normalisation, candidate retrieval, confidence scoring | `match_track(&ExternalTrack, &CandidateIndex) -> Vec<Scored>` (pure, no I/O) | Acquisition Centre, Spotify dashboard |
| **Audio** [planned] | Decode, resample, DSP chain, output devices, queue, gapless/crossfade | `AudioEngine::handle() -> EngineHandle` (channel-based commands), `EngineEvent` stream | Player bar, Now Playing, Audio Lab |
| **Providers** [planned] | Source-specific import/sync, permissions, rate limits, compliance log | `trait MusicProvider` (§6) | Spotify Connection, MassTamilan Discovery, Import |
| **Devices** [planned] | Removable volume detection, device profiles, transfer + verify, eject | `DeviceWatcher`, `TransferJob::run(plan, progress_tx)` | Device Studio |
| **Together** [planned] | Dual-output routing, LAN host/guest session, clock sync | `TogetherSession::{host,join}` | Together Mode |
| **Theme** (frontend) | Visual identity, layout, motion, sounds | `ThemeManifest`, `ThemeRegistry`, `useTheme()`, `useFlowMotion()` | Theme Gallery |

### Dependency rules

- `sonora-core` depends on nothing in the workspace.
- Every other crate may depend on `sonora-core`; feature crates do **not** depend on
  each other except `sonora-match` (pure) which may be used by `sonora-providers`.
- Providers never touch audio; the audio engine never knows where a file came from.
- The theme runtime never imports player or library code; player components read
  theme *layout/motion* values, not the other way round.

## 4. IPC contract

- **Commands** (frontend → Rust): request/response via `invoke`. All commands return
  `Result<T, IpcError>` where `IpcError = { code: string, message: string }`.
  Typed wrappers live in `src/lib/ipc.ts`; components never call `invoke` directly.
- **Events** (Rust → frontend) [planned]: `player://state`, `player://position`
  (≤ 10 Hz), `library://scan-progress`, `devices://changed`, `transfer://progress`.
- **Long jobs** (scan, sync, transfer) return a job id immediately, run on a Tokio
  task / worker thread, persist progress in `import_jobs` / `transfer_jobs`, and emit
  progress events. The UI thread is never blocked by filesystem work.
- When the UI runs in a plain browser (`npm run dev` without Tauri) `ipc.ts` reports
  `code: "NO_BACKEND"` rather than fabricating data.

Full list: [API_DOCUMENTATION.md](API_DOCUMENTATION.md).

## 5. Data layer

- SQLite via `rusqlite` with the `bundled` feature (identical SQLite + FTS5 on every
  platform). WAL journal mode, `foreign_keys=ON`, `busy_timeout=5000`.
- Migrations are numbered `.sql` files embedded with `include_str!`; the applied
  version is tracked in `PRAGMA user_version`. Each migration runs in a transaction.
  Migrations are append-only; a released migration is never edited.
- Before applying migrations to a non-empty database, an automatic backup is written
  next to it (`sonora.db.pre-v{N}.bak`).
- Spotify identifiers live in `track_identifiers`, never mixed with file paths.
  A `track` (a recording) can have many `audio_files`; a file can exist with no track
  yet (unmatched).
- OAuth tokens are **not** stored in SQLite. They go to the OS credential store
  (`keyring` crate: Secret Service on Linux, Credential Manager on Windows).

Schema: [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md).

## 6. Provider architecture [planned]

```rust
pub trait MusicProvider: Send + Sync {
    fn id(&self) -> ProviderId;                 // "local", "manual", "spotify", "masstamilan"
    fn capabilities(&self) -> ProviderCapabilities; // metadata_import, audio_import, discovery_link …
    fn permission(&self) -> PermissionState;    // NotRequired | Granted{evidence} | Missing
    async fn sync(&self, ctx: &ProviderCtx) -> Result<SyncReport>;
}
```

- `ProviderCtx` carries a rate limiter, a compliance logger (writes
  `provider_compliance_log`), the DB handle and a cancellation token.
- The registry refuses to run any automated capability of a provider whose
  `permission()` is `Missing`. This is enforced in code, not only documentation.
- **Spotify**: Authorization Code with PKCE (no client secret on the device),
  loopback redirect `http://127.0.0.1:<port>/callback`, scopes
  `user-library-read playlist-read-private playlist-read-collaborative`.
  Metadata only — no audio is ever requested, streamed, recorded or downloaded.
  Honour `429 Retry-After`. Note that Spotify apps in Development Mode are limited to
  an allow-listed set of users; the user must register their own Client ID.
- **MassTamilan**: Phase 8 ships *Discovery* only — an external-link section that
  opens the official site in the system browser, plus manual import of files the
  user has separately obtained and is authorised to use. No crawler, no scraper,
  no link extraction, no undocumented endpoints. `MassTamilanProvider` exists with
  `permission() == Missing` and all automated capabilities disabled until written
  permission and a documented integration method are supplied. SONORA cannot verify
  the licensing status of files the user imports; the import dialog states that
  responsibility clearly.
- If any provider fails or its site disappears, only that provider's screen shows an
  error; library and playback are unaffected.

## 7. Matching engine [planned]

Pure function crate, fully unit-testable.

1. **Normalise**: Unicode NFKC, case-fold, strip diacritics, unify quotes/dashes,
   remove bracketed noise (`(Official Audio)`, `[320kbps]`, site watermarks in tags
   or filenames), split featured artists (`feat.`, `ft.`, `&`, `,`), keep *version
   markers* (`Live`, `Remastered`, `Acoustic`, `Reprise`, language tags,
   `Explicit/Clean`) as a separate structured field instead of discarding them.
2. **Candidate retrieval**: FTS5 on normalised title, then filter by artist overlap.
3. **Score** (0–100): title similarity (token Jaro-Winkler), artist set overlap,
   album similarity, duration delta (±2 s strong, >10 s heavy penalty), version-marker
   agreement (a mismatch such as *Live* vs studio is a hard cap below the auto
   threshold), ISRC equality (if both present → near-certain).
4. **Decide**: ≥ 92 and a clear margin over the runner-up → auto-associate;
   60–92 or close runner-up → `match_candidates` with `status='pending'` for user
   review; < 60 → missing. Users' decisions (`confirmed` / `rejected`) are remembered
   and never overridden by a resync.

## 8. Audio engine [planned]

```
file ─► symphonia demux/decode ─► f32 frames ─► resampler (rubato, only if device rate ≠ source)
     ─► DSP chain: ReplayGain → EQ (biquads) → bass/treble shelves → balance → volume → limiter
     ─► ring buffer ─► cpal output callback (device A)  [+ device B in Together Mode A]
                  └► analysis tap (FFT, decimated) ─► visualiser events
```

- One decoder thread, one realtime output callback; the callback never allocates or
  locks. Commands enter via a lock-free channel.
- **Bit-perfect path**: when EQ is flat, ReplayGain is off, volume is 100 % and rates
  match, the DSP chain is bypassed entirely.
- Gapless: the next track's decoder is primed before the current one ends.
  Crossfade: two decoders mixed for the configured window.
- Queue and position are persisted to the DB every few seconds and on exit.

## 9. Together Mode [planned]

| Mode | Approach | Known limits (surfaced in UI) |
|---|---|---|
| A — dual output | Two cpal streams fed from the same decoded buffer; per-device volume; drift corrected by adaptive resampling; per-device latency offset slider | Two Bluetooth A2DP sinks at once are often unsupported (Windows generally cannot; Linux depends on adapter + PipeWire). Detected and explained, never promised. |
| B — splitter | Normal playback + a guided "shared listening" UI (mono-compat option, balance lock) | None technical |
| C — LAN | Host advertises via mDNS; WebSocket control channel; NTP-style clock-offset estimation; scheduled "play at host time T" commands; guest uses its own copy of the file if matched, otherwise the host streams the file over the LAN | Requires both devices on the same network; only the user's own files are streamed, only on the LAN |

## 10. Device Studio [planned]

- Detection: removable mass-storage volumes (Linux: UDisks2 over D-Bus; Windows:
  volume enumeration + `WM_DEVICECHANGE`). Many Sony Walkman models expose
  **MTP**, not mass storage; MTP support is a separate later milestone (libmtp /
  Windows Portable Devices) and the UI says so when it sees an MTP device.
- Device profiles (`device_profiles`) describe codecs, max sample rate/bit depth,
  filesystem constraints (FAT32: 4 GiB file limit, forbidden characters, path length),
  artwork size and folder rules. Built-in profiles are conservative; users can edit.
- Transfer = plan (dry run showing every file, conversions, space required) → copy to
  temp name → fsync → hash-verify → rename. Success is reported only after
  verification. Nothing is deleted on the device without an explicit confirmation
  listing the files. Formatting is never performed.
- Optional conversion (MP3 320/128): decode with symphonia, encode with LAME
  (dependency/licensing decision recorded in Phase 7). Lossless originals in the
  library are never modified.

## 11. Theme runtime

Themes are **manifests + optional component slots**, not palettes.

```ts
interface ThemeManifest {
  id; name; description; base: "dark" | "light";
  tokens: Record<CssVarName, string>;        // colours, radii, shadows, fonts, textures
  layout: { nav: "left" | "right" | "top"; player: PlayerLayoutId;
            progress: "ltr" | "rtl"; time: "elapsed-first" | "remaining-first" };
  motion: { flow: 1 | -1; intensity: number; easing; durations };
  slots?: Partial<{ Background; Visualiser; PlayerBar; Loader }>; // lazy React components
  sounds?: Partial<Record<UiSound, AssetRef>>; // UI sfx, off by default
}
```

- **ThemeRegistry**: map of id → manifest loader (`() => import(...)`), so a theme's
  assets are only fetched when used. Installing a theme = registering a manifest.
- **ThemeRuntime / ThemeProvider**: writes tokens as CSS custom properties on
  `:root`, exposes the manifest via context, cross-fades between themes. It is
  mounted *inside* the shell but *outside* nothing that owns audio — and audio is in
  Rust anyway, so a theme switch cannot interrupt playback.
- **ThemeMotionEngine** (`useFlowMotion`): every directional animation is computed
  from `motion.flow`. Page enter/exit, panel slides, loaders and visualiser scroll use
  `x = flow * distance`. Tenet sets `flow = -1`, `progress = "rtl"`,
  `time = "remaining-first"` and mirrors control order through `layout`, which gives a
  genuine spatial inversion — without `direction: rtl` and without reversing text.
- **ThemeLayoutEngine**: shell reads `layout.nav`/`layout.player` to choose layout
  variants. **ThemeAssetManager** / **ThemeSoundEngine** arrive with the first theme
  that ships assets (Phase 9).
- **Licensing**: movie/game-inspired themes use only original artwork, open-licensed
  fonts and generated textures. No logos, stills, soundtracks or extracted game
  assets. Theme display names are kept separate from theme ids so they can be
  renamed (e.g. for a public release) without breaking saved configurations.

## 12. Security & privacy

- No telemetry. No network calls except to services the user explicitly connects.
- Tauri capabilities are minimal and per-window; the frontend has no general
  filesystem or shell access — all file access is via validated Rust commands
  constrained to library folders / selected devices.
- Paths from the UI are canonicalised and checked against allowed roots.
- Destructive operations (delete from device, remove from library with files,
  restore backup) require a confirmation token issued by a prior "plan" call.
- Logs go to the app log dir, rotate, and never contain tokens.

## 13. Architectural decision log

| # | Decision | Reason |
|---|---|---|
| 1 | Audio engine in Rust, UI only mirrors state | Playback survives UI/theme/route changes; enables DSP, gapless, multi-output |
| 2 | `rusqlite` (sync) over `sqlx` | Simple embedded use, bundled SQLite+FTS5, no async runtime coupling; DB work runs on worker threads |
| 3 | Migrations via `PRAGMA user_version` + embedded SQL | Zero extra deps, atomic per migration, easy to test |
| 4 | Tokens in OS keyring, not SQLite | Keeps credentials out of backups and out of the WebView |
| 5 | Spotify PKCE flow | No client secret on device |
| 6 | Lightweight store-based router instead of a router library | Desktop app has no URLs to deep-link; fewer deps; navigation history still supported |
| 7 | Tailwind v4 + CSS custom properties for theme tokens | Themes swap variables at runtime without rebuilding classes |
| 8 | `motion` (Framer Motion) with flow-aware variants | Theme-controlled spatial direction (Tenet) as data, not CSS hacks |
| 9 | MassTamilan: link-out + manual import only | Site terms prohibit automated collection without written consent |
| 10 | Crates created per phase | Avoid empty abstractions |
