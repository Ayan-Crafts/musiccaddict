import type { ThemeManifest } from "../types";
import { FONT_MONO, FONT_SANS, STANDARD_LAYOUT, STANDARD_MOTION } from "./shared";

export const lightTheme: ThemeManifest = {
  id: "light",
  name: "Light",
  description: "Warm paper whites, soft shadows and crisp ink. Calm and minimal.",
  scheme: "light",
  tokens: {
    "--bg": "#f5f3ef",
    "--bg-elevated": "#fbfaf8",
    "--surface": "#ffffff",
    "--surface-hover": "#f0ede8",
    "--surface-active": "#e7e3dc",
    "--border": "rgba(20,18,14,0.08)",
    "--border-strong": "rgba(20,18,14,0.16)",
    "--fg": "#16140f",
    "--fg-muted": "#5f5b53",
    "--fg-subtle": "#8f8a80",
    "--accent": "#d9481c",
    "--accent-fg": "#ffffff",
    "--accent-soft": "rgba(217,72,28,0.10)",
    "--glow": "rgba(217,72,28,0.22)",
    "--backdrop":
      "radial-gradient(1100px 600px at 90% -20%, rgba(217,72,28,0.07), transparent 60%)",
    "--radius-sm": "8px",
    "--radius-md": "14px",
    "--radius-lg": "22px",
    "--shadow-panel": "0 1px 2px rgba(20,18,14,0.04), 0 12px 32px -16px rgba(20,18,14,0.18)",
    "--type-sans": FONT_SANS,
    "--type-display": FONT_SANS,
    "--type-mono": FONT_MONO,
  },
  layout: STANDARD_LAYOUT,
  motion: { ...STANDARD_MOTION, intensity: 0.7 },
};
