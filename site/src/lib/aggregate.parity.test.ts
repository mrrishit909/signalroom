// Proves the in-browser JS aggregator (aggregate.ts, running over the static
// monthly.json grain) agrees with real SQL run directly against fact_sales
// (scripts/generate_parity_fixture.py), for every sampled filter combination.
// This is the parity gate the spec's criterion 06 demands: "chart tooltip
// values and exported figures match the same SQL result."
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { aggregate, type MonthlyRow, type OrdersMonthlyRow } from "./aggregate";

const monthly: MonthlyRow[] = JSON.parse(
  readFileSync(fileURLToPath(new URL("../../public/data/monthly.json", import.meta.url)), "utf-8")
);
const ordersMonthly: OrdersMonthlyRow[] = JSON.parse(
  readFileSync(fileURLToPath(new URL("../../public/data/orders_monthly.json", import.meta.url)), "utf-8")
);
const cases: { filters: { regions: string[]; categories: string[]; channels: string[] }; expected: Record<string, number | null> }[] =
  JSON.parse(readFileSync(fileURLToPath(new URL("./__fixtures__/parity_cases.json", import.meta.url)), "utf-8"));

describe("JS aggregator matches real SQL over fact_sales", () => {
  it("has a non-trivial number of parity cases", () => {
    expect(cases.length).toBeGreaterThanOrEqual(20);
  });

  for (const [i, c] of cases.entries()) {
    it(`case ${i}: regions=${c.filters.regions} categories=${c.filters.categories} channels=${c.filters.channels}`, () => {
      const result = aggregate(monthly, ordersMonthly, {
        regions: c.filters.regions.length ? c.filters.regions : undefined,
        categories: c.filters.categories.length ? c.filters.categories : undefined,
        channels: c.filters.channels.length ? c.filters.channels : undefined,
      });
      for (const key of ["net_revenue", "gross_revenue", "discount_amount", "cogs", "margin", "units", "completed_orders"] as const) {
        expect(result[key]).toBeCloseTo(c.expected[key] as number, 2);
      }
      if (c.expected.margin_pct === null) {
        expect(result.margin_pct).toBeNull();
      } else {
        expect(result.margin_pct).toBeCloseTo(c.expected.margin_pct as number, 6);
      }
    });
  }
});
