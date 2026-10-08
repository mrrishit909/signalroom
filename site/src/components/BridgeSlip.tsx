// Bridge Slip: the cream thermal-paper receipt. Signature moment 1, "Print
// the slip" -- the acceptance check is in oracle.test.ts; this component
// only ever prints `oracle.ts` output, never a tweened number (motion-spec
// section 5.1: "numbers in text never tween").
import { useEffect, useMemo } from "react";
import { useRibbon } from "../lib/RibbonContext";
import { bridgeResidual, marginPct } from "../lib/oracle";

const PROMO_WINDOWS: Record<string, string[]> = {
  "2024-11": ["BLACKFRI24"],
  "2024-12": ["HOLIDAY24"],
  "2025-07": ["SUMMER25"],
  "2025-11": ["BLACKFRI25"],
  "2025-12": ["HOLIDAY25"],
};

function money(n: number): string {
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
}

export function BridgeSlip() {
  const { series, months, lensIndex, partial, setReadout } = useRibbon();
  const point = series[lensIndex];
  const monthLabel = months[lensIndex];
  const isPartial = monthLabel === partial;

  const residual = useMemo(() => (point ? bridgeResidual(point) : 0), [point]);
  const pct = useMemo(() => (point ? marginPct(point) : null), [point]);
  const promoCodes = PROMO_WINDOWS[monthLabel] ?? [];

  useEffect(() => {
    if (!point) return;
    const text = `${monthLabel}: net revenue ${money(point.net_revenue)}, margin ${
      pct !== null ? `${(pct * 100).toFixed(1)}%` : "n/a"
    }${isPartial ? " (Sep 1-3, partial)" : ""}.`;
    setReadout(text);
  }, [monthLabel, point, pct, isPartial, setReadout]);

  if (!point) return null;

  return (
    <aside className="bridge-slip mono" aria-label="Bridge slip">
      <div className="slip-month">{monthLabel}{isPartial && <span className="partial-tag"> · partial</span>}</div>
      <dl>
        <div className="slip-line">
          <dt>GROSS</dt>
          <dd>{money(point.gross_revenue)}</dd>
        </div>
        <div className="slip-line">
          <dt>DISCOUNT{promoCodes.length > 0 && <span className="promo-code"> {promoCodes.join(", ")}</span>}</dt>
          <dd>{money(-point.discount_amount)}</dd>
        </div>
        <div className="slip-line">
          <dt>RETURNS &amp; CANCELS EFFECT (DERIVED)</dt>
          <dd>{money(-residual)}</dd>
        </div>
        <div className="slip-line total">
          <dt>NET</dt>
          <dd>{money(point.net_revenue)}</dd>
        </div>
        <div className="slip-line">
          <dt>COGS</dt>
          <dd>{money(-point.cogs)}</dd>
        </div>
        <div className="slip-line total">
          <dt>MARGIN</dt>
          <dd>
            {money(point.margin)} {pct !== null ? `(${(pct * 100).toFixed(1)}%)` : "(n/a)"}
          </dd>
        </div>
        <div className="slip-line">
          <dt>UNITS</dt>
          <dd>{point.units.toLocaleString("en-US")}</dd>
        </div>
      </dl>
      <p className="slip-footnote">
        Returned items count twice here: unrealized gross plus their negative posting. Returned items post negative.
        Cancelled items post $0.
      </p>
    </aside>
  );
}
