# Changelog

All notable changes to SONORA. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased] — Phase 1: Foundation

### Added
- Cargo workspace with `sonora-core` (SQLite, migrations via `user_version`, typed settings, verified online backup) and the `sonora-app` Tauri 2 crate.
- Migration 0001 with the full normalised schema (users, catalogue, files, matching, playlists, listening, providers, devices, jobs, preferences) and seeded providers and device profiles.
- Tauri commands: `app_info`, `db_status`, `get_setting`, `set_setting`, `backup_database`.
- React 19 + TypeScript + Vite 8 + Tailwind 4 + Motion + Zustand frontend.
- Theme runtime: manifest-based themes (tokens, layout, motion), registry with lazy loading, flow-aware motion engine, direction-aware progress bar. Dark and Light themes.
- App shell with 17 navigable screens, back/forward history, persistent player bar, Home, Theme Gallery (live previews), Settings (real backup and app/DB info). Remaining screens show their planned scope; no mock data.
- Tests: 13 Rust, 28 Vitest, 2 Playwright.
- Documentation: README, ARCHITECTURE, DEVELOPMENT_ROADMAP, DATABASE_SCHEMA, API_DOCUMENTATION, TESTING.
