// The persistent Ribbon stage. One fixed SVG for the whole page (Continuity
// rule, motion-spec.md section 4): it never unmounts between scenes, only
// its geometry (form) and camera (viewBox) change.
import { useEffect, useMemo, useRef, useState } from "react";
import { scaleLinear } from "d3-scale";
import { animate } from "motion";
import {
  axisFrame,
  coilFrame,
  contextStripFrame,
  layerPathD,
  morphFrame,
  sampleIndexForMonth,
  unrolledFrame,
  type RibbonForm,
  type RibbonFrame,
} from "../lib/geometry";
import { useRibbon, type SceneId } from "../lib/RibbonContext";
import { useReducedMotion } from "../lib/useReducedMotion";
import { useCoilFirst } from "../lib/useMediaQuery";

const STAGE = { width: 1000, height: 600 };
const UNROLLED_CAMERA = { box: `0 0 ${STAGE.width} ${STAGE.height}`, align: "xMidYMid meet" };
const COIL_CAMERA = { box: "260 60 480 480", align: "xMidYMid meet" };
const TOP_BAND_CAMERA = { box: "0 0 1000 190", align: "xMidYMin meet" };

// Promo months get a gold rim highlight + numbered tag, matching Scenes.tsx's
// TAGS list (kept as a tiny parallel literal rather than threading a prop
// through RibbonContext for five constants).
const PROMO_MONTHS = ["2024-11", "2024-12", "2025-07", "2025-11", "2025-12"];

function lerpBox(a: string, b: string, p: number): string {
  const pa = a.split(" ").map(Number);
  const pb = b.split(" ").map(Number);
  return pa.map((v, i) => v + (pb[i] - v) * p).join(" ");
}

/** Which base shape each scene reads as, before camera/alignment is applied. */
export function ribbonFormForScene(scene: SceneId, coilFirst: boolean): RibbonForm {
  if (scene === "year") return coilFirst ? "coil" : "unrolled";
  if (scene === "slice") return "contextStrip";
  if (scene === "return") return "axis";
  return "coil"; // season (end state), promo, shelf
}

function cameraForForm(form: RibbonForm) {
  if (form === "coil") return COIL_CAMERA;
  if (form === "contextStrip" || form === "axis") return TOP_BAND_CAMERA;
  return UNROLLED_CAMERA;
}

export function Ribbon() {
  const { series, months, seasonProgress, activeScene, lensIndex } = useRibbon();
  const reducedMotion = useReducedMotion();
  const coilFirst = useCoilFirst();

  const maxGross = useMemo(() => Math.max(...series.map((p) => p.gross_revenue), 1), [series]);
  const scale = useMemo(() => scaleLinear().domain([0, maxGross]).range([0, 140]), [maxGross]);

  const unrolled = useMemo(() => unrolledFrame(series, STAGE, scale), [series, scale]);
  const coil = useMemo(() => coilFrame(series, STAGE, scale), [series, scale]);
  const strip = useMemo(() => contextStripFrame(series, STAGE, scale), [series, scale]);
  const axis = useMemo(() => axisFrame(series, STAGE, scale), [series, scale]);

  const framesByForm: Record<RibbonForm, RibbonFrame> = {
    unrolled,
    coil,
    contextStrip: strip,
    axis,
  };

  // Season (02) is the one scene that scrubs continuously between unrolled
  // and coil, driven by scroll (Ribbon's historical behaviour, unchanged).
  const seasonTarget = useMemo(() => morphFrame(unrolled, coil, seasonProgress), [unrolled, coil, seasonProgress]);
  const seasonCamera = lerpBox(UNROLLED_CAMERA.box, COIL_CAMERA.box, seasonProgress);

  const targetForm = ribbonFormForScene(activeScene, coilFirst);
  const targetFrame = activeScene === "season" ? seasonTarget : framesByForm[targetForm];
  const targetCamera = activeScene === "season" ? seasonCamera : cameraForForm(targetForm).box;
  const targetAlign = activeScene === "season" ? UNROLLED_CAMERA.align : cameraForForm(targetForm).align;

  // Every other scene change tweens from whatever was last on screen to the
  // new settled shape+camera together (280ms, same budget as the old CSS
  // transition this replaces -- that one didn't actually animate viewBox,
  // since viewBox isn't a CSS-animatable property). Reduced motion state-swaps.
  const [renderFrame, setRenderFrame] = useState(targetFrame);
  const [renderCamera, setRenderCamera] = useState(targetCamera);
  const fromRef = useRef({ frame: targetFrame, camera: targetCamera });
  const stopRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    if (activeScene === "season") {
      // Continuous scrub already supplies every intermediate frame itself.
      setRenderFrame(targetFrame);
      setRenderCamera(targetCamera);
      fromRef.current = { frame: targetFrame, camera: targetCamera };
      return;
    }
    if (reducedMotion) {
      setRenderFrame(targetFrame);
      setRenderCamera(targetCamera);
      fromRef.current = { frame: targetFrame, camera: targetCamera };
      return;
    }
    const from = fromRef.current;
    stopRef.current?.stop();
    const controls = animate(0, 1, {
      duration: 0.28,
      onUpdate: (p) => {
        setRenderFrame(morphFrame(from.frame, targetFrame, p));
        setRenderCamera(lerpBox(from.camera, targetCamera, p));
      },
      onComplete: () => {
        fromRef.current = { frame: targetFrame, camera: targetCamera };
      },
    });
    stopRef.current = controls;
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScene, targetForm, reducedMotion]);

  // Season writes every scrub frame straight through (bypassing the tween above).
  const frame = activeScene === "season" ? targetFrame : renderFrame;
  const cameraBox = activeScene === "season" ? targetCamera : renderCamera;

  const lensSample = Math.round((lensIndex / Math.max(1, months.length - 1)) * (frame.centerline.length - 1));
  const lensPoint = frame.centerline[lensSample] ?? frame.centerline[0];

  // Slice/Return now carry a real, distinct geometry (context strip / axis),
  // so they stay fully visible rather than receded; Shelf keeps its own
  // separate strand visualization and only needs the ribbon as faint
  // continuity. Proof has a light cream ground, so the ribbon is hidden there.
  const recededOpacity = activeScene === "proof" ? 0 : activeScene === "shelf" ? 0.28 : 1;

  const isPromo = activeScene === "promo";
  const promoTickIndexes = useMemo(
    () => PROMO_MONTHS.map((ym) => months.indexOf(ym)).filter((i) => i >= 0),
    [months]
  );

  return (
    <div className="ribbon-stage" aria-hidden="true" style={{ opacity: recededOpacity, transition: "opacity 280ms linear" }}>
      <svg
        viewBox={cameraBox}
        width="100%"
        height="100%"
        preserveAspectRatio={targetAlign}
      >
        {/* A gentle tilt is the Promo scene's own identity: same coil geometry
            (the Nov-at-12 spoke property still holds), rotated+scaled so it
            doesn't read as a plain repeat of Season's coil. */}
        <g transform={isPromo ? "rotate(9 500 300) scale(1.04)" : undefined}>
          <path d={layerPathD(frame.gross)} fill="var(--muted)" opacity={isPromo ? 0.35 : 0.5} />
          <path d={layerPathD(frame.discount)} fill="var(--gold)" opacity={isPromo ? 1 : 0.85} />
          <path d={layerPathD(frame.net)} fill="var(--copper)" opacity={isPromo ? 0.6 : 1} />
          <path d={layerPathD(frame.margin)} fill="var(--teal)" opacity={isPromo ? 0.4 : 1} />
          <path d={layerPathD(frame.gross)} fill="none" stroke="var(--cream)" strokeOpacity={0.4} strokeWidth={1} />
          {isPromo &&
            promoTickIndexes.map((monthIdx) => {
              const s = sampleIndexForMonth(monthIdx, months.length);
              const pt = frame.centerline[s];
              if (!pt) return null;
              return <circle key={monthIdx} cx={pt.x} cy={pt.y} r={9} fill="var(--gold)" stroke="var(--midnight)" strokeWidth={2} />;
            })}
        </g>
        {lensPoint && (
          <circle cx={lensPoint.x} cy={lensPoint.y} r={6} fill="var(--copper)" stroke="var(--midnight)" strokeWidth={2} />
        )}
      </svg>
    </div>
  );
}
