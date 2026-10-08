// Pure in-browser aggregation over the real pre-computed grains exported by
// scripts/export_fixtures.py from the verified dbt marts. No fabricated
// numbers: every value returned here is a real sum over real rows that trace
// back to fact_sales. Runs on the main thread, memoized by filter key: 920 +
// 230 rows is trivial, so a Web Worker is not needed (concept.md section 2).
//
// completed_orders/AOV deliberately come from a SEPARATE grain (orders_monthly,
// region x channel x month) than revenue/margin/units (monthly, which also
// slices by category). An order can contain items from more than one category,
// so a per-category distinct-order-count cannot be re-summed across categories
// without double counting -- see docs/metrics.md. That means AOV always
// reflects the active region/channel/month filters but ignores any category
// filter; the UI must label it that way, not silently show a wrong number.
export interface MonthlyRow {
  year_month: string;
  region_name: string | null;
  channel: string;
  category: string;
  net_revenue: number;
  gross_revenue: number;
  discount_amount: number;
  cogs: number;
  margin: number;
  units: number;
}

export interface OrdersMonthlyRow {
  year_month: string;
  region_name: string | null;
  channel: string;
  completed_orders: number;
  completed_net_revenue: number;
}

export interface Filters {
  regions?: string[];
  categories?: string[];
  channels?: string[];
  monthRange?: [string, string];
}

export interface AggregateResult {
  net_revenue: number;
  gross_revenue: number;
  discount_amount: number;
  cogs: number;
  margin: number;
  margin_pct: number | null;
  units: number;
  completed_orders: number;
  aov: number | null;
}

function monthlyMatches(row: MonthlyRow, f: Filters): boolean {
  if (f.regions?.length && row.region_name && !f.regions.includes(row.region_name)) return false;
  if (f.categories?.length && !f.categories.includes(row.category)) return false;
  if (f.channels?.length && !f.channels.includes(row.channel)) return false;
  if (f.monthRange && (row.year_month < f.monthRange[0] || row.year_month > f.monthRange[1])) return false;
  return true;
}

function ordersMatches(row: OrdersMonthlyRow, f: Filters): boolean {
  if (f.regions?.length && row.region_name && !f.regions.includes(row.region_name)) return false;
  if (f.channels?.length && !f.channels.includes(row.channel)) return false;
  if (f.monthRange && (row.year_month < f.monthRange[0] || row.year_month > f.monthRange[1])) return false;
  return true;
}

export function aggregate(monthly: MonthlyRow[], ordersMonthly: OrdersMonthlyRow[], filters: Filters = {}): AggregateResult {
  let net_revenue = 0, gross_revenue = 0, discount_amount = 0, cogs = 0, units = 0;
  for (const row of monthly) {
    if (!monthlyMatches(row, filters)) continue;
    net_revenue += row.net_revenue;
    gross_revenue += row.gross_revenue;
    discount_amount += row.discount_amount;
    cogs += row.cogs;
    units += row.units;
  }

  let completed_orders = 0, completed_net_revenue = 0;
  for (const row of ordersMonthly) {
    if (!ordersMatches(row, filters)) continue;
    completed_orders += row.completed_orders;
    completed_net_revenue += row.completed_net_revenue;
  }

  const margin = net_revenue - cogs;
  return {
    net_revenue, gross_revenue, discount_amount, cogs, margin,
    margin_pct: net_revenue !== 0 ? margin / net_revenue : null,
    units, completed_orders,
    aov: completed_orders > 0 ? completed_net_revenue / completed_orders : null,
  };
}

export function timeSeries(rows: MonthlyRow[], filters: Filters = {}): { year_month: string; net_revenue: number; margin: number }[] {
  const byMonth = new Map<string, { net_revenue: number; cogs: number }>();
  for (const row of rows) {
    if (!monthlyMatches(row, filters)) continue;
    const cur = byMonth.get(row.year_month) ?? { net_revenue: 0, cogs: 0 };
    cur.net_revenue += row.net_revenue;
    cur.cogs += row.cogs;
    byMonth.set(row.year_month, cur);
  }
  return Array.from(byMonth.entries())
    .map(([year_month, v]) => ({ year_month, net_revenue: v.net_revenue, margin: v.net_revenue - v.cogs }))
    .sort((a, b) => a.year_month.localeCompare(b.year_month));
}
