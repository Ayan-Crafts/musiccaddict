/**
 * A theme is a manifest, not a palette. It controls tokens, layout, motion and
 * (from Phase 9) component slots, sounds and assets. Themes never touch audio.
 */

export const TOKEN_NAMES = [
  "--bg",
  "--bg-elevated",
  "--surface",
  "--surface-hover",
  "--surface-active",
  "--border",
  "--border-strong",
  "--fg",
  "--fg-muted",
  "--fg-subtle",
  "--accent",
  "--accent-fg",
  "--accent-soft",
  "--glow",
  "--backdrop",
  "--radius-sm",
  "--radius-md",
  "--radius-lg",
  "--shadow-panel",
  "--type-sans",
  "--type-display",
  "--type-mono",
] as const;

export type TokenName = (typeof TOKEN_NAMES)[number];
export type ThemeTokens = Record<TokenName, string>;

export type ColorScheme = "dark" | "light";

export interface ThemeLayout {
  /** Side of the window the navigation rail sits on. */
  nav: "left" | "right";
  /** Direction the playback progress fills. */
  progress: "ltr" | "rtl";
  /** Which time label is placed at the leading edge of the progress bar. */
  time: "elapsed-first" | "total-first";
  /** Mirrors the transport control order (prev/next, shuffle/repeat). */
  controls: "normal" | "mirrored";
}

export interface ThemeMotion {
  /**
   * Spatial flow of the interface. +1 = things enter from the trailing edge and
   * move "forward" (left→right progression). -1 inverts every directional
   * animation (Tenet). Applied by the motion engine, never via CSS `direction`.
   */
  flow: 1 | -1;
  /** 0 = no movement (fades only), 1 = full choreography. */
  intensity: number;
  ease: [number, number, number, number];
  /** Seconds. */
  duration: { fast: number; base: number; slow: number };
}

export interface ThemeManifest {
  id: string;
  name: string;
  description: string;
  scheme: ColorScheme;
  tokens: ThemeTokens;
  layout: ThemeLayout;
  motion: ThemeMotion;
}

/** Lightweight registry entry; the manifest itself may be lazy-loaded. */
export interface ThemeEntry {
  id: string;
  name: string;
  description: string;
  scheme: ColorScheme;
  load: () => Promise<ThemeManifest>;
}
