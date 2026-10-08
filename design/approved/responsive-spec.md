# Responsive spec: COIL

Breakpoints: **desktop ≥ 1200px**, **tablet 768 to 1199px**, **phone < 768px** (designed at 390px). Input-type queries (`hover`, `pointer`) drive interaction differences; width queries drive composition. These are three deliberate compositions, not reflows.

## 1. The core decision per device

| | Desktop | Tablet | Phone |
|---|---|---|---|
| Primary reading form of the ribbon | Unrolled, horizontal (wide screens suit time) | Unrolled in landscape, **coil in portrait** | **Coil-first** (a square fits a phone); unrolled only as a 23-tick mini-strip |
| Lens input | Drag along ribbon, click month, ←/→ | Touch drag along ribbon or around coil; tap month | **Rotate the coil with a thumb** (circular drag anywhere in the dial) or tap a mini-strip tick |
| Bridge Slip | Hangs from the lens beside the ribbon | Hangs below the lens | **Bottom sheet** (peek height 34svh shows NET + MARGIN; swipe up for all 7 lines) |
| Till Bar (filters) | Docked bottom-centre, all chips visible | Docked bottom, chips horizontally scrollable | Collapsed into one "Filters (n)" button opening a full-height sheet with grouped chips |
| Scene Nav | Top bar, labels | Top bar, numbers + labels | Bottom dock of 7 numbered dots, label of active scene above it |

## 2. Scene-by-scene choreography differences

**00 Opening**
- **Desktop:** as specced, with the line drawing left to right across 92vw.
- **Tablet:** same sequence.
- **Phone:**
  - The line draws in a 92vw × 30svh band.
  - Particles are reduced to $20k each (383 particles), keeping the caption honest.
  - There are 4 category piles, not 8 (channel merges), so the piles stay tappable-size.
  - Total time is 3200ms: each step from 1600ms onward is shortened by 25%.
  - At the end, the ribbon *winds into the coil* (500ms), because the phone's Scene 1 is coil-first.

**01 Year**
- **Desktop / tablet:** unrolled hero.
- **Phone:** the coil is the hero.
  - The lens is a copper notch on the dial rim.
  - The mini-strip under the dial shows the 23 months linearly, with the current month highlighted.
  - The slip is the bottom sheet.

**02 Season**
- **Desktop / tablet:** the scrubbed unroll-to-coil transform (pinned 150svh).
- **Phone:** the ribbon is already coiled, so the scrubbed transform is replaced by a **year-separation scrub** (pinned 100svh):
  - The two turns pull apart radially so Year 1 and Year 2 become distinguishable rings.
  - The comp readout's paired bars grow in.
  - The geometry still changes and still teaches the comp, without a redundant unroll-then-recoil.

**03 Promo**
- **Phone:** tags become numbered gold dots on the rim (labels collide at 390px). Tapping a dot opens the tag text in the bottom sheet.

**04 Slice**
- **Desktop:** the 5 × 4 grid.
- **Tablet:** the grid is transposed to 4 categories (columns) × 5 regions (rows).
- **Phone:** the grid becomes a **single segmented control for the dimension**, with one 5-bar or 4-bar list beneath it:
  - "Compare by: Region | Category | Channel".
  - Tap a bar to filter by it. The context mini-strip at top recomputes.
  - 20 cells at 390px would be 70px wide, below a comfortable 44px tap target once labelled, which is why the grid is replaced.

**05 Shelf**
- **Desktop / tablet:** 112 vertical strands.
- **Phone:** the Pareto rotates 90°. 112 *horizontal* bars make a scrollable list, top seller first, with the cumulative curve running down the right edge.
  - The guess handle becomes a horizontal line dragged vertically.
  - A ±1 stepper is provided as an alternative to dragging.
  - The commit button is "Lock guess".
  - The answer line drops to row 70.

**06 Return**
- **Desktop:** the full 8 × 23 grid.
- **Tablet:** the full grid with horizontal scroll and a sticky cohort column.
- **Phone:** the grid is replaced by **one cohort at a time as a 23-point line**, with a cohort picker (default Nov 2024, n=1,666). The "Align by calendar" toggle switches the x-axis from months-since to calendar months, and the Nov/Dec 2025 band is shaded. Small cohorts in the picker are labelled with n and a "small sample" tag.

**07 Proof**
- Single column on all devices.
- **Phone:** the receipt totals table keeps tabular figures at 13px and never wraps a number.

## 3. Touch adaptations (any `pointer: coarse`)
- All tap targets are ≥ 44 × 44px. Ribbon month hit areas are full-height columns, not the ribbon's thin edge.
- **Gesture conflicts.**
  - Lens drag uses `touch-action: pan-y` on the unrolled ribbon, so horizontal drags move the lens and vertical drags scroll the page.
  - The coil's circular drag area uses `touch-action: none` *only* inside the dial, with a visible rim affordance. Elsewhere the page scrolls.
- **No hover-only information.** Tapping a mark selects it and shows its tooltip content in the slip or readout. A second tap on the same mark does nothing (no toggle-off surprise).
- **Scrub sensitivity.** Pinned scrub lengths are shortened on phones (150 → 100svh, 120 → 90svh), so a thumb flick does not overshoot a whole scene.

## 4. Reduced motion (`prefers-reduced-motion: reduce`)

**Opening alternative.** The opening is not played. The first paint is the **settled Scene 1 hook frame**:
- the wordmark;
- the full layered ribbon (or coil on phones);
- the lens on Dec 2024 with the slip printed;
- the prompt line.

There is one 200ms opacity fade-in of the whole frame, which is not considered vestibular motion. No line draw and no particles. The particle idea is conveyed by one static caption: "1,530 × $5,000 = $7.65M net revenue, 23 months." The Skip button is not rendered (nothing to skip).

**Elsewhere.**
- **Scrubbed transforms** (1→2, 3→4, 4→5) become **state swaps.** Each scene shows its settled end-state geometry. Crossing the 55% trigger line crossfades between states in 200ms opacity only, with no geometry interpolation.
- **Lens moves, cohort align, Pareto reveal and filter updates** apply instantly. Values and geometry swap in one frame, with a 2px copper flash outline on the changed region for 400ms so the change is still noticeable.
- **Camera (viewBox) moves** are instant.
- **Nav jumps** use `scrollIntoView({behavior: 'auto'})`.
- **Unchanged.** Focus rings, the `aria-live` readouts and all data content remain identical. Reduced motion removes movement, never information.

## 5. Keyboard map (all devices with a keyboard)

| Key | Action |
|---|---|
| Tab | Skip intro → Scene Nav → Till Bar chips → current scene's focusable marks → readout |
| 1 to 7 | Jump to scene (only while focus is in the Scene Nav, per WCAG 2.1.4) |
| ← / → | Move lens one month (one spoke on coil); Shift = 3 |
| Home / End | First / last month |
| Shift + ← / → | Extend month range brush (Scene 4/5) |
| Arrows (in grid) | Roving focus across Slice / Cohort cells |
| Enter / Space | Select cell, toggle chip, commit Pareto guess, toggle calendar align |
| Esc | Skip intro; close bottom sheet; clear current selection |

Every visual readout has a text equivalent in an `aria-live="polite"` region, for example "December 2024, all filters: net revenue $654,255, margin 61.3%."
