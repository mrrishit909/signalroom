// One hook behind every width/preference query in the app (responsive-spec.md
// breakpoints + prefers-reduced-motion), so each caller doesn't reinvent the
// matchMedia + listener dance.
import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);
  return matches;
}

// responsive-spec.md breakpoints: desktop >= 1200px, tablet 768-1199px, phone < 768px.
export const PHONE_QUERY = "(max-width: 767px)";
export const TABLET_QUERY = "(min-width: 768px) and (max-width: 1199px)";
// Table row 1: tablet reads coil-first in portrait, same as phone.
export const COIL_FIRST_QUERY = "(max-width: 767px), (min-width: 768px) and (max-width: 1199px) and (orientation: portrait)";

export function usePhone(): boolean {
  return useMediaQuery(PHONE_QUERY);
}
export function useTablet(): boolean {
  return useMediaQuery(TABLET_QUERY);
}
export function useCoilFirst(): boolean {
  return useMediaQuery(COIL_FIRST_QUERY);
}
