import { describe, expect, it } from "vitest";
import { DEFAULT_THEME_ID, hasTheme, listThemes, loadTheme, registerTheme } from "./registry";
import { applyTheme } from "./runtime";
import { darkTheme } from "./themes/dark";
import { lightTheme } from "./themes/light";
import { TOKEN_NAMES } from "./types";

describe("theme registry", () => {
  it("ships dark and light, dark is default", async () => {
    expect(hasTheme("dark")).toBe(true);
    expect(hasTheme("light")).toBe(true);
    expect(DEFAULT_THEME_ID).toBe("dark");
    expect((await loadTheme("light")).id).toBe("light");
  });

  it("falls back to the default for unknown ids", async () => {
    expect((await loadTheme("does-not-exist")).id).toBe("dark");
  });

  it("rejects duplicate registration", () => {
    expect(() => registerTheme({ ...darkTheme, load: async () => darkTheme })).toThrow();
  });

  it("every installed theme defines every token", async () => {
    for (const entry of listThemes()) {
      const t = await entry.load();
      for (const name of TOKEN_NAMES) expect(t.tokens[name], `${t.id} ${name}`).toBeTruthy();
    }
  });
});

describe("applyTheme", () => {
  it("writes tokens and metadata to the root element", () => {
    const root = document.createElement("div");
    applyTheme(lightTheme, root);
    expect(root.style.getPropertyValue("--bg")).toBe(lightTheme.tokens["--bg"]);
    expect(root.dataset.scheme).toBe("light");
    expect(root.dataset.flow).toBe("forward");
    applyTheme(darkTheme, root);
    expect(root.style.getPropertyValue("--bg")).toBe(darkTheme.tokens["--bg"]);
    expect(root.dataset.theme).toBe("dark");
  });
});
