import type { ThemeEntry, ThemeManifest } from "./types";
import { darkTheme } from "./themes/dark";
import { lightTheme } from "./themes/light";

export const DEFAULT_THEME_ID = "dark";

const entries = new Map<string, ThemeEntry>();

/** Installing a theme = registering an entry. Nothing else in the app changes. */
export function registerTheme(entry: ThemeEntry): void {
  if (entries.has(entry.id)) throw new Error(`theme already registered: ${entry.id}`);
  entries.set(entry.id, entry);
}

export function listThemes(): ThemeEntry[] {
  return [...entries.values()];
}

export function hasTheme(id: string): boolean {
  return entries.has(id);
}

/** Loads a theme, falling back to the default if the id is unknown or loading fails. */
export async function loadTheme(id: string): Promise<ThemeManifest> {
  const entry = entries.get(id) ?? entries.get(DEFAULT_THEME_ID)!;
  try {
    return await entry.load();
  } catch (err) {
    console.error(`failed to load theme ${id}`, err);
    return darkTheme;
  }
}

const eager = (m: ThemeManifest): ThemeEntry => ({
  id: m.id,
  name: m.name,
  description: m.description,
  scheme: m.scheme,
  load: async () => m,
});

// Base themes are bundled eagerly so first paint never flashes.
registerTheme(eager(darkTheme));
registerTheme(eager(lightTheme));
