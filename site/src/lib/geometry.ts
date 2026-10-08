// The Ribbon's geometry engine. One persistent shape, described the same way
// in every form so any two forms can be morphed with d3.interpolate over
// equal-length point arrays (motion-spec.md section 4, "Continuity rule").
//
// A "frame" is 240 samples along the 23-month timeline. Each sample has a
// centerline point and a unit normal; thickness per layer (gross/net/margin)
// is linearly interpolated between the real month values at that sample's
// chronological position. This keeps every number that appears in text
// exact (it always comes straight from oracle.ts), while the ribbon's SVG
// curve itself is a smooth read between month centers rather than 23 literal
// rectangular steps -- a deliberate simplification of the drawing only, not
// of any displayed number.
import { interpolate } from "d3-interpolate";
import type { MonthPoint } from "./oracle";

export const SAMPLES_PER_RIBBON = 240;

export interface Point {
  x: number;
  y: number;
}

export interface LayerFrame {
  /** Outer boundary (e.g. +gross/2 offset from centerline). */
  outer: Point[];
  /** Inner boundary (e.g. -gross/2 offset from centerline). */
  inner: Point[];
}

export interface RibbonFrame {
  centerline: Point[];
  /** Outer rim, drawn first: residual (gross - discount - net). */
  gross: LayerFrame;
  /** Drawn over gross, leaving the residual rim: discount_amount. */
  discount: LayerFrame;
  /** Drawn over discount, leaving the discount rim: net_revenue (body). */
  net: LayerFrame;
  /** Drawn over net, leaving the net rim (body): margin (core). */
  margin: LayerFrame;
}

export type RibbonForm = "unrolled" | "coil";

export interface Viewport {
  width: number;
  height: number;
}

/** Linear sample position (0..22) -> interpolated value between month i and i+1. */
function sampleSeries(series: MonthPoint[], field: keyof MonthPoint, t: number): number {
  const n = series.length;
  const clamped = Math.max(0, Math.min(n - 1, t));
  const i0 = Math.floor(clamped);
  const i1 = Math.min(n - 1, i0 + 1);
  const frac = clamped - i0;
  const v0 = series[i0][field] as number;
  const v1 = series[i1][field] as number;
  return v0 + (v1 - v0) * frac;
}

/** Scales a dollar value to a half-thickness in SVG units. */
export type ThicknessScale = (value: number) => number;

function buildFrame(
  centerAt: (t: number) => Point,
  normalAt: (t: number) => Point,
  series: MonthPoint[],
  scale: ThicknessScale
): RibbonFrame {
  const centerline: Point[] = [];
  const gross: LayerFrame = { outer: [], inner: [] };
  const discount: LayerFrame = { outer: [], inner: [] };
  const net: LayerFrame = { outer: [], inner: [] };
  const margin: LayerFrame = { outer: [], inner: [] };

  for (let s = 0; s < SAMPLES_PER_RIBBON; s++) {
    const t = (s / (SAMPLES_PER_RIBBON - 1)) * (series.length - 1);
    const c = centerAt(t);
    const n = normalAt(t);
    centerline.push(c);

    const hGross = scale(sampleSeries(series, "gross_revenue", t)) / 2;
    const hNet = scale(sampleSeries(series, "net_revenue", t)) / 2;
    const hMargin = scale(sampleSeries(series, "margin", t)) / 2;
    const discountAmt = sampleSeries(series, "discount_amount", t);
    const hDiscount = scale(Math.max(0, sampleSeries(series, "net_revenue", t) + discountAmt)) / 2;

    const push = (layer: LayerFrame, h: number) => {
      layer.outer.push({ x: c.x + n.x * h, y: c.y + n.y * h });
      layer.inner.push({ x: c.x - n.x * h, y: c.y - n.y * h });
    };
    push(gross, hGross);
    push(discount, hDiscount);
    push(net, hNet);
    push(margin, hMargin);
  }
  return { centerline, gross, discount, net, margin };
}

/** Unrolled: a straight horizontal band across the viewport. */
export function unrolledFrame(series: MonthPoint[], viewport: Viewport, scale: ThicknessScale): RibbonFrame {
  const margin = viewport.width * 0.04;
  const usable = viewport.width - margin * 2;
  const centerY = viewport.height / 2;
  return buildFrame(
    (t) => ({ x: margin + (t / (series.length - 1)) * usable, y: centerY }),
    () => ({ x: 0, y: 1 }),
    series,
    scale
  );
}

/**
 * Coil: an Archimedean dial, 12 spokes, Nov at 12 o'clock, clockwise. Year 1
 * is the inner turn, Year 2 the outer turn. Angle is purely a function of
 * calendar month (month-of-year * 30 degrees), so Nov 2024 and Nov 2025 land
 * on the exact same spoke -- see spokeAngleDeg, tested directly in
 * geometry.test.ts (signature-moments.md acceptance check 2).
 */
export function spokeAngleDeg(monthIndexFromStart: number): number {
  return ((monthIndexFromStart % 12) * 30 + 360) % 360;
}

export function coilFrame(series: MonthPoint[], viewport: Viewport, scale: ThicknessScale): RibbonFrame {
  const cx = viewport.width / 2;
  const cy = viewport.height / 2;
  const rInner = Math.min(viewport.width, viewport.height) * 0.18;
  const ringGap = Math.min(viewport.width, viewport.height) * 0.14;

  const polar = (t: number) => {
    const angleDeg = spokeAngleDeg(t);
    const turn = Math.floor(t / 12);
    const radius = rInner + turn * ringGap;
    const rad = (angleDeg * Math.PI) / 180;
    return { angleRad: rad, radius };
  };

  return buildFrame(
    (t) => {
      const { angleRad, radius } = polar(t);
      return { x: cx + radius * Math.sin(angleRad), y: cy - radius * Math.cos(angleRad) };
    },
    (t) => {
      const { angleRad } = polar(t);
      // Outward radial normal.
      return { x: Math.sin(angleRad), y: -Math.cos(angleRad) };
    },
    series,
    scale
  );
}

export function frameForForm(form: RibbonForm, series: MonthPoint[], viewport: Viewport, scale: ThicknessScale): RibbonFrame {
  return form === "coil" ? coilFrame(series, viewport, scale) : unrolledFrame(series, viewport, scale);
}

function lerpPoints(a: Point[], b: Point[], p: number): Point[] {
  const out: Point[] = [];
  for (let i = 0; i < a.length; i++) {
    const [x, y] = interpolate([a[i].x, a[i].y], [b[i].x, b[i].y])(p);
    out.push({ x, y });
  }
  return out;
}

/** Morphs frame `from` into frame `to` at progress p in [0,1], per-point, with d3.interpolate. */
function lerpLayer(a: LayerFrame, b: LayerFrame, p: number): LayerFrame {
  return { outer: lerpPoints(a.outer, b.outer, p), inner: lerpPoints(a.inner, b.inner, p) };
}

export function morphFrame(from: RibbonFrame, to: RibbonFrame, p: number): RibbonFrame {
  return {
    centerline: lerpPoints(from.centerline, to.centerline, p),
    gross: lerpLayer(from.gross, to.gross, p),
    discount: lerpLayer(from.discount, to.discount, p),
    net: lerpLayer(from.net, to.net, p),
    margin: lerpLayer(from.margin, to.margin, p),
  };
}

/** Builds a closed SVG path `d` from an outer edge (forward) and inner edge (reversed). */
export function layerPathD(layer: LayerFrame): string {
  const pts = [...layer.outer, ...[...layer.inner].reverse()];
  if (pts.length === 0) return "";
  return `M${pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join("L")}Z`;
}

export function centerlinePathD(points: Point[]): string {
  if (points.length === 0) return "";
  return `M${points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join("L")}`;
}

/** Sample index (0..239) nearest a given chronological month index (0..22), for lens placement. */
export function sampleIndexForMonth(monthIndex: number, monthCount: number): number {
  const t = monthIndex / (monthCount - 1);
  return Math.round(t * (SAMPLES_PER_RIBBON - 1));
}
