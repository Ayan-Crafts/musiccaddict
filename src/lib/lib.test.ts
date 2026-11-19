import { describe, expect, it } from "vitest";
import { formatDuration, greeting } from "./format";
import { api } from "./ipc";

describe("formatDuration", () => {
  it.each([
    [0, "0:00"],
    [999, "0:00"],
    [65_000, "1:05"],
    [3_725_000, "1:02:05"],
    [-5, "0:00"],
    [Number.NaN, "0:00"],
  ])("%d ms → %s", (ms, out) => expect(formatDuration(ms)).toBe(out));
});

describe("greeting", () => {
  it("varies by hour", () => {
    expect(greeting(new Date(2026, 0, 1, 9))).toBe("Good morning");
    expect(greeting(new Date(2026, 0, 1, 21))).toBe("Good evening");
  });
});

describe("ipc outside Tauri", () => {
  it("reports NO_BACKEND instead of inventing data", async () => {
    const r = await api.dbStatus();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("NO_BACKEND");
  });
});
