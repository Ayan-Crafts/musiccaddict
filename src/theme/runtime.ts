import { TOKEN_NAMES, type ThemeManifest } from "./types";

/** Writes a manifest's tokens onto the root element as CSS custom properties. */
export function applyTheme(theme: ThemeManifest, root: HTMLElement = document.documentElement): void {
  for (const name of TOKEN_NAMES) {
    root.style.setProperty(name, theme.tokens[name]);
  }
  root.dataset.theme = theme.id;
  root.dataset.scheme = theme.scheme;
  root.dataset.flow = theme.motion.flow === 1 ? "forward" : "inverted";
  root.style.colorScheme = theme.scheme;
}
