// Keyboard map for the lens (responsive-spec.md section 5): Left/Right move
// one month, Shift = 3, Home/End jump to the ends. Scoped to a container ref
// so it only fires while that scene's lens is the relevant focusable mark.
import { useEffect } from "react";
import { useRibbon } from "./RibbonContext";

export function useLensKeyboard(containerRef: React.RefObject<HTMLElement | null>) {
  const { months, setLensIndex } = useRibbon();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const step = (e.shiftKey ? 3 : 1) * (e.key === "ArrowLeft" ? -1 : 1);
        setLensIndex((i) => Math.max(0, Math.min(months.length - 1, i + step)));
      } else if (e.key === "Home") {
        e.preventDefault();
        setLensIndex(0);
      } else if (e.key === "End") {
        e.preventDefault();
        setLensIndex(months.length - 1);
      }
    }
    el.addEventListener("keydown", onKeyDown);
    return () => el.removeEventListener("keydown", onKeyDown);
  }, [containerRef, months.length, setLensIndex]);
}
