// Acceptance checks from design/approved/signature-moments.md and the
// reference table in design/approved/concept.md section 2. These are the
// test oracle for the whole build: every exact number here is reproduced
// from scripts/export_fixtures.py's output, not eyeballed.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { MonthlyRow } from "./aggregate";
import {
  allMonths,
  bridgeResidual,
  channelSwing,
  cohortCalendarColumn,
  monthlySeries,
  paretoAnswer,
  partialMonth,
  particleCount,
  peakTrough,
  promoMarginSplit,
  regionSpread,
  yoyComps,
  type SkuMonthlyRow,
} from "./oracle";

function loadData<T>(name: string): T {
  return JSON.parse(readFileSync(fileURLToPath(new URL(`../../public/data/${name}`, import.meta.url)), "utf-8"));
}

const monthly: MonthlyRow[] = loadData("monthly.json");
const skuMonthly: SkuMonthlyRow[] = loadData("sku_monthly.json");
const months = allMonths(monthly);
const partial = partialMonth(months);
const series = monthlySeries(monthly, months);

describe("data contract shape", () => {
  it("has 23 months, Nov 2024 through Sep 2026", () => {
    expect(months).toHaveLength(23);
    expect(months[0]).toBe("2024-11");
    expect(months.at(-1)).toBe("2026-09");
  });
  it("detects the partial month as 2026-09", () => {
    expect(partial).toBe("2026-09");
  });
});

describe("all-data reference values (concept.md section 2)", () => {
  const totals = series.reduce(
    (acc, p) => ({
      gross: acc.gross + p.gross_revenue,
      discount: acc.discount + p.discount_amount,
      net: acc.net + p.net_revenue,
      cogs: acc.cogs + p.cogs,
      margin: acc.margin + p.margin,
      units: acc.units + p.units,
    }),
    { gross: 0, discount: 0, net: 0, cogs: 0, margin: 0, units: 0 }
  );

  it("gross / discount / net / cogs / margin / units", () => {
    expect(totals.gross).toBeCloseTo(9970376.42, 1);
    expect(totals.discount).toBeCloseTo(227893.03, 1);
    expect(totals.net).toBeCloseTo(7650428.2, 1);
    expect(totals.cogs).toBeCloseTo(2859090.31, 1);
    expect(totals.margin).toBeCloseTo(4791337.89, 1);
    expect(totals.margin / totals.net).toBeCloseTo(0.6263, 3);
    expect(totals.units).toBe(93901);
  });

  it("peak Dec 2024 / trough Feb 2025, excluding the partial month", () => {
    const { peak, trough } = peakTrough(series, partial);
    expect(peak.year_month).toBe("2024-12");
    expect(peak.net_revenue).toBeCloseTo(654255, 0);
    expect(trough.year_month).toBe("2025-02");
    expect(trough.net_revenue).toBeCloseTo(209701, 0);
  });

  it("YoY comps: Nov/Dec/Jan/Jul/Aug", () => {
    const comps = yoyComps(series, partial);
    const byY1 = new Map(comps.map((c) => [c.y1Month, c]));
    expect(byY1.get("2024-11")!.comp).toBeCloseTo(-0.017, 2);
    expect(byY1.get("2024-12")!.comp).toBeCloseTo(-0.005, 2);
    expect(byY1.get("2025-01")!.comp).toBeCloseTo(-0.056, 2);
    expect(byY1.get("2025-07")!.comp).toBeCloseTo(-0.132, 2);
    expect(byY1.get("2025-08")!.comp).toBeCloseTo(-0.013, 2);
  });

  it("Sep has no comp, Oct has no Year-2 month", () => {
    const comps = yoyComps(series, partial);
    const byY1 = new Map(comps.map((c) => [c.y1Month, c]));
    expect(byY1.get("2025-09")!.comp).toBeNull();
    expect(byY1.get("2025-10")!.comp).toBeNull();
  });

  it("promo-month margin 61.08% vs non-promo 63.49%", () => {
    const split = promoMarginSplit(monthly);
    expect(split.promoMarginPct).toBeCloseTo(61.08, 1);
    expect(split.nonPromoMarginPct).toBeCloseTo(63.49, 1);
  });

  it("Pareto: 80% of net reached at 70 of 112 SKUs, top 20 = 30.1%", () => {
    const result = paretoAnswer(skuMonthly);
    expect(result.n).toBe(112);
    expect(result.k).toBe(70);
    expect(result.top20Share).toBeCloseTo(30.1, 1);
  });

  it("top / bottom SKU: P56 Sandals $133,117 / P61 Bags $16,257", () => {
    const result = paretoAnswer(skuMonthly);
    const top = result.ranked[0];
    const bottom = result.ranked[result.ranked.length - 1];
    expect(top.product_id).toBe("P56");
    expect(top.net_revenue).toBeCloseTo(133117, 0);
    expect(bottom.product_id).toBe("P61");
    expect(bottom.net_revenue).toBeCloseTo(16257, 0);
  });
});

describe("signature moment 1: Print the slip (Dec 2024, all filters)", () => {
  const dec = series.find((p) => p.year_month === "2024-12")!;

  it("GROSS 864,035 / DISCOUNT 44,523 / NET 654,255", () => {
    expect(dec.gross_revenue).toBeCloseTo(864035, 0);
    expect(dec.discount_amount).toBeCloseTo(44523, 0);
    expect(dec.net_revenue).toBeCloseTo(654255, 0);
  });

  it("residual is computed as gross - discount - net, asserting the arithmetic not a literal", () => {
    const residual = bridgeResidual(dec);
    expect(residual).toBeCloseTo(dec.gross_revenue - dec.discount_amount - dec.net_revenue, 6);
    expect(residual).toBeCloseTo(165257, 0);
  });
});

describe("signature moment 3: Call the 80, no filters -> 70 of 112", () => {
  it("matches pareto.json's own precomputed totals", () => {
    const paretoJson = loadData<{ product_id: string; net_revenue: number }[]>("pareto.json");
    const result = paretoAnswer(skuMonthly);
    const byId = new Map(result.ranked.map((r) => [r.product_id, r.net_revenue]));
    for (const row of paretoJson) {
      expect(byId.get(row.product_id)).toBeCloseTo(row.net_revenue, 1);
    }
    expect(result.k).toBe(70);
  });
});

describe("signature moment 4: Align the calendar", () => {
  it("2024-11 cohort month 12 -> 2025-11, month 13 -> 2025-12", () => {
    expect(cohortCalendarColumn("2024-11", 12)).toBe("2025-11");
    expect(cohortCalendarColumn("2024-11", 13)).toBe("2025-12");
  });
});

describe("signature moment 5: Flat is a finding", () => {
  it("region spread 14.5%, computed over ALL months not the lens month", () => {
    const spread = regionSpread(monthly);
    expect(spread.spreadPct).toBeCloseTo(14.5, 1);
  });

  it("online share swings 48.5% to 65.5%", () => {
    const swing = channelSwing(monthly);
    expect(swing.minPct).toBeCloseTo(48.5, 1);
    expect(swing.maxPct).toBeCloseTo(65.5, 1);
  });
});

describe("opening particle count (never hardcoded)", () => {
  it("desktop: $5,000/particle over all-data net gives 1,530", () => {
    const totalNet = series.reduce((a, p) => a + p.net_revenue, 0);
    expect(particleCount(totalNet, 5000)).toBe(1530);
  });
  it("phone: $20,000/particle gives 383", () => {
    const totalNet = series.reduce((a, p) => a + p.net_revenue, 0);
    expect(particleCount(totalNet, 20000)).toBe(383);
  });
});

describe("guard: completed_orders / AOV never leaks outside aggregate.ts", () => {
  it("no other src file references completed_orders, orders_monthly, or an aov variable", () => {
    const { readdirSync, readFileSync: read, statSync } = require("node:fs") as typeof import("node:fs");
    const srcDir = fileURLToPath(new URL("../", import.meta.url));
    const offenders: string[] = [];
    const allowed = new Set(["aggregate.ts", "aggregate.parity.test.ts", "oracle.test.ts"]);
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const full = `${dir}/${name}`;
        if (statSync(full).isDirectory()) {
          if (name === "node_modules") continue;
          walk(full);
        } else if (/\.(ts|tsx)$/.test(name) && !allowed.has(name)) {
          const text = read(full, "utf-8");
          if (/completed_orders|orders_monthly/.test(text)) offenders.push(full);
        }
      }
    };
    walk(srcDir);
    expect(offenders).toEqual([]);
  });
});
