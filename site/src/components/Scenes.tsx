// Scenes 01-07, per design/approved/scroll-storyboard.md. Each is a
// `min-height: 100svh` section with `data-scene` matching the storyboard's
// `id` column, for the Scene Nav, the keyboard map, and the evidence harness
// anchors.
import { useEffect, useMemo, useRef, useState } from "react";
import { scroll } from "motion";
import { useRibbon } from "../lib/RibbonContext";
import { useLensKeyboard } from "../lib/useLensKeyboard";
import { useReducedMotion } from "../lib/useReducedMotion";
import {
  channelSwing,
  cohortCalendarColumn,
  paretoAnswer,
  promoMarginSplit,
  regionSpread,
  type SkuMonthlyRow,
} from "../lib/oracle";
import type { CohortData } from "../lib/useFixtures";
import { BridgeSlip } from "./BridgeSlip";
import { CompReadout } from "./CompReadout";
import { usePhone, useTablet } from "../lib/useMediaQuery";

function money(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

/* ---------------------------------------------------------------- Year -- */

export function YearScene() {
  const { months, lensIndex, setLensIndex } = useRibbon();
  const ref = useRef<HTMLElement>(null);
  useLensKeyboard(ref);

  function onAxisClick(i: number) {
    setLensIndex(i);
  }

  return (
    <section id="scene-year" data-scene="year" className="scene scene-year" ref={ref} tabIndex={-1}>
      <h2 className="eyebrow">The year</h2>
      <p className="scene-copy">
        Gross is not revenue: drag the lens to watch every month's real reconciliation, gross to net.
      </p>
      <div className="month-axis mono" role="group" aria-label="Month axis, drag or click to move the lens">
        {months.map((m, i) => (
          <button
            key={m}
            className={`axis-tick${i === lensIndex ? " active" : ""}`}
            aria-current={i === lensIndex ? "true" : undefined}
            onClick={() => onAxisClick(i)}
          >
            {m}
          </button>
        ))}
      </div>
      <BridgeSlip />
    </section>
  );
}

/* -------------------------------------------------------------- Season -- */

export function SeasonScene() {
  const { setSeasonProgress, series, partial } = useRibbon();
  const pinRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!pinRef.current || reducedMotion) return;
    const cancel = scroll(
      (p) => {
        setSeasonProgress(p);
      },
      { target: pinRef.current, offset: ["start start", "end end"] }
    );
    return cancel;
  }, [setSeasonProgress, reducedMotion]);

  const bigNumeral = useMemo(() => {
    const nov = series.find((p) => p.year_month === "2024-11")?.net_revenue ?? 0;
    const dec = series.find((p) => p.year_month === "2024-12")?.net_revenue ?? 0;
    const year1Total = series
      .filter((p) => p.year_month >= "2024-11" && p.year_month <= "2025-10" && p.year_month !== partial)
      .reduce((a, b) => a + b.net_revenue, 0);
    return year1Total > 0 ? (((nov + dec) / year1Total) * 100).toFixed(1) : "0";
  }, [series, partial]);

  return (
    <div
      className="scene-pin-wrapper"
      ref={pinRef}
      style={{ height: reducedMotion ? "100svh" : "150svh" }}
    >
      <section id="scene-season" data-scene="season" className="scene scene-season scene-pinned">
        <h2 className="eyebrow">Season</h2>
        <p className="big-numeral" aria-hidden="true">{bigNumeral}%</p>
        <p className="scene-copy">Nov and Dec as a share of Year 1 net revenue. Retail is a calendar business.</p>
        <CompReadout />
      </section>
      <div id="scene-end-season" />
    </div>
  );
}

/* --------------------------------------------------------------- Promo -- */

const TAGS: { ym: string; code: string }[] = [
  { ym: "2024-11", code: "BLACKFRI24" },
  { ym: "2024-12", code: "HOLIDAY24" },
  { ym: "2025-07", code: "SUMMER25" },
  { ym: "2025-11", code: "BLACKFRI25" },
  { ym: "2025-12", code: "HOLIDAY25" },
];

export function PromoScene() {
  const { monthly, months, setLensIndex } = useRibbon();
  const split = useMemo(() => promoMarginSplit(monthly), [monthly]);

  return (
    <section id="scene-promo" data-scene="promo" className="scene scene-promo">
      <h2 className="eyebrow">Promo</h2>
      <p className="scene-copy">
        Promo-month margin {split.promoMarginPct.toFixed(2)}% vs non-promo {split.nonPromoMarginPct.toFixed(2)}%.
        Discounts buy volume with margin.
      </p>
      <div className="promo-tags" role="list">
        {TAGS.map((tag) => (
          <button
            key={tag.code}
            type="button"
            role="listitem"
            className="promo-tag"
            onClick={() => setLensIndex(months.indexOf(tag.ym))}
          >
            {tag.code}
          </button>
        ))}
      </div>
      <p className="annotation">Jul 2025 ran SUMMER25. Jul 2026 ran nothing. Comp: -13.2%.</p>
      <CompReadout showDiscount />
    </section>
  );
}

/* --------------------------------------------------------------- Slice -- */

const REGIONS = ["Northeast", "Southeast", "Midwest", "Southwest", "West"];
const CATEGORIES = ["Apparel", "Footwear", "Accessories", "Home"];
const CHANNELS = ["online", "in-store"];

export function SliceScene() {
  const { monthly, filters, setFilters } = useRibbon();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const isPhone = usePhone();
  const isTablet = useTablet();
  const [dimension, setDimension] = useState<"region" | "category" | "channel">("region");

  const cellValue = useMemo(() => {
    const map = new Map<string, { online: number; inStore: number; margin: number; net: number }>();
    for (const row of monthly) {
      if (!row.region_name) continue;
      const key = `${row.region_name}|${row.category}`;
      const cur = map.get(key) ?? { online: 0, inStore: 0, margin: 0, net: 0 };
      if (row.channel === "online") cur.online += row.net_revenue;
      else cur.inStore += row.net_revenue;
      cur.margin += row.margin;
      cur.net += row.net_revenue;
      map.set(key, cur);
    }
    return map;
  }, [monthly]);

  // Phone-only: one dimension's totals, for the segmented-control + bar list
  // that replaces the grid (responsive-spec.md section 2, Slice: a 390px
  // grid cell labelled at 70px wide is below the 44px touch target).
  const dimensionTotals = useMemo(() => {
    const map = new Map<string, { net: number; margin: number }>();
    for (const row of monthly) {
      const key =
        dimension === "region" ? row.region_name : dimension === "category" ? row.category : row.channel === "online" ? "online" : "in-store";
      if (!key) continue;
      const cur = map.get(key) ?? { net: 0, margin: 0 };
      cur.net += row.net_revenue;
      cur.margin += row.margin;
      map.set(key, cur);
    }
    return map;
  }, [monthly, dimension]);

  const spread = useMemo(() => regionSpread(monthly), [monthly]);
  const swing = useMemo(() => channelSwing(monthly), [monthly]);

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function filterKeyFor(dim: "region" | "category" | "channel"): "regions" | "categories" | "channels" {
    return dim === "region" ? "regions" : dim === "category" ? "categories" : "channels";
  }

  function tapBar(value: string) {
    const key = filterKeyFor(dimension);
    const current = (filters as Record<string, string[] | undefined>)[key] ?? [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    setFilters({ ...filters, [key]: next.length ? next : undefined });
  }

  const contextCopy = (
    <p className="scene-copy">
      Customer regions differ by {spread.spreadPct.toFixed(1)}% ({spread.minRegion} to {spread.maxRegion}). Online
      share swings {swing.minPct.toFixed(1)}% to {swing.maxPct.toFixed(1)}% month to month. A flat result is a
      finding.
    </p>
  );

  if (isPhone) {
    const options = dimension === "region" ? REGIONS : dimension === "category" ? CATEGORIES : CHANNELS;
    const maxNet = Math.max(...options.map((o) => dimensionTotals.get(o)?.net ?? 0), 1);
    const activeKey = filterKeyFor(dimension);
    const activeValues = (filters as Record<string, string[] | undefined>)[activeKey] ?? [];
    return (
      <section id="scene-slice" data-scene="slice" className="scene scene-slice">
        <h2 className="eyebrow">Slice</h2>
        {contextCopy}
        <div className="dimension-control" role="group" aria-label="Compare by">
          {(["region", "category", "channel"] as const).map((dim) => (
            <button
              key={dim}
              type="button"
              className={`segment${dimension === dim ? " active" : ""}`}
              aria-pressed={dimension === dim}
              onClick={() => setDimension(dim)}
            >
              {dim === "region" ? "Region" : dim === "category" ? "Category" : "Channel"}
            </button>
          ))}
        </div>
        <div className="dimension-bars" role="list" aria-label={`Net revenue by ${dimension}`}>
          {options.map((opt) => {
            const v = dimensionTotals.get(opt);
            const isSelected = activeValues.includes(opt);
            return (
              // role="listitem" conflicts with aria-pressed (not an allowed
              // ARIA attribute on listitem) -- the wrapper carries the list
              // structure, the button keeps its own (implicit) interactive role.
              <div key={opt} role="listitem">
                <button
                  type="button"
                  className={`dimension-bar${isSelected ? " selected" : ""}`}
                  onClick={() => tapBar(opt)}
                  aria-pressed={isSelected}
                >
                  <span className="bar-label mono">{opt}</span>
                  <span className="bar-track">
                    <span className="bar-fill" style={{ width: `${((v?.net ?? 0) / maxNet) * 100}%` }} />
                  </span>
                  <span className="bar-value mono">{v ? money(v.net) : "n/a"}</span>
                </button>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  // Tablet (responsive-spec.md section 2): the grid transposes to 4 columns
  // (Category) x 5 rows (Region) instead of desktop's 5 x 4, which is why
  // this is swapped in JSX rather than left to a CSS column-count change
  // (the old CSS-only attempt kept 5 region column headers over 4 columns).
  const colDim = isTablet ? CATEGORIES : REGIONS;
  const rowDim = isTablet ? REGIONS : CATEGORIES;

  return (
    <section id="scene-slice" data-scene="slice" className="scene scene-slice">
      <h2 className="eyebrow">Slice</h2>
      {contextCopy}
      <div
        className="slice-grid"
        role="grid"
        aria-label={isTablet ? "Category by region, net revenue and margin" : "Region by category, net revenue and margin"}
        style={{ gridTemplateColumns: `120px repeat(${colDim.length}, 1fr)` }}
      >
        <div role="row" style={{ display: "contents" }}>
          <div className="grid-corner" role="presentation" />
          {colDim.map((c) => (
            <div key={c} className="grid-colhead mono" role="columnheader">{c}</div>
          ))}
        </div>
        {rowDim.map((row) => (
          // role="row" needs to be a real element (not a Fragment) for a valid
          // grid>row>gridcell hierarchy; display:contents keeps it invisible to
          // the CSS Grid layout so column positions are unaffected.
          <div key={row} role="row" style={{ display: "contents" }}>
            <div className="grid-rowhead mono" role="rowheader">{row}</div>
            {colDim.map((col) => {
              // cellValue is always keyed `${region}|${category}`.
              const key = isTablet ? `${row}|${col}` : `${col}|${row}`;
              const v = cellValue.get(key);
              const isSelected = selected.has(key);
              const reg = isTablet ? row : col;
              const cat = isTablet ? col : row;
              return (
                <button
                  key={key}
                  role="gridcell"
                  tabIndex={0}
                  className={`slice-cell${isSelected ? " selected" : ""}${selected.size > 0 && !isSelected ? " dimmed" : ""}`}
                  onClick={() => toggle(key)}
                  aria-label={`${reg}, ${cat}: net ${v ? money(v.net) : "n/a"}`}
                >
                  <span className="mono value">{v ? money(v.net) : "n/a"}</span>
                  <span className="mono margin">{v && v.net ? `${((v.margin / v.net) * 100).toFixed(1)}%` : "n/a"}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- Shelf -- */

export function ShelfScene({ skuMonthly }: { skuMonthly: SkuMonthlyRow[] | null }) {
  const { months } = useRibbon();
  const [guess, setGuess] = useState(50);
  const [committed, setCommitted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const result = useMemo(() => (skuMonthly ? paretoAnswer(skuMonthly, months) : null), [skuMonthly, months]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") setGuess((g) => Math.max(1, g - 1));
      else if (e.key === "ArrowRight") setGuess((g) => Math.min(result?.n ?? 112, g + 1));
      else if (e.key === "Enter" || e.key === " ") setCommitted(true);
    }
    const el = ref.current;
    el?.addEventListener("keydown", onKeyDown);
    return () => el?.removeEventListener("keydown", onKeyDown);
  }, [result]);

  if (!result) {
    return (
      <section id="scene-shelf" data-scene="shelf" className="scene scene-shelf">
        <h2 className="eyebrow">Shelf</h2>
        <p className="mono">Loading 2,566 rows...</p>
      </section>
    );
  }

  return (
    <section id="scene-shelf" data-scene="shelf" className="scene scene-shelf" ref={ref} tabIndex={-1}>
      <h2 className="eyebrow">Shelf</h2>
      <p className="scene-copy">How many of {result.n} products make 80% of revenue? Drag to guess.</p>
      <div className="pareto-chart" role="img" aria-label="Pareto chart of SKUs by net revenue, descending">
        {result.ranked.map((r, i) => (
          <div
            key={r.product_id}
            className="pareto-bar"
            data-category-rank={i}
            style={{
              height: `${(r.net_revenue / result.ranked[0].net_revenue) * 100}%`,
              opacity: committed && i >= result.k ? 0.35 : 1,
            }}
          />
        ))}
      </div>
      <div className="guess-row">
        <label htmlFor="guess-handle">Your guess</label>
        <input
          id="guess-handle"
          type="range"
          min={1}
          max={result.n}
          value={guess}
          onChange={(e) => setGuess(Number(e.target.value))}
        />
        {/* A tap-sized alternative to dragging the handle (responsive-spec.md
            section 1, "cheap extra": a stepper beside the drag). */}
        <span className="guess-stepper">
          <button type="button" aria-label="Decrease guess by 1" onClick={() => setGuess((g) => Math.max(1, g - 1))}>
            -
          </button>
          <button
            type="button"
            aria-label="Increase guess by 1"
            onClick={() => setGuess((g) => Math.min(result.n, g + 1))}
          >
            +
          </button>
        </span>
        <button type="button" onClick={() => setCommitted(true)} data-testid="lock-guess">
          Lock guess
        </button>
      </div>
      {committed && (
        <p className="pareto-answer mono">
          Real: {result.k} of {result.n} ({((result.k / result.n) * 100).toFixed(1)}%). Your guess: {guess}.
        </p>
      )}
    </section>
  );
}

/* -------------------------------------------------------------- Return -- */

export function ReturnScene({ cohort }: { cohort: CohortData | null }) {
  const [alignCalendar, setAlignCalendar] = useState(false);
  const months22 = Array.from({ length: 23 }, (_, i) => i);

  if (!cohort) {
    return (
      <section id="scene-return" data-scene="return" className="scene scene-return">
        <h2 className="eyebrow">Return</h2>
        <p className="mono">Loading cohort data...</p>
      </section>
    );
  }

  const sizeByMonth = new Map(cohort.cohort_sizes.map((c) => [c.cohort_month, c.cohort_size]));
  const rows = cohort.cohort_sizes.map((c) => c.cohort_month);
  const cellByKey = new Map(cohort.retention.map((r) => [`${r.cohort_month}|${r.months_since}`, r.retained_customers]));

  function onToggleKeyDown(e: React.KeyboardEvent) {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      setAlignCalendar((v) => !v);
    }
  }

  return (
    <section id="scene-return" data-scene="return" className="scene scene-return">
      <h2 className="eyebrow">Return</h2>
      <p className="scene-copy">
        The retention bump at months 11-13 is the holiday season pulling everyone back, not loyalty improving.
      </p>
      <button
        type="button"
        role="switch"
        aria-checked={alignCalendar}
        className="align-toggle"
        onClick={() => setAlignCalendar((v) => !v)}
        onKeyDown={onToggleKeyDown}
      >
        Align by calendar month
      </button>
      <div className="cohort-grid mono" role="grid" aria-label="Cohort retention grid">
        {rows.map((cohortMonth) => {
          const n = sizeByMonth.get(cohortMonth) ?? 0;
          const isSmall = n < 50;
          return (
            <div key={cohortMonth} className="cohort-row" role="row">
              <div className="cohort-rowhead">{cohortMonth} (n={n})</div>
              {months22.map((since) => {
                const retained = cellByKey.get(`${cohortMonth}|${since}`);
                if (retained === undefined) return <div key={since} className="cohort-cell empty" />;
                const pct = n > 0 ? retained / n : 0;
                const calendarCol = cohortCalendarColumn(cohortMonth, since);
                return (
                  <div
                    key={since}
                    role="gridcell"
                    tabIndex={0}
                    className={`cohort-cell${isSmall ? " small-n" : ""}`}
                    style={{
                      opacity: isSmall ? 0.5 : 1,
                      backgroundColor: `rgba(213,138,88,${Math.min(1, pct)})`,
                      order: alignCalendar ? Number(calendarCol.replace("-", "")) : since,
                    }}
                    aria-label={`${cohortMonth}, month ${since} (${calendarCol}): ${retained} of ${n} = ${(pct * 100).toFixed(1)}%`}
                    title={n < 50 ? `n = ${n} customers, one person moves this cell ${(100 / n).toFixed(1)} pts.` : undefined}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- Proof -- */

export function ProofScene() {
  return (
    <section id="scene-proof" data-scene="proof" className="scene scene-proof">
      <div className="proof-slip mono">
        <h2>Proof</h2>
        <p>
          Every fact_sales row reconciles within $0.001 of an independent raw recomputation
          (tests/reconciliation_fact_sales_matches_raw.sql).
        </p>
        <dl className="proof-totals">
          <div><dt>Gross</dt><dd>$9,970,376.42</dd></div>
          <div><dt>Discount</dt><dd>-$227,893.03</dd></div>
          <div><dt>Returns &amp; cancels effect (derived)</dt><dd>-$2,092,055</dd></div>
          <div><dt>Net</dt><dd>$7,650,428.20</dd></div>
          <div><dt>COGS</dt><dd>-$2,859,090.31</dd></div>
          <div><dt>Margin</dt><dd>$4,791,337.89 (62.63%)</dd></div>
        </dl>
        <h3>Definitions</h3>
        <ul>
          <li>Net revenue: signed per-status contribution (+completed, -returned, $0 cancelled).</li>
          <li>Discount: quantity x (list price - unit price), only during an active promo window.</li>
          <li>COGS: mirrors net revenue's sign.</li>
          <li>Margin %: margin / net revenue, "n/a" when net revenue is 0.</li>
          <li>Retention: distinct customers with a completed order in cohort_month + N, over the cohort's size.</li>
        </ul>
        <h3>Known limits</h3>
        <ul>
          <li>Synthetic seeded data (seed 20260101). No real retailer, transactions, or customers.</li>
          <li>Sep 2026 is partial (Sep 1-3 only) and excluded from comps, axis domains and cohort colour scales.</li>
          <li>"Customer region" is the customer's region, not a store region; online orders carry one too.</li>
          <li>AOV and completed-order counts are omitted in v1: an order can span categories, so a per-category
            distinct-order count can't be summed across categories without double counting.</li>
          <li>Returns and cancellations are inseparable in the fixtures; a return counts twice in the derived
            residual (unrealized gross, and its own negative posting), while a cancellation counts once.</li>
        </ul>
        <p className="proof-links">
          <a href="https://github.com/mrrishit909/signalroom" target="_blank" rel="noreferrer">Repository</a>
          {" · "}
          <a href="/signalroom/CREDITS.md" target="_blank" rel="noreferrer">Credits</a>
        </p>
      </div>
    </section>
  );
}
