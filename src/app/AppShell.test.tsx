import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useThemeStore } from "../theme/store";
import { AppShell } from "./AppShell";
import { useRouter } from "./router";

afterEach(cleanup);
beforeEach(() => useRouter.setState({ current: "home", back: [], forward: [], direction: 1 }));

describe("AppShell", () => {
  it("keeps the same player element mounted across navigation and theme changes", async () => {
    render(<AppShell />);
    const player = screen.getByRole("contentinfo", { name: "Player" });

    await act(async () => useRouter.getState().navigate("settings"));
    await act(async () => useThemeStore.getState().setTheme("light"));
    await act(async () => useRouter.getState().navigate("audio-lab"));

    expect(screen.getByRole("contentinfo", { name: "Player" })).toBe(player);
    expect(document.documentElement.dataset.scheme).toBe("light");
  });
});
