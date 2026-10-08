// Signature moment 2 ("The Coil"), acceptance check 2: at p = 1 the Nov 2024
// and Nov 2025 path points lie on the same spoke angle (+/- 0.5 degrees).
import { describe, expect, it } from "vitest";
import {
  SAMPLES_PER_RIBBON,
  axisFrame,
  contextStripFrame,
  sampleIndexForMonth,
  spokeAngleDeg,
  unrolledFrame,
} from "./geometry";
import type { MonthPoint } from "./oracle";

const VIEWPORT = { width: 1000, height: 600 };
const SCALE = (v: number) => v / 5000;

function fakeSeries(n: number): MonthPoint[] {
  return Array.from({ length: n }, (_, i) => ({
    year_month: `m${i}`,
    gross_revenue: 100000 + i * 1000,
    discount_amount: 1000,
    net_revenue: 90000 + i * 900,
    cogs: 40000,
    margin: 50000,
    units: 100,
  })) as unknown as MonthPoint[];
}

describe("coil spoke angle", () => {
  it("Nov is spoke 0 (12 o'clock) in every turn", () => {
    // Series index 0 = 2024-11 (Year 1 Nov), index 12 = 2025-11 (Year 2 Nov).
    const nov2024 = spokeAngleDeg(0);
    const nov2025 = spokeAngleDeg(12);
    expect(Math.abs(nov2024 - nov2025)).toBeLessThanOrEqual(0.5);
    expect(nov2024).toBe(0);
  });

  it("Dec is spoke 30deg, Jul (8 months after Nov) is spoke 240deg", () => {
    expect(spokeAngleDeg(1)).toBe(30);
    expect(spokeAngleDeg(8)).toBe(240);
  });

  it("12 spokes total, 30deg apart, wrapping every year", () => {
    const angles = Array.from({ length: 12 }, (_, i) => spokeAngleDeg(i));
    expect(new Set(angles).size).toBe(12);
    expect(spokeAngleDeg(0)).toBe(spokeAngleDeg(12));
  });
});

// Slice's context strip, acceptance check: every centerline point sits in
// the top 20% of the viewport and x strictly increases, same as a Year-style
// unroll but compressed -- distinguishing it from the coil (which has no
// monotonic x) and from the full-size unrolled hero.
describe("context strip (Slice)", () => {
  const series = fakeSeries(23);
  const frame = contextStripFrame(series, VIEWPORT, SCALE);

  it("has the standard sample count", () => {
    expect(frame.centerline.length).toBe(SAMPLES_PER_RIBBON);
  });

  it("every centerline y sits in the top 20% of the viewport", () => {
    for (const p of frame.centerline) {
      expect(p.y).toBeLessThan(VIEWPORT.height * 0.2);
    }
  });

  it("x strictly increases left to right", () => {
    for (let i = 1; i < frame.centerline.length; i++) {
      expect(frame.centerline[i].x).toBeGreaterThan(frame.centerline[i - 1].x);
    }
  });

  it("is thinner than the full unrolled hero at the same sample", () => {
    const unrolled = unrolledFrame(series, VIEWPORT, SCALE);
    const stripThickness = frame.gross.outer[120].y - frame.gross.inner[120].y;
    const heroThickness = unrolled.gross.outer[120].y - unrolled.gross.inner[120].y;
    expect(Math.abs(stripThickness)).toBeLessThan(Math.abs(heroThickness));
  });
});

// Return's calendar axis, acceptance check: thickness is constant at every
// sample (it is a position axis, not a value-encoded ribbon) and the 23
// month ticks (via sampleIndexForMonth) are equally spaced along x -- the
// property that makes it read as "calendar axis" rather than a second
// context strip.
describe("calendar axis (Return)", () => {
  const series = fakeSeries(23);
  const frame = axisFrame(series, VIEWPORT, SCALE);

  it("has constant thickness at every sample", () => {
    const thicknesses = frame.gross.outer.map((o, i) => o.y - frame.gross.inner[i].y);
    const first = thicknesses[0];
    for (const t of thicknesses) {
      expect(Math.abs(t - first)).toBeLessThan(1e-9);
    }
  });

  it("the 23 month ticks are equally spaced along x", () => {
    const ticks = Array.from({ length: 23 }, (_, m) => {
      const s = sampleIndexForMonth(m, 23);
      return frame.centerline[s].x;
    });
    // Rounding each month to the nearest of 240 discrete samples introduces
    // up to about one sample-width of jitter; tolerance is set just above
    // that (one sample ~= usable-width / 239), not tightened to 0.
    const steps = ticks.slice(1).map((x, i) => x - ticks[i]);
    const first = steps[0];
    for (const step of steps) {
      expect(Math.abs(step - first)).toBeLessThan(5);
    }
  });
});
