# Concept A: TILL TAPE

## Metaphor
The site is one endless strip of cream thermal register tape, printed in mono. A receipt is the atomic artifact of retail: one order is one slip, and the fact table is just every slip ever printed. The tape runs horizontally across a midnight counter, and scrolling feeds it through a printer head fixed at the viewport centre.

## Signature interaction: "Void the line"
The tape prints a consolidated receipt for the whole business:

- **Header:** 23 months, 5 customer regions, 2 channels, 4 categories.
- **Line items:** one line per category.
- **Subtotal:** GROSS $9,970,376.42.
- **Discount block:** BLACKFRI24, HOLIDAY24, SUMMER25, BLACKFRI25 and HOLIDAY25, totalling −$227,893.03.
- **Reversal block:** returns and cancellations, a derived residual of −$2,092,055.
- **TOTAL NET:** $7,650,428.20.
- **Below the line:** COGS and margin of $4,791,337.89 (62.6%).

The visitor taps any line, such as a category, a region stamp or a channel stamp, to "void" it, as a cashier would. The printer head re-feeds and reprints every downstream line from `monthly.json` with that slice excluded.

## Retail connection
Very strong. Gross → discount → reversal → net is literally receipt arithmetic. The sign conventions in `docs/metrics.md` become a receipt rule a CFO already knows: a return prints as a negative line, and a cancel prints as VOID with $0.

## Scenes (6)
1. **Header:** the tape prints the store header and date range. Sep 2026 is printed as "THRU 09-03 (PARTIAL)".
2. **Line items:** category lines, each with a tiny inline 23-month sparkline printed in dot-matrix.
3. **Promotions:** the five real promo codes are printed with their windows and the dollars each one discounted. Margin % drops to 61.1% in promo months vs 63.5% otherwise.
4. **Reversals:** the derived residual, with its formula printed under it.
5. **Loyalty footer:** "MEMBER SINCE" stamps hold the cohort table, printed as a dot-matrix grid.
6. **Top sellers:** the Pareto, printed as a ranked list of 112 lines.

## Anti-reference check
- **Not TERRAIN:** there is no map and no pinned rail.
- **At risk of GAUNTLET:** a receipt is inherently a top-to-bottom list that every number flows down. Printing it sideways fights the object's nature, and on mobile it collapses back into a vertical column of sequential blocks, which is GAUNTLET's layout.

## Weaknesses
- **Time gets buried.** Time is the dimension that really varies: December is 3.1× February, and July 2026 has a −13.2% comp. On a receipt, time becomes a sparkline inside a line item.
- **The hero input moves little.** Voiding a region moves the total by about 20% but leaves every *ratio* flat, because regions sit between $1.41M and $1.63M with margin of 62.5% to 62.7%. The most likely first tap therefore teaches "nothing changed".
- **Some data is forced into the form.** The cohort and Pareto are crammed into receipt typography, which gives poor reading forms for both.

## Score (rubric defined in `selection.md`)
| Criterion | Score |
|---|---|
| 1 Retail specificity | 5 |
| 2 Honesty under the real fixtures | 5 |
| 3 Input moves real variance | 2 |
| 4 Narrative continuity, 5+ scenes | 3 |
| 5 Distinct from TERRAIN / GAUNTLET | 3 |
| 6 Responsive, touch, keyboard, reduced motion | 4 |
| 7 Buildability on the free stack | 5 |
| **Total** | **27 / 35** |
