# SONORA — Testing

| Layer | Tool | Command | Location |
|---|---|---|---|
| Rust core (DB, migrations, settings, backup) | `cargo test` | `npm run test:rust` | `crates/sonora-core/src/**`, `crates/sonora-core/tests/` |
| Frontend units (theme runtime, motion, router, player UI, shell) | Vitest + Testing Library (jsdom) | `npm test` | `src/**/*.test.ts(x)` |
| UI smoke (built frontend in Chromium) | Playwright | `npm run test:e2e` | `e2e/` |
| Types | `tsc` | `npm run typecheck` | — |
| Rust lint/format | clippy, rustfmt | `cargo clippy --all-targets -- -D warnings`, `cargo fmt --check` | — |

First-time Playwright setup: `npx playwright install chromium`.
Set `SONORA_SCREENSHOT_DIR=/some/dir` when running Playwright to save screenshots.

## What is covered today (Phase 1)

**Rust (13 tests)** — all required tables exist; reopen is idempotent and data persists; WAL enabled; refuses DBs from newer builds; foreign keys enforced; a track can own several files; Spotify ids are unique and separate from paths; deleting a track never deletes file records; playlists allow duplicate entries and cascade; MassTamilan starts with `permission_status='missing'`; CHECK constraints reject bad values; typed settings round-trip; key validation; backup produces a verified copy and never overwrites; status counts are real.

**Vitest (28 tests)** — theme flow × navigation direction; Tenet entering from the opposite side; zero intensity removes movement; progress presentation (LTR vs Tenet RTL, label swap, mirrored seek, clamping); registry fallback / duplicate rejection / complete tokens; `applyTheme` writes variables; router history; 17 unique routes; duration formatting; IPC returns `NO_BACKEND` instead of fake data; ProgressBar rendering in both directions without CSS `direction: rtl`; **the player element stays the same DOM node across navigation and a theme switch**.

**Playwright (2 tests)** — real text renders, backend-missing notice shown, player persistent and disabled, navigation + back; Light theme applies and persists across reload.

## Not yet covered (and why)

- Tauri commands end-to-end: the app crate cannot compile until WebKitGTK dev packages are installed (see README). Next step: install them, then add `tauri-driver` E2E in Phase 11.
- Pre-migration backup path: only exercisable once migration 0002 exists (Phase 2).
- Windows: needs a Windows runner (planned CI matrix: `ubuntu-24.04`, `windows-latest`).

## Required per milestone (from the spec)

Spotify auth & import (recorded fixtures), local indexing, matching, playlists, playback & seeking, queue persistence, theme switching, Tenet animation direction, USB detection, file transfer & verification, duplicate detection, migrations, offline functionality — each gets tests in the phase that implements it.
