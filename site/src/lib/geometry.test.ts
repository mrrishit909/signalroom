// Signature moment 2 ("The Coil"), acceptance check 2: at p = 1 the Nov 2024
// and Nov 2025 path points lie on the same spoke angle (+/- 0.5 degrees).
import { describe, expect, it } from "vitest";
import { spokeAngleDeg } from "./geometry";

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
