# SIGNALROOM: COIL (locked spec)

> One copper ribbon of 23 months of real net revenue. Unrolled, it is the timeline. Coiled on a 12-month dial, the same month of each year lines up, and the comp becomes something you can see.

Read with `scroll-storyboard.md`, `motion-spec.md`, `signature-moments.md`, `responsive-spec.md`. The selection rationale is in `../research/selection.md` (C won, 32/35).

## 1. Identity

**Signature interaction, "Turn the lens".**
- The visitor drags a copper lens along the unrolled ribbon, rotates it around the coil, or presses ←/→.
- They combine it with region, channel and category chips in the till bar.
- Every change recomputes from `monthly.json` three things: the ribbon's 23 thicknesses, the lens month's bridge slip, and its comp.

**Hero object, the Ribbon.** It has one data source, a 23-point array. Each point holds gross, discount, net, cogs, margin and units for the current filter.

| Layer (outer → inner) | Encodes | Token |
|---|---|---|
| Hairline outer edge | gross_revenue | `--cream` @ 40% |
| Gap band (hatched) | gross − net = discount + returns/cancellations residual | `--gold` hatch (discount part), `--muted` hatch (residual part) |
| Body | net_revenue | `--copper` |
| Core | margin | `--teal` |

**Palette.** The spec palette is kept. Contrast ratios were measured on `--midnight`.

| Token | Hex | Role | Contrast |
|---|---|---|---|
| `--midnight` | #101923 | page ground ("closed store at night") | n/a |
| `--cream` | #F3EFE6 | text, thermal-paper slip ground | 15.44 |
| `--copper` | #D58A58 | net revenue, the lens, selection (register-drawer metal) | 6.42 |
| `--copper-ink` | #A85F2E | copper text on cream slip (large text only) | 4.22 on cream |
| `--teal` | #308B89 | margin fill only, never text | 4.37 |
| `--teal-hi` | #5FBDB9 | margin text, focus ring | 7.99 |
| `--gold` | #E8C46A | promo / discount ("sale tag") | 10.58 |
| `--muted` | #9AA3AD | secondary text, residual hatch | 6.93 |
| `--cat-apparel` | #F0B48A | Apparel strand | ≥ 7 |
| `--cat-footwear` | #5FBDB9 | Footwear strand (shares teal-hi; never shown alongside the margin core) | 7.99 |
| `--cat-accessories` | #C9A6E0 | Accessories strand | 8.45 |
| `--cat-home` | #A9C46C | Home strand | 9.11 |

The category hues only appear when the ribbon is split by category (Scenes 4 and 5). In those scenes the margin core is hidden and margin % is shown as text only, so Footwear and margin never collide.

**Typography.** All fonts are self-hosted via @fontsource and licensed OFL-1.1.

| Role | Font | Notes |
|---|---|---|
| Display: scene titles, giant numerals | Big Shoulders Display Variable | condensed mercantile signage; wght 700–900 |
| Text: copy, chips, labels | Hanken Grotesk Variable | 15–17px body |
| Figures: slip, readouts, axis ticks | IBM Plex Mono | `font-variant-numeric: tabular-nums`, receipt voice |

**Copy voice.** Plain CFO English. Name every metric exactly as `docs/metrics.md` names it. "Revenue" always means net revenue.

## 2. Data contract (non-negotiable)

**Fixtures.** `site/public/data/{monthly,cohort,sku_monthly,pareto,filters}.json`, exported by `scripts/export_fixtures.py`.

**Aggregation.** On the main thread, memoized by filter key. 920 + 2,566 rows is trivial, so a Web Worker is not needed.

**Filter applicability.** Chips that do not apply to the current scene enter the `na` state described in `motion-spec.md`, with this reason as tooltip and `aria-description`.

| Scene / view | Fixture | month | region | channel | category |
|---|---|---|---|---|---|
| Ribbon, slip, comp (1–4) | monthly.json | ✓ | ✓ | ✓ | ✓ |
| Shelf: Pareto, SKU strands (5) | sku_monthly.json (pareto.json is the all-months check) | ✓ (range) | ✗ "SKU fixture has no region" | ✗ "SKU fixture has no channel" | ✓ |
| Return: cohorts (6) | cohort.json | ✗ | ✗ | ✗ | ✗ "Cohorts are whole-business only" |

**Rules.**

1. **Additive fields.** `net_revenue, gross_revenue, discount_amount, cogs, margin, units` may be summed across any dimension.
2. **`completed_orders` is never summed across categories.** An order with items in two categories appears in both rows: the rows sum to 62,008 against ~41k true completed orders.
   - So **orders and AOV are not shown in v1.**
   - Particles and counters use **units** or **dollars**, never orders.
   - *To add AOV later:* export a grain of month × region × channel with completed-only net_revenue and `count(distinct order_id)`. Orders are additive across region and channel because each order has one customer and one channel. Show AOV only when the category chip set is "All".
3. **Margin %** = margin / net_revenue. If net_revenue is 0, show "n/a", never 0%.
4. **Bridge residual** = gross − discount − net, labelled **"Returns & cancels effect (derived)"**. It is never split into two bars, because the fixtures cannot separate the two.
   - All-data value: $2,092,055 (21.5% of gross − discount).
   - **It is not "the value of returns plus cancellations."** In `fact_sales` a returned item is one *negative* posting with no matching positive sale, so each return counts twice in this residual: once as gross that never became revenue, and once as its negative posting. Cancels count once.
   - DB check: returned net = −$891,556; cancelled gross = $316,213.
   - The slip and Proof footnote must say this in one line: "Returned items count twice here: unrealized gross plus their negative posting."
   - `docs/metrics.md` says a fully-returned order "nets to exactly zero", which contradicts `models/marts/fact_sales.sql`. Proof must **not** reprint that sentence. The orchestrator has been flagged.
5. **Partial month.** 2026-09 covers Sep 1–3 only.
   - Draw it with the hatched, frayed ribbon end, labelled "Sep 1–3 · partial".
   - Exclude it from comps, coil spoke scaling, Y-axis domain and cohort colour scales.
   - The cohort's last column is 3–7% because of this; render it hatched as "partial month".
6. **Region** is labelled **"Customer region"** everywhere. Online orders carry a region too, and there is no store or store-region view.
7. **Comps.** Year 1 runs Nov 2024 to Oct 2025 and Year 2 runs Nov 2025 to Sep 2026, so comps exist for Nov through Aug only.
   - **Sep** has no comp, because Year 2 is partial.
   - **Oct** has no Year-2 month: "No Year-2 Oct in data".
   - Labels use "Year 1 / Year 2", never "FY2025" (this is not a retail fiscal calendar).
8. **Small cohorts.** Cohorts with n < 50 (2025-02 through 2025-06, n = 30, 34, 13, 8 and 5) render hatched at 50% emphasis, with n printed. Hover copy: "n = 8 customers, one person moves this cell 12.5 pts."
9. **Negative values.** Two SKU-months have negative net revenue (returns exceed sales). Render them below the baseline in `--muted`; never clip to 0.
10. **Numbers in text never tween** (see `motion-spec.md`). An intermediate animated value is a fabricated number.

**Reference values** for tests (all-data, no filter):

| Metric | Value |
|---|---|
| Gross | $9,970,376.42 |
| Discount | $227,893.03 |
| Net | $7,650,428.20 |
| COGS | $2,859,090.31 |
| Margin | $4,791,337.89 (62.63%) |
| Units | 93,901 |
| Peak month | Dec 2024, $654,255 |
| Trough month | Feb 2025, $209,701 |
| Comp: Nov / Dec / Jan / Jul / Aug | −1.7% / −0.5% / −5.6% / −13.2% / −1.3% |
| Promo-month margin vs non-promo | 61.08% vs 63.49% |
| Pareto: 80% of net reached at | 70 of 112 SKUs |
| Pareto: top 20 SKUs | 30.1% of net |
| Top / bottom SKU | P56 Sandals $133,117 / P61 Bags $16,257 |

## 3. Components (no others)
- **Ribbon** (SVG; Canvas 2D only for opening particles)
- **Lens**
- **Bridge Slip**
- **Comp Readout**
- **Till Bar** (chips + month range)
- **Slice Grid**
- **Shelf** (112 strands + guess handle)
- **Cohort Grid** (+ align toggle)
- **Scene Nav**
- **Proof panel**
- **Intro overlay** (+ Skip)

## 4. Stack
- **Already scaffolded:** React 19, Vite and TypeScript in `site/`.
- **Add:** `d3` (ISC) for scales, shapes and interpolate, and `motion` (MIT) for animate and scroll.
- **No GSAP.** Its "Standard no-charge" license is free but not OSI, and Motion covers the scrub.
- **No Three.js.** Nothing here needs 3D.
- **Fonts:** see the typography table. Everything is self-hosted, with zero non-origin requests (Playwright-asserted per PATTERNS.md).

## 5. Hard-rejection criteria (for the orchestrator's screenshot spot-check)
- The first viewport shows a KPI-tile row plus a chart grid. That is a dashboard, not COIL.
- Any sticky side rail beside a single chart (TERRAIN), or a vertical stage pipeline (GAUNTLET).
- The ribbon disappears between scenes and is replaced by an unrelated chart (continuity broken).
- Any "orders" or "AOV" figure derived from summed `completed_orders`.
- Sep 2026 is drawn as a normal month (it looks like a revenue crash).
- A chip appears to filter a view whose fixture lacks that dimension.
