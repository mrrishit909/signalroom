// responsive-spec.md section 4: under prefers-reduced-motion, the opening
// is not played. First paint is the settled Scene 1 hook frame: no Skip
// button, a static particle caption, and the slip already printed for
// Dec 2024 (NET 654,255).
import { test, expect } from "@playwright/test";

test("reduced motion: no skip button, static caption, slip shows NET 654,255", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".opening")).toBeVisible();
  await expect(page.locator(".skip-intro")).toHaveCount(0);
  await expect(page.locator(".static-caption")).toContainText("1,530");
  await expect(page.locator(".bridge-slip")).toContainText("654,255");
});
