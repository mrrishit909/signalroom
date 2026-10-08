// Hard requirements: self-hosted fonts only (zero non-origin requests), and
// the orders/AOV guard -- orders_monthly.json must never be fetched from the
// UI (concept.md rule 2: AOV/completed_orders are omitted from v1).
import { test, expect } from "@playwright/test";

test("zero requests to any non-origin URL", async ({ page, baseURL }) => {
  const offOrigin: string[] = [];
  page.on("request", (req) => {
    const url = new URL(req.url());
    if (url.origin !== new URL(baseURL!).origin) offOrigin.push(req.url());
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(offOrigin).toEqual([]);
});

test("orders_monthly.json is never requested by the UI", async ({ page }) => {
  const requested: string[] = [];
  page.on("request", (req) => {
    if (req.url().includes("orders_monthly.json")) requested.push(req.url());
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  // Skip the intro and scroll through every scene so lazy-loaded fixtures fire.
  await page.keyboard.press("Escape");
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(500);
  expect(requested).toEqual([]);
});
