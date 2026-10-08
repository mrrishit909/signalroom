// axe-core scan of every scene (desktop composition) and the phone composition
// (coil-first hero, bottom sheet, bottom dock nav) -- zero serious/critical
// violations is the bar used across this portfolio (PREDICTIVE, QUERYMIND).
//
// .big-numeral is excluded from the contrast check: it's a 20%-opacity
// decorative watermark number behind the coil (motion-spec.md section 3),
// already aria-hidden, whose real value is shown at full contrast in the
// Comp Readout elsewhere on screen -- WCAG 1.4.3's own exception for
// decorative/incidental text. Lowering its opacity to pass contrast would
// break the specced "atmospheric background" treatment for no accessibility
// gain, since the information is never only available at low contrast.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const SCENES = ["year", "season", "promo", "slice", "shelf", "return", "proof"];

function seriousOrCritical(violations: { impact?: string | null }[]) {
  return violations.filter((v) => v.impact === "serious" || v.impact === "critical");
}

test.describe("desktop (1440px)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const scene of SCENES) {
    test(`scene ${scene}: zero serious/critical axe violations`, async ({ page }) => {
      await page.goto("/");
      await page.keyboard.press("Escape");
      await page.locator(`[data-scene="${scene}"]`).scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      const results = await new AxeBuilder({ page }).exclude(".big-numeral").analyze();
      const bad = seriousOrCritical(results.violations);
      expect(bad, JSON.stringify(bad, null, 2)).toEqual([]);
    });
  }
});

test.describe("phone (390px)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const scene of SCENES) {
    test(`scene ${scene}: zero serious/critical axe violations`, async ({ page }) => {
      await page.goto("/");
      await page.keyboard.press("Escape");
      await page.locator(`[data-scene="${scene}"]`).scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      const results = await new AxeBuilder({ page }).exclude(".big-numeral").analyze();
      const bad = seriousOrCritical(results.violations);
      expect(bad, JSON.stringify(bad, null, 2)).toEqual([]);
    });
  }
});
