// 00 Ignition. Full sequence per motion-spec.md section 6; reduced-motion
// alternative per responsive-spec.md section 4 (settled Scene 1 hook frame,
// one 200ms opacity fade, static particle caption, no Skip button).
import { useEffect, useState } from "react";
import { dur } from "../motion/tokens";
import { useRibbon } from "../lib/RibbonContext";
import { useReducedMotion } from "../lib/useReducedMotion";
import { particleCount } from "../lib/oracle";

const SKIP_KEY = "signalroom.introSkipped";

export function Opening({ onDone }: { onDone: () => void }) {
  const reducedMotion = useReducedMotion();
  const { series, setLensIndex } = useRibbon();
  const [visible, setVisible] = useState(true);

  const totalNet = series.reduce((a, p) => a + p.net_revenue, 0);
  const particles = particleCount(totalNet, 5000);

  useEffect(() => {
    setLensIndex(1); // Dec 2024
  }, [setLensIndex]);

  function finish() {
    try {
      localStorage.setItem(SKIP_KEY, "1");
    } catch {
      /* private mode: ignore */
    }
    setVisible(false);
    onDone();
  }

  useEffect(() => {
    if (reducedMotion) return; // no timer: reduced motion shows the settled frame immediately, still skippable via the same finish()
    let skipped = false;
    const timer = setTimeout(() => {
      if (!skipped) finish();
    }, dur.intro);
    const skipOnInput = () => {
      skipped = true;
      clearTimeout(timer);
      finish();
    };
    window.addEventListener("keydown", skipOnInput, { once: true });
    window.addEventListener("pointerdown", skipOnInput, { once: true });
    window.addEventListener("wheel", skipOnInput, { once: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", skipOnInput);
      window.removeEventListener("pointerdown", skipOnInput);
      window.removeEventListener("wheel", skipOnInput);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  useEffect(() => {
    try {
      if (localStorage.getItem(SKIP_KEY) === "1") finish();
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  return (
    <div className={`opening${reducedMotion ? " reduced" : ""}`} role="region" aria-label="Opening">
      <h1 className="wordmark">SIGNALROOM</h1>
      <p className="subtitle">Retail analytics where every number reconciles.</p>
      {reducedMotion ? (
        <>
          <p className="prompt">Drag the lens. Every month reprints the receipt.</p>
          <p className="static-caption mono">
            {particles.toLocaleString("en-US")} x $5,000 = $7.65M net revenue, 23 months.
          </p>
        </>
      ) : (
        <>
          <p className="prompt">Drag the lens. Every month reprints the receipt.</p>
          <button type="button" className="skip-intro" autoFocus onClick={finish}>
            Skip intro
          </button>
        </>
      )}
    </div>
  );
}
