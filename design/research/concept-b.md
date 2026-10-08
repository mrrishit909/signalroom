# Concept B: FLOOR PLAN

## Metaphor
The site is the architectural plan of a department store, drawn in cream linework on midnight blueprint paper. The four departments (Apparel, Footwear, Accessories, Home) are zones whose floor area equals their net revenue, laid out as a squarified treemap styled as a plan. Inside each zone, the 28 products are fixtures sized by their `pareto.json` revenue. The plan has two entrances, a street door (in_store) and a loading dock (online), and each draws a flow ribbon whose width is that channel's revenue.

## Signature interaction: "Walk the floor"
The visitor drags a shopper marker through the plan. Entering a department zooms the camera into that zone and floods its fixtures with their monthly sparkline from `sku_monthly.json`. Toggling a door closed removes that channel, and the floor areas re-flow.

## Retail connection
Strong on the surface: merchandising and floor space per department ("sales per square foot") is a native retail idea.

## Scenes (6)
1. **Blueprint:** the plan draws itself, with department areas equal to net revenue. Apparel is $2.22M and Home is $1.61M.
2. **The doors:** the channel flows split 62.5% online and 37.5% in-store overall. The monthly online share ranges from 48.5% to 65.5%.
3. **Departments:** zoom into each zone. Margin runs from Home at 61.2% to Accessories at 64.2%.
4. **Fixtures:** the Pareto, where fixtures re-sort by revenue into one long wall.
5. **Regions:** five copies of the plan, one per customer region.
6. **Members:** cohort retention as a "returning shoppers" heat overlay on the entrances.

## Anti-reference check
- **Close to TERRAIN.** An overhead 2D plane that the visitor drags a marker across, with camera zoom, is very close to TERRAIN's drag-a-point-across-a-2D-map interaction. The metaphor differs but the gesture is the same.
- **Not GAUNTLET.**

## Weaknesses
- **It implies data we don't have.** The fixtures have **no store-level grain**, and `region_name` is the *customer's* home region (online orders carry one too). A store plan, and especially "five regional stores", invites the reader to see per-store performance that the data cannot support.
- **Time has no home in a floor plan.** Seasonality and promo comps are the real variance, and a plan has nowhere to put them.
- **Flat regions.** Five near-identical regional plans make a dull scene.
- **The cohort overlay on doors is decorative.** Cohort data has no channel dimension, so the overlay would *imply* a channel split it doesn't have. That is an honesty fail.
- **Mobile.** A dense treemap plan at 390px makes the fixtures untappable.

## Score (rubric defined in `selection.md`)
| Criterion | Score |
|---|---|
| 1 Retail specificity | 5 |
| 2 Honesty under the real fixtures | 2 |
| 3 Input moves real variance | 3 |
| 4 Narrative continuity, 5+ scenes | 3 |
| 5 Distinct from TERRAIN / GAUNTLET | 3 |
| 6 Responsive, touch, keyboard, reduced motion | 3 |
| 7 Buildability on the free stack | 4 |
| **Total** | **23 / 35** |
