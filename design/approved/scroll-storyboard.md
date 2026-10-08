# Scroll storyboard: COIL

There are an opening sequence and 7 scenes. The **Ribbon** is on screen in every scene. Every scene enters by transforming the ribbon's geometry from the previous scene's form, never by cutting to it.

**"Camera".** There is no 3D. The camera is the SVG `viewBox` (pan and zoom) plus the ribbon's own geometry. Camera moves are tweens of the viewBox using the motion tokens in `motion-spec.md`.

**Scroll model.**
- Each scene is a section of `min-height: 100svh`.
- Scenes 2 and 5 are pinned with scroll-scrubbed transforms (150svh and 120svh of scroll respectively).
- The Scene Nav jumps with `scrollIntoView` and lands each scene in its settled end state.

## Scene Nav

The nav is horizontal: a top bar on desktop and tablet, a bottom dock on phones.

| # | Label | `id` | aria-label |
|---|---|---|---|
| 01 | Year | `year` | "Scene 1: The year in net revenue" |
| 02 | Season | `season` | "Scene 2: Seasonality and comps" |
| 03 | Promo | `promo` | "Scene 3: Promotions and margin" |
| 04 | Slice | `slice` | "Scene 4: Cross-filter by region, channel, category" |
| 05 | Shelf | `shelf` | "Scene 5: Product concentration" |
| 06 | Return | `return` | "Scene 6: Cohort retention" |
| 07 | Proof | `proof` | "Scene 7: How every number reconciles" |

**Nav behaviour.**
- The active scene shows a copper underline that slides between items (`dur.base`, `ease.till`).
- Keys 1 to 7 jump to scenes **only while focus is inside the Scene Nav**, to avoid character-key shortcuts (WCAG 2.1.4).
- The Till Bar (filters) docks bottom-centre on desktop and is persistent from Scene 1 to 5. It is hidden in 6 and 7, and its chips show `na` in 5 and 6 per the concept data contract.

---

## 00 · Opening, "Ignition" (4.2s, skippable)

**Shows.** On a midnight ground:

1. A 1px copper line draws left to right through the 23 real monthly net values, Nov 2024 to Sep 2026, with the Sep stub hatched.
2. The line thickens into the 4-layer ribbon: the gross hairline, the gap hatch, the copper body and the teal core.
3. Particles peel off the ribbon's top edge. One particle stands for $5,000 of net revenue (1,530 particles, Canvas 2D).
4. The particles drift down and settle into 8 small piles labelled with the real filter vocabulary: the 4 categories × 2 channels. Pile size is that slice's share of net.
5. The piles fade into the chip labels of the Till Bar.

**Wordmark.** "SIGNALROOM" is set in Big Shoulders 900 at the left of the ribbon, with the subtitle in Hanken Grotesk: "Retail analytics where every number reconciles."

**Immediate hook.** At 4.2s the lens drops onto Dec 2024 (the peak, $654,255) with a one-line prompt: "Drag the lens. Every month reprints the receipt." The bridge slip is already printed.

**Skip.** A "Skip intro" button is focusable first in tab order. Esc also skips. Skipping jumps to the hook end state. The choice is remembered in `localStorage` (try/catch) for repeat visits.

**Leaving.** Particles are gone. The ribbon stays where it is and becomes Scene 1. This is not a transition: the opening *ends in* Scene 1.

**Reduced motion.** See `responsive-spec.md` §4.

---

## 01 · Year (interactive hero, signature moment 1)

**Composition.**
- The ribbon is full-bleed and unrolled, spanning 92vw at 46vh tall in the vertical middle.
- The month axis sits below in Plex Mono 12px, with ticks for all 23 months.
- The Bridge Slip is a cream thermal-paper card, 320px wide, that hangs from the lens like a receipt tearing off the printer. It is always attached to the lens and flips side near the edges.
- The scene title "The year" sits top-left in Big Shoulders 800 at clamp(48px, 7vw, 112px), with one line of copy beneath.

**Data.**
- `monthly.json` is filtered by the Till Bar chips and summed by `year_month`.
- The slip prints these lines for the lens month:

| Line | Value |
|---|---|
| GROSS | gross_revenue |
| DISCOUNT | −discount_amount, with the promo code(s) active that month printed beside it from the generator's PROMO_WINDOWS |
| RETURNS & CANCELS EFFECT (DERIVED) | −(gross − discount − net); footnote: "Returned items count twice here: unrealized gross plus their negative posting." |
| NET | net_revenue |
| COGS | −cogs |
| MARGIN | margin, plus margin % |
| UNITS | units |

- The footnote prints `docs/metrics.md` sign rules in 10px mono: "Returned items post negative. Cancelled items post $0."

**Interaction.**
- Drag the lens, click any month, or use ←/→ (Shift moves 3 months; Home/End jump to the ends).
- Chips recompute everything.

**Teaches.** Gross is not revenue. In Dec 2024, $864,035 gross becomes $654,255 net, and the reconciliation is visible line by line.

**Typography / camera in.** None, because this is the opening's end state.

**Leaving → Season.**
- The slip folds up into the lens (`dur.fast`).
- The camera zooms out to a square framing (`viewBox` 0 0 1000 1000, `dur.scene`).
- The title shrinks and moves to the top-left eyebrow position.

---

## 02 · Season (major scroll transformation, signature moment 2)

**Pinned for 150svh. Scroll progress p runs from 0 to 1 and is scrubbed.**

**Transformation.** One fixed 23-point array, resampled to 240 path points, is interpolated from the unrolled path into an Archimedean coil centred in the viewport:

- 12 spokes, with Nov at 12 o'clock;
- inner turn = Year 1, outer turn = Year 2;
- ribbon thickness preserved, so it still encodes net.

At p = 0.5 the ribbon is halfway wound. At p = 1 Nov 2024 sits directly inside Nov 2025 on the same spoke. Month labels ride the ribbon, so they stay attached during the morph and keep continuity.

**Composition at rest (p = 1).**
- The coil fills 78vmin, centred.
- The Comp Readout sits as a horizontal strip *under* the coil, not a side rail. It shows the lens month's Year 1 vs Year 2 as two horizontal bars with exact values and Δ%.
- The lens now sits on a spoke. Drag it around the dial (circular drag) or press ←/→ to step spokes.

**Data.**
- Same filtered monthly series.
- Comps Nov to Aug: Nov −1.7%, Dec −0.5%, Jan −5.6%, Jul −13.2%, Aug −1.3%.
- The Sep spoke shows Year 1 plus a hatched partial stub labelled "Sep 1 to 3 only, no comp".
- The Oct spoke shows Year 1 only, labelled "No Year-2 Oct in data".
- A big numeral, Big Shoulders 900 at 15vw in copper at 20% opacity behind the coil, shows "28.4%": Nov and Dec as a share of Year-1 net (all-data). It recomputes under filters.

**Typography change.** The display title "Season" enters at p 0.85 to 1 with a mask reveal of the letters (`stagger.letter`).

**Teaches.** Retail is a calendar business. December is 3.1× February, and the year-over-year comp only makes sense month against same month.

**Leaving → Promo.** No geometry change. The camera pushes in 12% toward the coil, and the gold promo tags fade in.

---

## 03 · Promo

**Composition.**
- The coil stays at 90vmin, with the camera pushed in.
- Five gold tags hang on their spokes, as small sale tags with the real codes:
  - BLACKFRI24 and HOLIDAY24 on the Year-1 Nov and Dec spokes;
  - SUMMER25 on Year-1 Jul;
  - BLACKFRI25 and HOLIDAY25 on Year-2 Nov and Dec.
- The teal margin core is now emphasised. Its thickness ratio (margin / net) visibly thins on the promo months.
- A single annotation line hangs on the **Jul spoke**: "Jul 2025 ran SUMMER25. Jul 2026 ran nothing. Comp: −13.2%."

**Data.**
- Promo windows come from `PROMO_WINDOWS` in `data/generate_seed_data.py`, hard-coded as constants with a source comment. They are the only non-fixture constants on the site.
- A promo month is a month with discount_amount > 0 in the fixture, used as a cross-check.
- Margin %: promo months 61.08% vs non-promo 63.49% (all-data). It recomputes under filters.

**Interaction.** Tap or click a tag to send the lens to that spoke. The Comp Readout adds a third row, "Discount given", in gold.

**Teaches.** Discounts buy volume with margin. The −13.2% July comp is a promotion you didn't run, not a demand collapse.

**Leaving → Slice.**
- The coil unwinds back to a strip (the reverse of Scene 2, scroll-scrubbed over 60svh).
- Then it is camera-translated upward to become a 14vh context strip across the top of the viewport.
- The ribbon body splits into 4 category sub-strands (category hues, `stagger.strand`).

---

## 04 · Slice (cross-filter room)

**Composition.**
- The context ribbon runs across the top with the lens still on it.
- Below is the Slice Grid, an exact grid of 5 customer regions (columns) × 4 categories (rows) = 20 cells. Each cell is a horizontal two-segment bar: online (solid) and in-store (outline), with net and margin % in mono.
- Column and row totals sit on the right and bottom edges.
- There is no side rail. The grid is centred and spans the content width.

**Data.**
- `monthly.json` for the lens month, or for a month range if the visitor brushes the context ribbon (drag across months; keyboard: Shift+←/→ extends).

**Interaction (cross-filter).**
- Click a cell to toggle it into the filter. It becomes copper-outlined, and the context ribbon recomputes for that region × category.
- Click a row or column header to select the whole row or column.
- Chips in the Till Bar stay in sync with the grid selection: they are one filter state, not two.

**Reveal copy.** This copy is computed, not static:
- Region spread: "Customer regions differ by {max−min}/{mean}". For all-data, 14.5% between Southwest $1.41M and Southeast $1.63M, with margin 62.5 to 62.7%.
- Channel swing: "Online share swings {min} to {max} month to month." For all-data, 48.5% to 65.5%.

**Teaches.**
- Where the business does and doesn't vary. Regions are near-identical here, while channel mix and category margin (Home 61.2% vs Accessories 64.2%) are the real levers.
- A flat result is a finding.

**Leaving → Shelf.**
- The grid cells collapse to their category rows (`dur.base`).
- The context ribbon's 4 category strands each fan out into their 28 SKU strands, 112 in total.
- The strands swing down from the ribbon into a vertical-bar Pareto layout (scrubbed, pinned 120svh).

---

## 05 · Shelf (data-driven reveal, signature moment 3)

**Composition.**
- 112 bars ("strands") in category hues stand left to right in descending net revenue, like facings on a shelf, spanning the full content width.
- The cumulative-share curve is drawn over them in cream.
- A copper **guess handle** sits on the x-axis.
- The title "Shelf" sits top-left.
- Region and channel chips go to the `na` state with their reasons.

**Interaction ("Call the 80").**
1. Prompt: "How many of {N} products make 80% of revenue? Drag to guess." N is computed for the current filter (112 for all categories, 28 for one).
2. The visitor drags the handle (or uses ←/→ with Enter to commit; on touch, release commits).
3. On commit, the real answer marker drops in, the curve's crossing point is highlighted, and the text reads: "Real: {k} of {N} ({k/N}). Your guess: {n}." With no filter that is 70 of 112 (62.5%).
4. The bars beyond the answer dim to 35%.
5. Category chips and the month-range brush recompute the Pareto live from `sku_monthly.json`, and the answer marker moves. The guess stays where the visitor put it.

**Data.**
- `sku_monthly.json`, summed by product_id over the selected months and categories, then sorted descending and cumulated.
- `pareto.json` is the all-months check, enforced by a unit test that the two agree.
- Top 20 SKUs make 30.1%. The top SKU is P56 Sandals at $133,117 and the bottom is P61 Bags at $16,257 (8.2×).

**Teaches.**
- This catalogue is *not* 80/20. Revenue is spread across 70 products.
- The reason is that demand is uniform and differences are price-driven, which is a property of this synthetic dataset and is stated as such in a footnote.

**Leaving → Return.**
- The strands retract upward into the ribbon.
- The ribbon re-forms as a horizontal 23-month calendar axis at the top of the Cohort Grid. Its months become the grid's column headers in "align by calendar" mode, and the grid fades in beneath (`stagger.cell`).

---

## 06 · Return

**Composition.**
- The Cohort Grid has 8 cohort rows (Nov 2024 to Jun 2025) by months-since columns 0 to 22.
- Retention % = retained / cohort_size, on a single-hue copper sequential scale. Month 0 is excluded from the scale domain because it is always 100%.
- n is printed at the row start. Rows with n < 50 are hatched at 50% emphasis.
- The last diagonal (Sep 2026, partial) is hatched and labelled.

**Interaction.**
- **Toggle "Align by calendar month"** (switch, keyboard Space).
- Columns re-map from months-since to calendar month (`cohort_month + months_since`).
- Each cell tweens horizontally to its new column (`dur.slow`, `stagger.cell`, by row).
- The diagonal holiday echo becomes a vertical bright stripe at Nov and Dec 2025: 72 to 80% for the two large cohorts, vs a ~45 to 55% baseline.
- Hover or focus a cell to see "{cohort}, month {k} ({calendar month}): {retained} of {size} = {pct}".

**Data.** `cohort.json`. All chips are `na` ("Cohorts are whole-business only").

**Teaches.** The retention "bump" at months 11 to 13 is not loyalty improving. It is the holiday season pulling everyone back, and aligning by calendar proves it. Two cohorts make up 93% of customers (Nov 2024 n=1,666; Dec 2024 n=567).

**Leaving → Proof.** The grid fades out (`dur.base`). The ribbon re-coils one last time into a compact 2-turn mark (120px), which becomes the SIGNALROOM logo glyph.

---

## 07 · Proof

**Composition.** A cream "slip" panel spans 60ch, centred on midnight. This is the only scene with a light ground, as the final printed receipt. The coil mark sits above it. It contains:

1. The **reconciliation statement** from `docs/metrics.md` (the dbt test `reconciliation_fact_sales_matches_raw.sql`: every fact_sales row within $0.001 of an independent raw recomputation).
2. The **all-data totals** printed as a receipt: gross, discount, derived residual, net, COGS and margin, all matching the reference values in `concept.md`.
3. **Metric definitions**, one line each (net, discount, COGS, margin %, retention), linking to `docs/metrics.md` in the repo.
4. **Known limits**, printed honestly:
   - synthetic seeded data (seed 20260101);
   - Sep 2026 partial;
   - region = customer region;
   - AOV omitted and why;
   - returns and cancels inseparable in fixtures, and returns count twice in the derived residual;
   - the "nets to exactly zero" sentence from docs/metrics.md is NOT reprinted (see concept.md rule 4).
5. Links: repo, and CREDITS.

**Typography.** Plex Mono on cream, `--midnight` ink, with `--copper-ink` for totals.

**Teaches.** Why a BI engineer should trust the previous six scenes.
