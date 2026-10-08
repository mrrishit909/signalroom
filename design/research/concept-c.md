# Concept C: COIL

## Metaphor
The business is one copper ribbon of 23 months of net revenue, the "retail year" as a physical strip. It can be read **unrolled**, as a horizontal timeline, or **coiled**, as a 12-spoke calendar dial with two turns:

- the inner turn is Year 1, Nov 2024 to Oct 2025;
- the outer turn is Year 2, Nov 2025 to Sep 2026.

When coiled, the same month of each year sits on the same spoke. That turns the most important number in retail, the **comp** (same period, year over year), into a spatial fact: Nov sits next to Nov, and Jul next to Jul.

The ribbon's cross-section *is* the reconciliation:

- the outer edge is gross;
- the copper body is net;
- the teal core is margin;
- the hairline gap between gross and net is the discount plus the returns and cancellations residual.

The ribbon persists through every scene and re-forms into each view. It becomes the comp coil, then the cross-filtered strip, then 112 SKU strands, then the cohort grid's calendar axis.

## Signature interaction: "Turn the lens"
A copper lens sits on the ribbon at one month. The visitor drags it along the unrolled ribbon, rotates it around the coil, or uses the arrow keys. Filter chips for customer region, channel and category sit in one docked "till bar". Every move recomputes from `monthly.json`, in well under 4 ms for 920 rows:

- the ribbon's thickness for all 23 months;
- the bridge slip for the lens month (gross → discount → returns/cancellations residual → net → COGS → margin);
- the comp against the same month in the other year.

## Retail connection
Retail runs on the calendar. The real variance in this dataset is calendar-shaped:

- **Seasonality:** December 2024 is 3.1× February 2025, and Nov–Dec hold 28.4% of Year-1 net.
- **Promo windows:** margin is 61.1% in promo months vs 63.5% in non-promo months.
- **Comps:** July 2026 comps at **−13.2%** because SUMMER25 ran in July 2025 and no promo ran in July 2026.
- **Holiday echo in retention:** 70–87% of each cohort returns at the following Nov/Dec.

The comp coil is the CFO's year-over-year flash report made physical. It is not generic: a "data dashboard" has no reason to coil on a 12-month period, while retail does.

## Scenes (7 + opening)
- **0 Opening.** A copper line draws the real 23-month net series. It thickens into the layered ribbon, and $5k "unit-of-revenue" particles peel off and settle into the chip vocabulary.
- **1 Year.** Unrolled ribbon. The hero lens prints the bridge slip.
- **2 Season.** A scroll-scrubbed coil: the ribbon winds into the dial and Nov/Dec stack. Comps for Nov and Dec are −1.7% and −0.5%.
- **3 Promo.** The five promo windows appear as gold tags on their spokes. The July spoke shows the −13.2% "promo you didn't run", and the margin core visibly thins in promo months.
- **4 Slice.** The coil unrolls into a strip above a region × category grid, with each cell split by channel. This is the cross-filter room. It reveals that regions are flat while channel mix swings from 48.5% to 65.5% online.
- **5 Shelf.** The ribbon unspools into 112 SKU strands sorted by revenue. The visitor places an "80%" guess, and the real answer is **70 of 112** SKUs. The catalogue is *not* 80/20.
- **6 Return.** The cohort grid uses the ribbon as its calendar axis. An "align by calendar" toggle turns the diagonal holiday echo into a vertical Nov/Dec stripe.
- **7 Proof.** The ribbon re-coils into the SIGNALROOM mark. The reconciliation gate, formulas and fixture totals are shown here.

## Anti-reference check
- **Not TERRAIN.** There is no sticky side rail. The hero object is full-bleed and *changes form* (line → coil → strip → strands → axis), rather than being one fixed 2D field that a point is dragged across. The lens moves along a 1D time path, never through a 2D plane.
- **Not GAUNTLET.** Nothing flows down a vertical sequence of stages. Motion is horizontal (unroll) and rotational (coil). The bridge slip is a *horizontal* segmented bar, not a stacked waterfall of gates.

## Weaknesses (designed around in `approved/`)
- **Radial charts are weak for precise reading** (FT Visual Vocabulary). The coil is only an *alignment* device. Every spoke has exact paired bars and numbers in the comp readout, and the unrolled ribbon remains the reading view.
- **Partial month.** Sep 2026 has 3 days ($33.6k) and would look like a crash. It is drawn as a frayed, hatched ribbon end labelled "Sep 1–3, partial", and is excluded from comps.
- **Filter grain differs by fixture.** Cohort has no dimensions, and Pareto/SKU data has only category and month. Chips enter a "not applicable here" state with the reason (see `approved/concept.md`).
- **Regions are flat.** This is made into a *finding* in Scene 4, not hidden.

## Score (rubric defined in `selection.md`)
| Criterion | Score |
|---|---|
| 1 Retail specificity | 4 |
| 2 Honesty under the real fixtures | 5 |
| 3 Input moves real variance | 5 |
| 4 Narrative continuity, 5+ scenes | 5 |
| 5 Distinct from TERRAIN / GAUNTLET | 5 |
| 6 Responsive, touch, keyboard, reduced motion | 4 |
| 7 Buildability on the free stack | 4 |
| **Total** | **32 / 35** |
