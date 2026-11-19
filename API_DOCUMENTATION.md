# SONORA — IPC API

Frontend ↔ backend contract. Rust: [src-tauri/src/commands.rs](src-tauri/src/commands.rs). TypeScript wrappers: [src/lib/ipc.ts](src/lib/ipc.ts).

Components never call `invoke` directly; they use `api.*`, which returns `IpcResult<T>`:

```ts
type IpcResult<T> = { ok: true; value: T } | { ok: false; error: IpcError };
interface IpcError { code: string; message: string }
```

## Error codes

| Code | Meaning |
|---|---|
| `NO_BACKEND` | UI is running in a plain browser (no Tauri). Frontend-only. |
| `DB_ERROR` | SQLite error |
| `DB_POISONED` | Internal lock poisoned after a panic |
| `IO_ERROR` | Filesystem error |
| `JSON_ERROR` | (De)serialisation error |
| `SCHEMA_TOO_NEW` | Database written by a newer SONORA build; refused to protect data |
| `MIGRATION_FAILED` | A migration failed; DB left at previous version |
| `INVALID_INPUT` | Validation failed (bad settings key, value too large, …) |
| `INTEGRITY_FAILED` | `integrity_check` / `foreign_key_check` failed |
| `UNKNOWN` | Unexpected error shape |

If the database cannot be opened at startup, the app still launches and every DB-backed command returns the original error, so the UI can explain it.

## Commands (Phase 1)

### `app_info() → AppInfo`
```ts
{ name: "SONORA", version: string, os: string, arch: string, dataDir: string }
```

### `db_status() → DbStatus`
Real counts from the database.
```ts
{ path: string | null, schemaVersion: number, latestSchemaVersion: number,
  trackCount: number, audioFileCount: number, playlistCount: number, libraryFolderCount: number }
```

### `get_setting(key: string) → JsonValue | null`
### `set_setting(key: string, value: JsonValue) → void`
- `key`: lowercase `[a-z0-9._-]`, ≤ 128 chars, no leading/trailing dot (e.g. `appearance.theme`).
- `value`: any JSON, ≤ 64 KiB serialised.

Known keys:

| Key | Type | Default |
|---|---|---|
| `appearance.theme` | string (theme id) | `"dark"` |
| `appearance.animation_intensity` | number 0–1 | `1` |

### `backup_database() → string`
Writes `<dataDir>/backups/sonora-<unix-seconds>.db`, verifies it, returns the path. Never overwrites.

## Events

None in Phase 1. Planned: `player://state`, `player://position`, `library://scan-progress`, `devices://changed`, `transfer://progress` (see ARCHITECTURE.md §4).
