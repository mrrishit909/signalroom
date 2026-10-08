# Motion spec: COIL

**Implement these tokens literally.**
- Durations, easings and staggers come only from `site/src/motion/tokens.ts`. No component may contain a raw ms value or a bezier.
- Library: `motion` (MIT). Use `animate()` for tweens and `scroll()` for the scrubbed scenes.
- Geometry tweens interpolate equal-length point arrays with `d3.interpolate`.

## 1. Easing tokens

| Token | cubic-bezier | Motion equivalent | Use |
|---|---|---|---|
| `ease.till` | (0.2, 0, 0, 1) | `[0.2,0,0,1]` | Default for any state change: chips, nav underline, bars resizing |
| `ease.feed` | (0.65, 0, 0.35, 1) | `[0.65,0,0.35,1]` | Paper and ribbon motion that should feel mechanical: slip print, unroll, coil |
| `ease.settle` | (0.16, 1, 0.3, 1) | `[0.16,1,0.3,1]` | Things arriving and coming to rest: particles landing, answer marker drop, lens snap |
| `ease.exit` | (0.4, 0, 1, 1) | `[0.4,0,1,1]` | Elements leaving: slip fold, grid fade-out |
| `ease.scrub` | linear | `"linear"` | **Only** for scroll-scrubbed progress (Scenes 2, 3→4, 4→5). Scroll position is the easing. |

No springs and no bounce. Overshoot implies a value the data never had.

## 2. Duration tokens (ms)

| Token | ms | Use |
|---|---|---|
| `dur.instant` | 80 | Text value swap crossfade, pressed state |
| `dur.fast` | 160 | Hover, focus ring in, chip toggle, slip fold |
| `dur.base` | 280 | Data-driven geometry update (ribbon thickness, bars, cells) after any filter or lens change |
| `dur.slow` | 480 | Lens snap to a jumped-to month, cohort align toggle, answer reveal |
| `dur.scene` | 720 | Camera (viewBox) moves between scenes on nav jump; non-scrubbed scene enter |
| `dur.intro` | 4200 | Total opening sequence (see §6) |

**Ceiling rule.** No interaction-triggered animation may exceed `dur.slow` (480ms). The opening is the only exception, and it is skippable.

## 3. Stagger tokens (ms)

| Token | Interval | Cap (total) | Use |
|---|---|---|---|
| `stagger.month` | 18 | 400 | 23 ribbon months / axis labels / slice cells entering in time order |
| `stagger.strand` | 4 | 450 | 112 SKU strands fanning out (rank order, top seller first) |
| `stagger.cell` | 10 per row, 0 within a row | 80 | Cohort grid rows on align toggle (whole rows move together) |
| `stagger.letter` | 22 | 260 | Scene-title mask reveal |
| `stagger.chip` | 30 | 240 | Till Bar chips appearing |

**Staggers are capped.** If count × interval > cap, use interval = cap / count. Data updates triggered by filters are **never staggered**: all marks move together, so the eye sees one state change, not a wave that reads as a trend.

## 4. Rules by state

### Hover (pointer: fine only)
- **Ribbon month.** 1px `--cream` outline on that month's slab, and the month label goes to 100% opacity (`dur.fast`, `ease.till`).
- **Tooltip.** Appears after a 120ms hover delay with no fade-in delay beyond `dur.instant`, and disappears immediately on leave. It never covers the lens or the slip; it is positioned on the opposite side of the cursor.
- **Cells and bars.** Lift by contrast (+8% lightness), never by scale. Scaling a bar changes its encoded value.
- Never animate hover on touch devices. `@media (hover: hover)` gates every hover style.

### Focus (keyboard)
- **Ring.** 2px `--teal-hi` with a 2px offset, shown on `:focus-visible` (`dur.fast` in, instant out). It is always visible and never suppressed by reduced motion.
- **Focusable marks.** The lens, each slice cell, each cohort cell (grid with roving tabindex: arrows move, Enter selects) and the guess handle.
- **Focus mirrors hover.** Focusing a mark shows the same tooltip content as hover, rendered as an `aria-live="polite"` readout region beneath the visualization (not a floating tooltip).

### Selection
- **Lens / selected month.** 2px `--copper` outline plus the copper lens cap. On change, the lens slides along the ribbon path (or around the coil arc, never cutting across it) in `dur.base`, `ease.settle`. On a nav-triggered jump it uses `dur.slow`.
- **Selected chips.** Filled `--copper` with `--midnight` text. Deselected chips have a 1px `--muted` outline with `--cream` text. A toggle swaps the fill in `dur.fast`.
- **Slice cells.** Selected cells get a copper outline. Unselected cells dim to 45% only while a selection exists.
- **Value changes.** On any filter, lens or brush change:
  1. Geometry tweens over `dur.base` with `ease.till`, from the old computed state to the new one.
  2. Text values swap at tween start (80ms crossfade). **Numbers never count up or down**, because intermediate values are fabricated.
  3. If a new change arrives mid-tween, retarget from the current geometry. Never queue.

### Not applicable (`na`)
- The chip is a dashed 1px `--muted` outline, its label is at 55% opacity, and `aria-disabled="true"`.
- The reason appears as the tooltip and `aria-description`.
- The transition into `na` takes `dur.fast`.
- The selection is preserved, not cleared, and is re-applied on returning to a scene where the chip applies.

### Loading
- **Fixtures.** Load `monthly.json` and `filters.json` first, because Scenes 0 to 4 need only these. Lazy-load the rest when Scene 4 enters the viewport (IntersectionObserver, rootMargin 100%).
- **Skeleton.**
  - The ribbon's 23 month positions are known before data, so draw the month axis and a 1px dashed `--muted` baseline at the real x-positions.
  - Do not draw placeholder ribbon shapes: no fake waveform.
  - Static text "Loading 920 rows…" sits in Plex Mono.
- **Intro gating.** The intro does not start until `monthly.json` has parsed. If it takes more than 1200ms, show the skeleton with a 1px copper progress hairline (real bytes / Content-Length when available, otherwise indeterminate: a 30%-width segment translating at `dur.intro` per cycle, linear).
- **Errors.** A fetch error shows the slip with "Couldn't load data/monthly.json" and a Retry button. Never fall back to fabricated data.
- **Scenes 5 and 6.** If their fixtures are not yet loaded on arrival, show the same skeleton rule (real axis, no fake bars).

### Scene transitions
- **Scrubbed.** These are the only scroll-scrubbed transforms:
  - 1→2: unroll to coil, pinned 150svh;
  - 3→4: coil to strip, 60svh;
  - 4→5: strands fan, pinned 120svh.
  Progress maps linearly (`ease.scrub`) to the geometry interpolation; easing happens because the geometry keyframes are themselves smooth.
- **Triggered.** Every other scene enter or exit fires once when the scene's top crosses 55% of the viewport height, using `dur.scene` and `ease.feed`. Reverse scrolling plays the reverse.
- **Continuity rule.** The ribbon element is one persistent SVG `<path>` group for the whole page (one `position: fixed` stage beneath the scroll sections). Scenes change its geometry and camera; they never unmount and remount it. Month labels and the lens are bound to path parameters, so they travel with the ribbon through every morph.
- **Nav jump.** Smooth-scroll to the target scene (native `scrollIntoView({behavior})`; `auto` under reduced motion). Intermediate scrubbed scenes **are skipped, not played**: the stage tweens directly from the current settled form to the target scene's settled form in `dur.scene`.
- **No decorative motion during reading.** Once a scene settles there is:
  - no idle drift;
  - no shimmer on the copper ("metallic" is a static two-stop gradient along the ribbon normal, not an animated sheen);
  - no parallax on data.

## 5. Information-safety rules
1. Nothing animates *over* a number the reader is looking at. The slip and readouts never move while values change; only the values swap.
2. A morphing chart has no readable axis mid-morph. Axes fade out at p ≤ 0.15 and back in at p ≥ 0.85, so a half-coiled ribbon is never read against a wrong axis.
3. Particles exist only in the opening. Each particle stands for $5,000 net (stated in the opening caption) and never for orders.
4. Every animated change is triggered by visitor input, scroll, or the one-time opening.

## 6. Opening timeline (dur.intro = 4200ms)

| t (ms) | Event | Duration | Easing |
|---|---|---|---|
| 0 | Wordmark letters mask-reveal | 260 + `stagger.letter` | `ease.till` |
| 200 | Copper 1px line draws L→R through 23 real points (stroke-dashoffset) | 1400 | `ease.feed` |
| 1600 | Line thickens into a 4-layer ribbon (layers grow outward from the line in order net body → core → gap → gross hairline, 80ms apart) | 600 | `ease.settle` |
| 2200 | 1,530 particles ($5k each) peel from the ribbon top, falling toward 8 category × channel piles | 1200 (each particle 700, random start offset within 500) | `ease.settle` |
| 3400 | Piles crossfade into Till Bar chips (`stagger.chip`) | 400 | `ease.till` |
| 3800 | Lens drops onto Dec 2024; slip prints (lines reveal top to bottom, 30ms apart) | 400 | `ease.settle` |
| 4200 | Prompt "Drag the lens…" visible; input enabled | n/a | n/a |

Input is accepted from t=0. Any pointer-down, key or wheel skips to the 4200 state (`dur.fast` crossfade), as does the Skip button.
