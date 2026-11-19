import { invoke, isTauri } from "@tauri-apps/api/core";

/** Mirrors `IpcError` in src-tauri/src/error.rs. */
export interface IpcError {
  code: string;
  message: string;
}

export type IpcResult<T> = { ok: true; value: T } | { ok: false; error: IpcError };

export const NO_BACKEND: IpcError = {
  code: "NO_BACKEND",
  message: "Running in a browser without the SONORA desktop backend.",
};

export function hasBackend(): boolean {
  try {
    return isTauri();
  } catch {
    return false;
  }
}

async function call<T>(cmd: string, args?: Record<string, unknown>): Promise<IpcResult<T>> {
  if (!hasBackend()) return { ok: false, error: NO_BACKEND };
  try {
    return { ok: true, value: await invoke<T>(cmd, args) };
  } catch (e) {
    return { ok: false, error: toIpcError(e) };
  }
}

function toIpcError(e: unknown): IpcError {
  if (e && typeof e === "object" && "code" in e && "message" in e) {
    return { code: String(e.code), message: String(e.message) };
  }
  return { code: "UNKNOWN", message: String(e) };
}

// ───────── Command types (see API_DOCUMENTATION.md) ─────────

export interface AppInfo {
  name: string;
  version: string;
  os: string;
  arch: string;
  dataDir: string;
}

export interface DbStatus {
  path: string | null;
  schemaVersion: number;
  latestSchemaVersion: number;
  trackCount: number;
  audioFileCount: number;
  playlistCount: number;
  libraryFolderCount: number;
}

export type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

export const api = {
  appInfo: () => call<AppInfo>("app_info"),
  dbStatus: () => call<DbStatus>("db_status"),
  getSetting: (key: string) => call<JsonValue | null>("get_setting", { key }),
  setSetting: (key: string, value: JsonValue) => call<void>("set_setting", { key, value }),
  backupDatabase: () => call<string>("backup_database"),
};
