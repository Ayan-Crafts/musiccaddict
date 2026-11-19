import { expect, test } from "@playwright/test";

const SHOTS = process.env.SONORA_SCREENSHOT_DIR;

test("shell renders with real text, navigation and persistent player", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);

  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByText("SONORA")).toBeVisible();
  await expect(page.getByText("Your music. Your library.")).toBeVisible();
  // Outside Tauri the app must say so rather than show invented numbers.
  await expect(page.getByText("Desktop backend not connected.")).toBeVisible();
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/home-dark.png` });

  const player = page.getByRole("contentinfo", { name: "Player" });
  await expect(player.getByText("Nothing playing")).toBeVisible();
  await expect(player.getByRole("button", { name: "Play" })).toBeDisabled();

  await nav.getByRole("button", { name: "Device Studio" }).click();
  await expect(page.getByRole("heading", { name: "Device Studio" })).toBeVisible();
  await expect(page.getByText("Not built yet")).toBeVisible();

  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByText("Your music. Your library.")).toBeVisible();
  await expect(player.getByText("Nothing playing")).toBeVisible();
});

test("theme gallery applies Light and the choice persists across reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Theme Gallery" }).click();
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-scheme", "light");
  await page.evaluate(() => document.fonts.ready);
  if (SHOTS) {
    await page.waitForTimeout(600); // let the colour cross-fade finish
    await page.screenshot({ path: `${SHOTS}/themes-light.png` });
  }

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-scheme", "light");
});
