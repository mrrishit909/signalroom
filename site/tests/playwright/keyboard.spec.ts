// responsive-spec.md section 5 keyboard map: digits 1-7 jump scenes only
// while focus is inside the Scene Nav (WCAG 2.1.4), and Left/Right move the
// lens by one month when focus is on a scene's focusable marks.
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Escape"); // skip the intro
});

test("digit keys jump scenes only while focus is in the Scene Nav", async ({ page }) => {
  const firstNavButton = page.locator(".scene-nav button").first();
  await firstNavButton.focus();
  await page.keyboard.press("5");
  await expect(page.locator('.scene-nav button[aria-current="true"]')).toHaveText(/Shelf/);

  // Outside the nav, digit "5" must not jump scenes.
  await firstNavButton.focus();
  await page.keyboard.press("1"); // back to Year via the nav
  await page.locator("body").click({ position: { x: 5, y: 5 } });
  await page.keyboard.press("5");
  await expect(page.locator('.scene-nav button[aria-current="true"]')).toHaveText(/Year/);
});

test("Left/Right arrows move the lens one month when the Year scene is focused", async ({ page }) => {
  const yearSection = page.locator('[data-scene="year"]');
  await yearSection.focus();
  const readout = page.locator(".aria-live-readout");
  await expect(readout).not.toHaveText("");
  const before = await readout.textContent();
  await page.keyboard.press("ArrowRight");
  const after = await readout.textContent();
  expect(after).not.toBe(before);
});
