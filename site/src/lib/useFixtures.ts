// Fixture loading. Scenes 0-4 need only monthly.json + filters.json, loaded
// eagerly; sku_monthly/cohort/pareto lazy-load once Scene 4 (Slice) enters
// the viewport, per motion-spec.md's "Loading" rules. Every fetch is
// relative to import.meta.env.BASE_URL so it resolves under the
// vite.config.ts `base: '/signalroom/'` in production, not just at '/'.
import { useEffect, useRef, useState } from "react";
import type { MonthlyRow } from "./aggregate";
import type { SkuMonthlyRow } from "./oracle";

export interface Filters {
  regions: string[];
  categories: string[];
  channels: string[];
}

export interface CohortData {
  retention: { cohort_month: string; months_since: number; retained_customers: number }[];
  cohort_sizes: { cohort_month: string; cohort_size: number }[];
}

export interface ParetoRow {
  product_id: string;
  product_name: string;
  category: string;
  net_revenue: number;
}

function dataUrl(name: string): string {
  return `${import.meta.env.BASE_URL}data/${name}`;
}

export type LoadState<T> = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: T };

function useFetchJson<T>(name: string, enabled = true): LoadState<T> {
  const [state, setState] = useState<LoadState<T>>({ status: "loading" });
  const retryKey = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setState({ status: "loading" });
    fetch(dataUrl(name))
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setState({ status: "ready", data });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error", message: `Couldn't load data/${name}` });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, enabled, retryKey.current]);

  return state;
}

export function useMonthly(): LoadState<MonthlyRow[]> {
  return useFetchJson<MonthlyRow[]>("monthly.json");
}

export function useFilters(): LoadState<Filters> {
  return useFetchJson<Filters>("filters.json");
}

export function useSkuMonthly(enabled: boolean): LoadState<SkuMonthlyRow[]> {
  return useFetchJson<SkuMonthlyRow[]>("sku_monthly.json", enabled);
}

export function useCohort(enabled: boolean): LoadState<CohortData> {
  return useFetchJson<CohortData>("cohort.json", enabled);
}

export function usePareto(enabled: boolean): LoadState<ParetoRow[]> {
  return useFetchJson<ParetoRow[]>("pareto.json", enabled);
}
