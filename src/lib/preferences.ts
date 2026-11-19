import { api, hasBackend, type JsonValue } from "./ipc";

/**
 * UI preferences. Stored in SQLite (`user_settings`) through the backend.
 * When the UI runs in a plain browser during development there is no backend,
 * so preferences fall back to localStorage — this is storage, not fake data.
 */
const LS_PREFIX = "sonora:";

export const preferences = {
  async get<T extends JsonValue>(key: string): Promise<T | null> {
    if (hasBackend()) {
      const r = await api.getSetting(key);
      if (!r.ok) console.warn(`preference ${key} unavailable`, r.error);
      return r.ok ? ((r.value as T | null) ?? null) : null;
    }
    try {
      const raw = localStorage.getItem(LS_PREFIX + key);
      return raw === null ? null : (JSON.parse(raw) as T);
    } catch {
      return null;
    }
  },

  async set(key: string, value: JsonValue): Promise<boolean> {
    if (hasBackend()) {
      const r = await api.setSetting(key, value);
      if (!r.ok) console.error(`failed to save preference ${key}`, r.error);
      return r.ok;
    }
    try {
      localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
};
