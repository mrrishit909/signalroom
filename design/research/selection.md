# Concept selection

## Rubric (7 criteria, 1–5 each, unweighted, out of 35)

1. **Retail specificity.** Could the concept *only* be about retail analytics? A generic "data dashboard" scores 1.
2. **Honesty under the real fixtures.** Every mark maps to a `docs/metrics.md` definition and to a fixture grain that exists. The concept must survive these known traps:
   - `completed_orders` is non-additive across category (rows sum to 62,008 vs ~41k real completed orders);
   - no store grain exists;
   - region means the customer's region;
   - Sep 2026 is a 3-day partial month;
   - cohorts of n=5, 8 and 13 are noise;
   - returns and cancellations are not separable.
3. **Input moves real variance.** The visitor's first natural input must change something that actually varies in this data: season, promo, channel mix, category margin, or SKU rank. Regions are flat ($1.41M to $1.63M, margin 62.5% to 62.7%), so a region-led hero would look broken.
4. **Narrative continuity across 5+ scenes.** One persistent object that transforms, so the reader never loses their place (NYT "255 charts", Bloomberg warming).
5. **Distinct from TERRAIN and GAUNTLET.** It is not a sticky rail beside a 2D field a point is dragged across, and it is not content flowing down a vertical sequence of stages.
6. **Responsive, touch, keyboard and reduced motion.** There must be a *deliberately different* phone composition, not a shrunken desktop one.
7. **Buildability on the free stack.** React, D3 and Motion (MIT), with no WebGL needed, on a mid-range phone.

| Criterion | A · TILL TAPE | B · FLOOR PLAN | C · COIL |
|---|---|---|---|
| 1 Retail specificity | **5**: a receipt is retail's atomic artifact | **5**: department floor space | 4: retail calendar and comps are native, but a ribbon is not retail-only |
| 2 Honesty | **5**: the bridge is natural | 2: implies store and regional-store grain that doesn't exist; the cohort-on-doors overlay invents a channel split | **5**: time is `monthly.json`'s native grain; the partial month is marked; the residual is labelled |
| 3 Input moves real variance | 2: the first tap (void a region) changes no ratio | 3: doors move a bit; time is absent | **5**: the lens moves through the 3.1× season, the promo margin dip and the −13.2% July comp |
| 4 Continuity, 5+ scenes | 3: cohort and Pareto forced into receipt type | 3: plan → five plans → overlay are cuts, not transforms | **5**: one ribbon becomes line → coil → strip → strands → axis → mark |
| 5 Distinct from TERRAIN / GAUNTLET | 3: a receipt is a top-down list, and on mobile it becomes GAUNTLET | 3: overhead 2D plane with drag and zoom is TERRAIN's gesture | **5**: horizontal and rotational, with 1D lens travel |
| 6 Responsive / a11y / RM | 4 | 3: treemap fixtures untappable at 390px | 4: the coil is square, so it suits phones; the cohort grid needs a mobile re-form |
| 7 Buildability | **5** | 4 | 4: needs path morphing between line, spiral and strands |
| **Total (/35)** | **27** | **23** | **32** |

## Winner: C · COIL (32/35)

**It wins on criterion 3, the one that decides whether the hero feels alive.** All three concepts render the same `monthly.json`. Only COIL makes the *time* axis the thing the visitor touches, and time is where this dataset actually varies:

- December is 3.1× February;
- promo months lose 2.4 margin points;
- the online share swings from 48.5% to 65.5% month to month;
- July 2026 comps at −13.2% because no promo ran.

In A, the natural first tap is "void a region", which teaches that nothing changes. B has no place for time at all.

**It also wins on honesty (tied with A) and beats B by 3.** B's store plan is visually seductive, but it asserts a store-level grain the fixtures do not contain. That is a hard failure for a site whose whole pitch is "every number reconciles".

**And it wins on continuity and distinctness (+2 over A and B on each).**

- **Continuity.** One copper ribbon carries the reader through all 7 scenes. The coil is not decoration: it is the one geometry that puts the comp, retail's core year-over-year metric, side by side.
- **Distinctness.** The hero moves horizontally and then rotationally. It is neither TERRAIN's 2D drag field nor GAUNTLET's vertical gates.

**Where C loses points, and the fixes:**

- **Retail specificity (4, not 5).** We graft A's best idea onto it: the bridge readout is a cream thermal-paper "slip" in mono receipt typography, with returns shown as negative lines. That makes the reconciliation read as a till receipt.
- **Radial readability.** The coil is never the only encoding. Exact paired values sit in the comp readout, and the unrolled ribbon stays the precise reading view.
- **Path morphing cost.** All ribbon forms are generated from the same 23-point array with a fixed sample count, so the tweens are plain point interpolation (`d3.interpolate` over equal-length arrays). No morphing plugin is needed.

## Ideas folded in from the losers
- **From A:** the receipt-typography bridge slip, the "VOID" treatment for cancellations, the receipt-printed formula footnotes, and the promo codes printed verbatim (BLACKFRI24 and so on).
- **From B:** department (category) colours as the four sub-strands of the ribbon in the Slice and Shelf scenes, and the phrase "sales per category" as copy. The floor plan itself is rejected because no store grain exists.
