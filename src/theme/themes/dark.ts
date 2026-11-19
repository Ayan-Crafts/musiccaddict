import type { ThemeManifest } from "../types";
import { FONT_MONO, FONT_SANS, STANDARD_LAYOUT, STANDARD_MOTION } from "./shared";

export const darkTheme: ThemeManifest = {
  id: "dark",
  name: "Dark",
  description: "OLED black surfaces, ember accent, quiet motion. The SONORA default.",
  scheme: "dark",
  tokens: {
    "--bg": "#060607",
    "--bg-elevated": "#0d0d10",
    "--surface": "#141418",
    "--surface-hover": "#1b1b21",
    "--surface-active": "#23232b",
    "--border": "rgba(255,255,255,0.06)",
    "--border-strong": "rgba(255,255,255,0.12)",
    "--fg": "#f4f2ee",
    "--fg-muted": "#a19e98",
    "--fg-subtle": "#68665f",
    "--accent": "#ff6a3d",
    "--accent-fg": "#140703",
    "--accent-soft": "rgba(255,106,61,0.14)",
    "--glow": "rgba(255,106,61,0.35)",
    "--backdrop":
      "radial-gradient(1200px 600px at 85% -10%, rgba(255,106,61,0.10), transparent 60%), radial-gradient(900px 500px at -10% 110%, rgba(120,90,255,0.07), transparent 60%)",
    "--radius-sm": "8px",
    "--radius-md": "14px",
    "--radius-lg": "22px",
    "--shadow-panel": "0 1px 0 rgba(255,255,255,0.04) inset, 0 20px 40px -20px rgba(0,0,0,0.8)",
    "--type-sans": FONT_SANS,
    "--type-display": FONT_SANS,
    "--type-mono": FONT_MONO,
  },
  layout: STANDARD_LAYOUT,
  motion: { ...STANDARD_MOTION, intensity: 0.7 },
};
