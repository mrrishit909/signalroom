// Pure derived-number functions used by every scene. Every number shown on
// the site traces to monthly.json / sku_monthly.json / cohort.json through
// one of these functions (or aggregate.ts). See
// site/src/lib/oracle.test.ts for the acceptance checks from
// design/approved/signature-moments.md and concept.md's reference table.
//
// Formulas here were picked by testing which one reproduces the locked
// reference numbers (see the final report): region spread and the online
// share range both include the partial Sep 2026 month; promo-margin split
// does too (Sep has no active promo so it falls in the non-promo bucket
// either way); peak/trough and the ribbon's own geometry/axis EXCLUDE the
// partial month per concept.md rule 5.
import type { MonthlyRow } from "./aggregate";

export interface SkuMonthlyRow {
  product_id: string;
  product_name: string;
  category: string;
  year_month: string;
  net_revenue: number;
  units: number;
  margin: number;
}

export const MONTHLY_FIELDS = [
  "net_revenue",
  "gross_revenue",
  "discount_amount",
  "cogs",
  "margin",
  "units",
] as const;
export type MonthlyField = (typeof MONTHLY_FIELDS)[number];

export interface MonthPoint {
  year_month: string;
  net_revenue: number;
  gross_revenue: number;
  discount_amount: number;
  cogs: number;
  margin: number;
  units: number;
}

/** All distinct months present, sorted ascending ("2024-11" .. "2026-09"). */
export function allMonths(rows: MonthlyRow[]): string[] {
  return Array.from(new Set(rows.map((r) => r.year_month))).sort();
}

/**
 * The last chronological month in the fixture is the partial-month stub
 * (2026-09, Sep 1-3 only in this dataset), concept.md rule 5. Detected
 * structurally (last month, by construction of this generator) rather than
 * hardcoded, but documented here as the data-contract assumption it is.
 */
export function partialMonth(months: string[]): string {
  return months[months.length - 1];
}

export interface MonthlyFilters {
  regions?: string[];
  categories?: string[];
  channels?: string[];
}

function rowMatches(row: MonthlyRow, f: MonthlyFilters): boolean {
  if (f.regions?.length && row.region_name && !f.regions.includes(row.region_name)) return false;
  if (f.categories?.length && !f.categories.includes(row.category)) return false;
  if (f.channels?.length && !f.channels.includes(row.channel)) return false;
  return true;
}

/**
 * The ribbon's 23-point array for a given filter: a fixed-length,
 * zero-padded series (every real month present, even if the filter zeroes
 * it out) so d3.interpolate can morph it against any other filter's series
 * or against a different geometry form without array-length mismatches.
 */
export function monthlySeries(rows: MonthlyRow[], months: string[], filters: MonthlyFilters = {}): MonthPoint[] {
  const byMonth = new Map<string, MonthPoint>(
    months.map((ym) => [
      ym,
      { year_month: ym, net_revenue: 0, gross_revenue: 0, discount_amount: 0, cogs: 0, margin: 0, units: 0 },
    ])
  );
  for (const row of rows) {
    if (!rowMatches(row, filters)) continue;
    const point = byMonth.get(row.year_month);
    if (!point) continue;
    point.net_revenue += row.net_revenue;
    point.gross_revenue += row.gross_revenue;
    point.discount_amount += row.discount_amount;
    point.cogs += row.cogs;
    point.margin += row.margin;
    point.units += row.units;
  }
  return months.map((ym) => byMonth.get(ym)!);
}

export function marginPct(point: { net_revenue: number; margin: number }): number | null {
  return point.net_revenue !== 0 ? point.margin / point.net_revenue : null;
}

/** gross - discount - net, labelled "Returns & cancels effect (derived)". */
export function bridgeResidual(point: { gross_revenue: number; discount_amount: number; net_revenue: number }): number {
  return point.gross_revenue - point.discount_amount - point.net_revenue;
}

export interface PeakTrough {
  peak: { year_month: string; net_revenue: number };
  trough: { year_month: string; net_revenue: number };
}

/** Excludes the partial month, per concept.md rule 5 ("Y-axis domain"). */
export function peakTrough(series: MonthPoint[], partial: string): PeakTrough {
  const usable = series.filter((p) => p.year_month !== partial);
  let peak = usable[0];
  let trough = usable[0];
  for (const p of usable) {
    if (p.net_revenue > peak.net_revenue) peak = p;
    if (p.net_revenue < trough.net_revenue) trough = p;
  }
  return { peak, trough };
}

function addMonths(ym: string, n: number): string {
  const [y, m] = ym.split("-").map(Number);
  const total = y * 12 + (m - 1) + n;
  const ny = Math.floor(total / 12);
  const nm = ((total % 12) + 12) % 12;
  return `${ny.toString().padStart(4, "0")}-${(nm + 1).toString().padStart(2, "0")}`;
}

export interface Comp {
  y1Month: string;
  y2Month: string;
  comp: number | null;
  reason?: string;
}

/**
 * Year-over-year comp (Y2 - Y1) / Y1 for each of Year 1's 12 months
 * (Nov 2024 - Oct 2025), mapped to the corresponding Year 2 month 12 months
 * later. Sep has no comp (Year 2 is partial); Oct has no Year-2 month at
 * all, concept.md rule 7.
 */
export function yoyComps(series: MonthPoint[], partial: string): Comp[] {
  const byMonth = new Map(series.map((p) => [p.year_month, p]));
  const out: Comp[] = [];
  for (let i = 0; i < 12; i++) {
    const y1Month = addMonths("2024-11", i);
    const y2Month = addMonths(y1Month, 12);
    if (y2Month === partial) {
      out.push({ y1Month, y2Month, comp: null, reason: "No comp, Sep 1-3 partial" });
      continue;
    }
    const y2 = byMonth.get(y2Month);
    if (!y2) {
      out.push({ y1Month, y2Month, comp: null, reason: "No Year-2 month in data" });
      continue;
    }
    const y1 = byMonth.get(y1Month);
    if (!y1 || y1.net_revenue === 0) {
      out.push({ y1Month, y2Month, comp: null, reason: "No baseline" });
      continue;
    }
    out.push({ y1Month, y2Month, comp: (y2.net_revenue - y1.net_revenue) / y1.net_revenue });
  }
  return out;
}

export interface RegionSpread {
  spreadPct: number;
  minRegion: string;
  maxRegion: string;
  byRegion: Map<string, number>;
}

/** (max-min)/mean across regions, over ALL months (not the lens month). */
export function regionSpread(rows: MonthlyRow[], filters: MonthlyFilters = {}): RegionSpread {
  const byRegion = new Map<string, number>();
  for (const row of rows) {
    if (!rowMatches(row, filters)) continue;
    if (!row.region_name) continue;
    byRegion.set(row.region_name, (byRegion.get(row.region_name) ?? 0) + row.net_revenue);
  }
  const entries = Array.from(byRegion.entries());
  const values = entries.map(([, v]) => v);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return {
    spreadPct: ((max - min) / mean) * 100,
    minRegion: entries.find(([, v]) => v === min)![0],
    maxRegion: entries.find(([, v]) => v === max)![0],
    byRegion,
  };
}

/** Online net-revenue share per month, min/max across all months present. */
export function channelSwing(rows: MonthlyRow[], filters: MonthlyFilters = {}): { minPct: number; maxPct: number } {
  const byMonth = new Map<string, { online: number; total: number }>();
  for (const row of rows) {
    if (!rowMatches(row, filters)) continue;
    const cur = byMonth.get(row.year_month) ?? { online: 0, total: 0 };
    if (row.channel === "online") cur.online += row.net_revenue;
    cur.total += row.net_revenue;
    byMonth.set(row.year_month, cur);
  }
  const shares = Array.from(byMonth.values())
    .filter((v) => v.total !== 0)
    .map((v) => (v.online / v.total) * 100);
  return { minPct: Math.min(...shares), maxPct: Math.max(...shares) };
}

export interface PromoMarginSplit {
  promoMonths: string[];
  promoMarginPct: number;
  nonPromoMarginPct: number;
}

/** A promo month is any month with discount_amount > 0, per concept.md rule. */
export function promoMarginSplit(rows: MonthlyRow[], filters: MonthlyFilters = {}): PromoMarginSplit {
  const byMonth = new Map<string, { net: number; discount: number }>();
  for (const row of rows) {
    if (!rowMatches(row, filters)) continue;
    const cur = byMonth.get(row.year_month) ?? { net: 0, discount: 0 };
    cur.net += row.net_revenue;
    cur.discount += row.discount_amount;
    byMonth.set(row.year_month, cur);
  }
  const promoMonths = Array.from(byMonth.entries())
    .filter(([, v]) => v.discount > 0)
    .map(([ym]) => ym);
  const promoSet = new Set(promoMonths);
  let pNet = 0, pMargin = 0, npNet = 0, npMargin = 0;
  for (const row of rows) {
    if (!rowMatches(row, filters)) continue;
    if (promoSet.has(row.year_month)) {
      pNet += row.net_revenue;
      pMargin += row.margin;
    } else {
      npNet += row.net_revenue;
      npMargin += row.margin;
    }
  }
  return {
    promoMonths,
    promoMarginPct: (pMargin / pNet) * 100,
    nonPromoMarginPct: (npMargin / npNet) * 100,
  };
}

export interface ParetoResult {
  ranked: { product_id: string; product_name: string; net_revenue: number; cumShare: number }[];
  n: number;
  k: number;
  top20Share: number;
}

/** Products summed over the selected months/categories, sorted desc, cumulated. */
export function paretoAnswer(rows: SkuMonthlyRow[], months?: string[], categories?: string[]): ParetoResult {
  const byProduct = new Map<string, { product_id: string; product_name: string; net_revenue: number }>();
  for (const row of rows) {
    if (months && !months.includes(row.year_month)) continue;
    if (categories?.length && !categories.includes(row.category)) continue;
    const cur = byProduct.get(row.product_id) ?? {
      product_id: row.product_id,
      product_name: row.product_name,
      net_revenue: 0,
    };
    cur.net_revenue += row.net_revenue;
    byProduct.set(row.product_id, cur);
  }
  const sorted = Array.from(byProduct.values()).sort((a, b) => b.net_revenue - a.net_revenue);
  const total = sorted.reduce((a, b) => a + b.net_revenue, 0);
  let cum = 0;
  let k = sorted.length;
  const ranked = sorted.map((p, i) => {
    cum += p.net_revenue;
    const cumShare = cum / total;
    if (k === sorted.length && cumShare >= 0.8) k = i + 1;
    return { product_id: p.product_id, product_name: p.product_name, net_revenue: p.net_revenue, cumShare };
  });
  const top20Share = (sorted.slice(0, 20).reduce((a, b) => a + b.net_revenue, 0) / total) * 100;
  return { ranked, n: sorted.length, k, top20Share };
}

/** Cohort column under "align by calendar month": cohort_month + months_since. */
export function cohortCalendarColumn(cohortMonth: string, monthsSince: number): string {
  return addMonths(cohortMonth, monthsSince);
}

/** round(net / dollarsPerParticle), the opening's particle count, never hardcoded. */
export function particleCount(netRevenue: number, dollarsPerParticle: number): number {
  return Math.round(netRevenue / dollarsPerParticle);
}
