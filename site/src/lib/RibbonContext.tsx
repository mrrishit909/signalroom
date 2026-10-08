// The single shared state behind the Continuity rule (motion-spec.md
// section 4): one Ribbon, one geometry, read and written by every scene.
// There is deliberately no per-scene copy of the lens/filters/series state.
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { MonthlyRow } from "./aggregate";
import { allMonths, monthlySeries, partialMonth, type MonthPoint, type MonthlyFilters } from "./oracle";

export const SCENES = [
  { id: "year", label: "Year", n: "01", aria: "Scene 1: The year in net revenue" },
  { id: "season", label: "Season", n: "02", aria: "Scene 2: Seasonality and comps" },
  { id: "promo", label: "Promo", n: "03", aria: "Scene 3: Promotions and margin" },
  { id: "slice", label: "Slice", n: "04", aria: "Scene 4: Cross-filter by region, channel, category" },
  { id: "shelf", label: "Shelf", n: "05", aria: "Scene 5: Product concentration" },
  { id: "return", label: "Return", n: "06", aria: "Scene 6: Cohort retention" },
  { id: "proof", label: "Proof", n: "07", aria: "Scene 7: How every number reconciles" },
] as const;
export type SceneId = (typeof SCENES)[number]["id"];

export interface RibbonState {
  months: string[];
  partial: string;
  monthly: MonthlyRow[];
  filters: MonthlyFilters;
  setFilters: (f: MonthlyFilters) => void;
  lensIndex: number;
  setLensIndex: (i: number | ((prev: number) => number)) => void;
  series: MonthPoint[];
  activeScene: SceneId;
  setActiveScene: (s: SceneId) => void;
  /** 0 = fully unrolled, 1 = fully coiled. Driven by Scene 2's scroll scrub. */
  seasonProgress: number;
  setSeasonProgress: (p: number) => void;
  monthRange: [number, number] | null;
  setMonthRange: (r: [number, number] | null) => void;
  readout: string;
  setReadout: (s: string) => void;
}

const RibbonCtx = createContext<RibbonState | null>(null);

export function RibbonProvider({ monthly, children }: { monthly: MonthlyRow[]; children: ReactNode }) {
  const months = useMemo(() => allMonths(monthly), [monthly]);
  const partial = useMemo(() => partialMonth(months), [months]);
  const [filters, setFilters] = useState<MonthlyFilters>({});
  const [lensIndex, setLensIndex] = useState(1); // Dec 2024, the opening's hook month
  const [activeScene, setActiveScene] = useState<SceneId>("year");
  const [seasonProgress, setSeasonProgress] = useState(0);
  const [monthRange, setMonthRange] = useState<[number, number] | null>(null);
  const [readout, setReadout] = useState("");

  const series = useMemo(() => monthlySeries(monthly, months, filters), [monthly, months, filters]);

  const value: RibbonState = {
    months,
    partial,
    monthly,
    filters,
    setFilters,
    lensIndex,
    setLensIndex: (i) => setLensIndex((prev) => (typeof i === "function" ? (i as (p: number) => number)(prev) : i)),
    series,
    activeScene,
    setActiveScene,
    seasonProgress,
    setSeasonProgress,
    monthRange,
    setMonthRange,
    readout,
    setReadout,
  };

  return <RibbonCtx.Provider value={value}>{children}</RibbonCtx.Provider>;
}

export function useRibbon(): RibbonState {
  const ctx = useContext(RibbonCtx);
  if (!ctx) throw new Error("useRibbon must be used inside RibbonProvider");
  return ctx;
}
