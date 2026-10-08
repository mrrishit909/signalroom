# Signature moments: COIL

Each moment is computed from fixtures at runtime. None of them is a canned animation.

| # | Name | Type (required) | Scene | Driven by | What it teaches (one sentence) |
|---|---|---|---|---|---|
| 1 | **Print the slip** | Interactive hero | 01 Year (lands at end of the 00 opening) | `monthly.json`, filtered by chips, lens month | Gross is not revenue: dragging the lens reprints the real reconciliation, gross → discount → returns & cancels effect (derived) → net → COGS → margin, so in Dec 2024 the visitor watches $864,035 gross become $654,255 net. |
| 2 | **The Coil** | Major scroll-driven transformation | 01 → 02 Season (pinned 150svh), held through 03 Promo | same filtered monthly series, resampled to one path | Retail is judged month against the same month a year earlier: winding the ribbon onto a 12-spoke dial stacks Nov on Nov and exposes that Jul 2026 is −13.2% only because SUMMER25 ran the year before. |
| 3 | **Call the 80** | Data-driven reveal responding to visitor input | 05 Shelf | `sku_monthly.json` summed by product over the selected months and categories | The visitor's guess is checked against the real cumulative curve: 80% of net takes 70 of 112 products, so this catalogue is *not* 80/20, and changing category or months moves the real answer live while their guess stays put. |
| 4 (supporting) | **Align the calendar** | Data-driven reveal (toggle) | 06 Return | `cohort.json` | Re-mapping cohort columns from months-since to calendar months turns the "retention bump" at months 11 to 13 into one vertical Nov/Dec stripe, proving the bump is the holiday season, not loyalty improving. |
| 5 (supporting) | **Flat is a finding** | Cross-filter reveal | 04 Slice | `monthly.json` region × category × channel | Toggling cells shows that customer regions sit within 14.5% of each other at an identical ~62.6% margin, while online share swings 48.5% to 65.5% month to month, so channel and season are the levers, not geography. |

## Acceptance checks the build must pass

1. **Print the slip.** With all chips on "All" and the lens on 2024-12, the slip shows these values exactly:
   - GROSS 864,035;
   - DISCOUNT −44,523 (HOLIDAY24 printed);
   - RETURNS & CANCELS EFFECT (DERIVED) −165,257, with the "count twice" footnote;
   - NET 654,255.

   The residual is computed as gross − discount − net, and the test asserts the arithmetic, not a literal.
2. **The Coil.** At p = 1, the Nov 2024 and Nov 2025 path points lie on the same spoke angle (±0.5°). The Jul comp readout shows −13.2%. The Sep spoke shows no comp.
3. **Call the 80.** With no filters, the answer is 70. It equals the value computed from `pareto.json` (Vitest; parity of totals, top and bottom SKU verified 2026-10-08).
4. **Align the calendar.** With the toggle on, the 2024-11 cohort's month 12 and month 13 cells sit in the 2025-11 and 2025-12 columns.
5. **Flat is a finding.** With no filters, the region spread copy reads 14.5% and the online share range reads 48.5% to 65.5%.
