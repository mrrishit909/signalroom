// Comp Readout: the lens month's Year 1 vs Year 2 net revenue, as a
// horizontal strip beneath the coil (Scene 2 Season), with a third "Discount
// given" row added in Scene 3 Promo.
import { useMemo } from "react";
import { useRibbon } from "../lib/RibbonContext";
import { yoyComps } from "../lib/oracle";

function money(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

export function CompReadout({ showDiscount = false }: { showDiscount?: boolean }) {
  const { series, months, lensIndex, partial } = useRibbon();
  const comps = useMemo(() => yoyComps(series, partial), [series, partial]);
  const lensMonth = months[lensIndex];
  const monthOfYear = lensMonth ? Number(lensMonth.split("-")[1]) : null;

  // Find the comp row whose y1Month shares the same calendar month as the lens.
  const comp = comps.find((c) => Number(c.y1Month.split("-")[1]) === monthOfYear);
  const y1Point = series.find((p) => p.year_month === comp?.y1Month);
  const y2Point = series.find((p) => p.year_month === comp?.y2Month);

  if (!comp) return null;

  return (
    <div className="comp-readout mono" role="group" aria-label="Year over year comparison">
      <div className="comp-bar">
        <span className="comp-label">Year 1 ({comp.y1Month})</span>
        <div className="comp-track">
          <div className="comp-fill y1" style={{ width: `${Math.min(100, ((y1Point?.net_revenue ?? 0) / 700000) * 100)}%` }} />
        </div>
        <span className="comp-value">{y1Point ? money(y1Point.net_revenue) : "n/a"}</span>
      </div>
      <div className="comp-bar">
        <span className="comp-label">Year 2 ({comp.y2Month ?? "n/a"})</span>
        <div className="comp-track">
          <div
            className="comp-fill y2"
            style={{ width: `${Math.min(100, ((y2Point?.net_revenue ?? 0) / 700000) * 100)}%` }}
          />
        </div>
        <span className="comp-value">{y2Point ? money(y2Point.net_revenue) : "n/a"}</span>
      </div>
      <div className="comp-delta">
        {comp.comp === null ? comp.reason : `Δ ${(comp.comp * 100).toFixed(1)}%`}
      </div>
      {showDiscount && y2Point && (
        <div className="comp-bar discount">
          <span className="comp-label">Discount given</span>
          <span className="comp-value gold">{money(y2Point.discount_amount)}</span>
        </div>
      )}
    </div>
  );
}
