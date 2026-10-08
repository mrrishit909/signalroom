import { useEffect, useRef, useState } from "react";
import { Ribbon } from "./components/Ribbon";
import { SceneNav } from "./components/SceneNav";
import { TillBar } from "./components/TillBar";
import { Opening } from "./components/Opening";
import {
  YearScene,
  SeasonScene,
  PromoScene,
  SliceScene,
  ShelfScene,
  ReturnScene,
  ProofScene,
} from "./components/Scenes";
import { RibbonProvider, SCENES, useRibbon } from "./lib/RibbonContext";
import { useMonthly, useFilters, useSkuMonthly, useCohort } from "./lib/useFixtures";

function Shell() {
  const { setActiveScene, readout } = useRibbon();
  const [openingDone, setOpeningDone] = useState(false);
  const [sliceVisible, setSliceVisible] = useState(false);
  const sliceRef = useRef<HTMLDivElement>(null);

  const sku = useSkuMonthly(sliceVisible);
  const cohort = useCohort(sliceVisible);

  // Triggered scene transitions fire when a scene's top crosses 55% of the
  // viewport height (motion-spec.md "Scene transitions"). This also lazily
  // enables Scene 5/6 fixture loads once Scene 4 (Slice) is near.
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-scene]"));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("data-scene");
            const match = SCENES.find((s) => s.id === id);
            if (match) setActiveScene(match.id);
            if (id === "slice") setSliceVisible(true);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [setActiveScene]);

  const filters = useFilters();

  return (
    <>
      <Ribbon />
      {!openingDone && <Opening onDone={() => setOpeningDone(true)} />}
      <a href="#scene-year" className="visually-hidden">Skip intro</a>
      <SceneNav />
      <main>
        <YearScene />
        <SeasonScene />
        <PromoScene />
        <div ref={sliceRef}>
          <SliceScene />
        </div>
        <ShelfScene skuMonthly={sku.status === "ready" ? sku.data : null} />
        <ReturnScene cohort={cohort.status === "ready" ? cohort.data : null} />
        <ProofScene />
      </main>
      {filters.status === "ready" && <TillBar filterOptions={filters.data} />}
      <div className="aria-live-readout" role="status" aria-live="polite">{readout}</div>
    </>
  );
}

export default function App() {
  const monthly = useMonthly();

  if (monthly.status === "loading") {
    return (
      <div className="skeleton mono" role="status">
        <div className="skeleton-axis" />
        Loading 920 rows...
      </div>
    );
  }
  if (monthly.status === "error") {
    return (
      <div className="skeleton mono" role="alert">
        <p>{monthly.message}</p>
        <button type="button" onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <RibbonProvider monthly={monthly.data}>
      <Shell />
    </RibbonProvider>
  );
}
