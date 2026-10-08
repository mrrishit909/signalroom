// Every timing/easing/stagger value on the site comes from here, named
// exactly as design/approved/motion-spec.md specifies. No component may
// contain a raw ms value or a bezier curve, import from this file instead.

export const ease = {
  /** Default for any state change: chips, nav underline, bars resizing. */
  till: [0.2, 0, 0, 1] as const,
  /** Paper/ribbon motion that should feel mechanical: slip print, unroll, coil. */
  feed: [0.65, 0, 0.35, 1] as const,
  /** Things arriving and coming to rest: particles landing, answer marker, lens snap. */
  settle: [0.16, 1, 0.3, 1] as const,
  /** Elements leaving: slip fold, grid fade-out. */
  exit: [0.4, 0, 1, 1] as const,
  /** Only for scroll-scrubbed progress (Scenes 2, 3→4, 4→5). Scroll position is the easing. */
  scrub: "linear" as const,
};

export const dur = {
  /** Text value swap crossfade, pressed state. */
  instant: 80,
  /** Hover, focus ring in, chip toggle, slip fold. */
  fast: 160,
  /** Data-driven geometry update after any filter or lens change. */
  base: 280,
  /** Lens snap to a jumped-to month, cohort align toggle, answer reveal. */
  slow: 480,
  /** Camera (viewBox) moves between scenes on nav jump; non-scrubbed scene enter. */
  scene: 720,
  /** Total opening sequence (see motion-spec.md section 6). */
  intro: 4200,
};

export const stagger = {
  month: { interval: 18, cap: 400 },
  strand: { interval: 4, cap: 450 },
  cell: { interval: 10, cap: 80 },
  letter: { interval: 22, cap: 260 },
  chip: { interval: 30, cap: 240 },
};

/** Staggers are capped: if count * interval > cap, interval becomes cap / count. */
export function staggerInterval(token: { interval: number; cap: number }, count: number): number {
  if (count <= 0) return 0;
  return count * token.interval > token.cap ? token.cap / count : token.interval;
}

/** No interaction-triggered animation may exceed dur.slow. The opening is the only exception. */
export const DUR_CEILING_MS = dur.slow;
