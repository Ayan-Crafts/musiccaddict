import type { ThemeLayout, ThemeMotion } from "../types";

export const FONT_SANS = `"Manrope Variable", "Manrope", ui-sans-serif, system-ui, "Segoe UI", sans-serif`;
export const FONT_MONO = `"JetBrains Mono Variable", "JetBrains Mono", ui-monospace, "Cascadia Mono", monospace`;

export const STANDARD_LAYOUT: ThemeLayout = {
  nav: "left",
  progress: "ltr",
  time: "elapsed-first",
  controls: "normal",
};

export const STANDARD_MOTION: ThemeMotion = {
  flow: 1,
  intensity: 1,
  ease: [0.22, 1, 0.36, 1],
  duration: { fast: 0.14, base: 0.28, slow: 0.5 },
};
