// The persistent Ribbon stage. One fixed SVG for the whole page (Continuity
// rule, motion-spec.md section 4): it never unmounts between scenes, only
// its geometry (form) and camera (viewBox) change.
import { useMemo } from "react";
import { scaleLinear } from "d3-scale";
import {
  coilFrame,
  layerPathD,
  morphFrame,
  unrolledFrame,
  type RibbonForm,
} from "../lib/geometry";
import { useRibbon } from "../lib/RibbonContext";
import { useReducedMotion } from "../lib/useReducedMotion";

const STAGE = { width: 1000, height: 600 };
const UNROLLED_CAMERA = `0 0 ${STAGE.width} ${STAGE.height}`;
const COIL_CAMERA = "260 60 480 480";

function lerpBox(a: string, b: string, p: number): string {
  const pa = a.split(" ").map(Number);
  const pb = b.split(" ").map(Number);
  return pa.map((v, i) => v + (pb[i] - v) * p).join(" ");
}

export function ribbonFormForScene(scene: string): RibbonForm {
  return scene === "year" ? "unrolled" : "coil";
}

export function Ribbon() {
  const { series, months, seasonProgress, activeScene, lensIndex } = useRibbon();
  const reducedMotion = useReducedMotion();

  const maxGross = useMemo(() => Math.max(...series.map((p) => p.gross_revenue), 1), [series]);
  const scale = useMemo(() => scaleLinear().domain([0, maxGross]).range([0, 140]), [maxGross]);

  const unrolled = useMemo(() => unrolledFrame(series, STAGE, scale), [series, scale]);
  const coil = useMemo(() => coilFrame(series, STAGE, scale), [series, scale]);

  // p: 0 = fully unrolled, 1 = fully coiled. Only Scene 2 (season) scrubs it
  // continuously; every other scene/jump snaps to its settled end (0 or 1),
  // and under reduced motion every scene is a flat state swap (no morph).
  let p: number;
  if (reducedMotion) {
    p = activeScene === "year" ? 0 : 1;
  } else if (activeScene === "season") {
    p = seasonProgress;
  } else {
    p = ribbonFormForScene(activeScene) === "coil" ? 1 : 0;
  }

  const frame = useMemo(() => morphFrame(unrolled, coil, p), [unrolled, coil, p]);
  const cameraBox = reducedMotion ? (p === 0 ? UNROLLED_CAMERA : COIL_CAMERA) : lerpBox(UNROLLED_CAMERA, COIL_CAMERA, p);

  const lensSample = Math.round((lensIndex / Math.max(1, months.length - 1)) * (frame.centerline.length - 1));
  const lensPoint = frame.centerline[lensSample] ?? frame.centerline[0];

  return (
    <div className="ribbon-stage" aria-hidden="true">
      <svg
        viewBox={cameraBox}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        style={{ transition: reducedMotion ? "none" : "viewBox 280ms linear" }}
      >
        <path d={layerPathD(frame.gross)} fill="var(--muted)" opacity={0.5} />
        <path d={layerPathD(frame.discount)} fill="var(--gold)" opacity={0.85} />
        <path d={layerPathD(frame.net)} fill="var(--copper)" />
        <path d={layerPathD(frame.margin)} fill="var(--teal)" />
        <path d={layerPathD(frame.gross)} fill="none" stroke="var(--cream)" strokeOpacity={0.4} strokeWidth={1} />
        {lensPoint && (
          <circle cx={lensPoint.x} cy={lensPoint.y} r={6} fill="var(--copper)" stroke="var(--midnight)" strokeWidth={2} />
        )}
      </svg>
    </div>
  );
}
