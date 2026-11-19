# SONORA

**Your Music. Your Library. Your Experience.**

A premium, offline-first desktop music ecosystem: a library you own, an audio engine with a real Audio Lab, Spotify used as a *metadata* source only, USB/Walkman management, shared listening, and themes that change the whole experience, not just the colours.

> **Status: Phase 1 (Foundation).** The shell, design system, theme runtime and database exist and are tested. Playback, library scanning, Spotify and devices are **not implemented yet**. See [DEVELOPMENT_ROADMAP.md](DEVELOPMENT_ROADMAP.md).

## Stack

Tauri 2 · Rust · SQLite (rusqlite, bundled) · React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · Motion · Zustand · Vitest · Playwright

## Prerequisites

| | Linux (Ubuntu 24.04+) | Windows 10/11 |
|---|---|---|
| Rust | `rustup` stable (≥ 1.80) | `rustup` stable (MSVC) |
| Node.js | 22 LTS | 22 LTS |
| System | see below | WebView2 (preinstalled on 11), VS Build Tools "Desktop development with C++" |

Linux system packages (needs sudo):

```bash
sudo apt update
sudo apt install -y build-essential curl wget file pkg-config \
  libwebkit2gtk-4.1-dev libssl-dev libxdo-dev libdbus-1-dev \
  libayatana-appindicator3-dev librsvg2-dev \
  libasound2-dev   # audio engine (Phase 4)
```

## Run

```bash
npm install
npm run tauri dev      # full desktop app (needs the system packages above)
npm run dev            # UI only in a browser at http://localhost:1420 (no backend; the UI says so)
```

Build installers: `npm run tauri build` → `.deb` + `.AppImage` on Linux, NSIS `.exe` on Windows.

## Test

```bash
npm run test:rust      # Rust core tests
npm test               # Vitest
npm run test:e2e       # Playwright (first time: npx playwright install chromium)
npm run typecheck
```

Details in [TESTING.md](TESTING.md).

## Layout

```
crates/sonora-core   database, migrations, settings, backup
src-tauri            Tauri app: commands + wiring
src                  React UI: app shell, player, screens, theme runtime
e2e                  Playwright smoke tests
```

## Principles

Offline-first · playback never interrupted by UI or theme changes · user files are never modified or deleted without explicit consent · no telemetry · no scraping, no DRM circumvention, no audio from Spotify · original artwork for all themes.

## Docs

[ARCHITECTURE](ARCHITECTURE.md) · [ROADMAP](DEVELOPMENT_ROADMAP.md) · [DATABASE](DATABASE_SCHEMA.md) · [API](API_DOCUMENTATION.md) · [TESTING](TESTING.md) · [CHANGELOG](CHANGELOG.md)
