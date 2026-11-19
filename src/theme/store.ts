import { create } from "zustand";
import { preferences } from "../lib/preferences";
import { DEFAULT_THEME_ID, loadTheme } from "./registry";
import { applyTheme } from "./runtime";
import { darkTheme } from "./themes/dark";
import type { ThemeManifest } from "./types";

const THEME_KEY = "appearance.theme";
const INTENSITY_KEY = "appearance.animation_intensity";

interface ThemeState {
  theme: ThemeManifest;
  /** User multiplier on top of the theme's own intensity (0..1). */
  userIntensity: number;
  ready: boolean;
  init: () => Promise<void>;
  setTheme: (id: string) => Promise<void>;
  setUserIntensity: (v: number) => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: darkTheme,
  userIntensity: 1,
  ready: false,

  async init() {
    const [id, intensity] = await Promise.all([
      preferences.get<string>(THEME_KEY),
      preferences.get<number>(INTENSITY_KEY),
    ]);
    const theme = await loadTheme(id ?? DEFAULT_THEME_ID);
    applyTheme(theme);
    set({ theme, userIntensity: typeof intensity === "number" ? intensity : 1, ready: true });
  },

  // Applying a theme only rewrites CSS variables and context; it never touches
  // the audio engine (which lives in the Rust process).
  async setTheme(id) {
    if (id === get().theme.id) return;
    const theme = await loadTheme(id);
    applyTheme(theme);
    set({ theme });
    await preferences.set(THEME_KEY, theme.id);
  },

  async setUserIntensity(v) {
    const userIntensity = Math.min(1, Math.max(0, v));
    set({ userIntensity });
    await preferences.set(INTENSITY_KEY, userIntensity);
  },
}));
