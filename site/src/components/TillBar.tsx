// Till Bar: region / category / channel chips, one filter state shared with
// any scene's own cross-filter UI (Slice's grid), never two. Docked
// bottom-centre on desktop (responsive-spec.md section 1), persistent
// Scene 1-5, hidden in Scenes 6-7 (see final report: scroll-storyboard.md's
// nav-behaviour bullet also says chips go `na` in Scene 6, which is moot
// once the bar is hidden there -- resolved in favour of "hidden in 6 and 7",
// the more specific of the two rules, and the one scroll-storyboard.md's own
// Scene 6 section states under "Data").
import { useRibbon } from "../lib/RibbonContext";
import type { Filters } from "../lib/useFixtures";

type Dim = "regions" | "categories" | "channels";

const NA_REASONS: Partial<Record<string, Partial<Record<Dim, string>>>> = {
  shelf: {
    regions: "SKU fixture has no region",
    channels: "SKU fixture has no channel",
  },
};

export function TillBar({ filterOptions }: { filterOptions: Filters }) {
  const { filters, setFilters, activeScene } = useRibbon();
  if (activeScene === "return" || activeScene === "proof") return null;

  const naFor = NA_REASONS[activeScene] ?? {};

  function toggle(dim: Dim, value: string) {
    const current = (filters as Record<Dim, string[] | undefined>)[dim] ?? [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    setFilters({ ...filters, [dim]: next.length ? next : undefined });
  }

  function renderGroup(dim: Dim, options: string[], groupLabel: string) {
    const reason = naFor[dim];
    const selected = (filters as Record<Dim, string[] | undefined>)[dim] ?? [];
    return (
      <div className="chip-group" role="group" aria-label={groupLabel}>
        {options.map((opt) => {
          const isSelected = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              className={`chip${isSelected ? " selected" : ""}${reason ? " na" : ""}`}
              aria-pressed={isSelected}
              aria-disabled={reason ? "true" : undefined}
              aria-description={reason}
              title={reason}
              disabled={!!reason}
              onClick={() => !reason && toggle(dim, opt)}
            >
              {opt}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="till-bar" role="toolbar" aria-label="Filters">
      {renderGroup("regions", filterOptions.regions, "Customer region")}
      {renderGroup("categories", filterOptions.categories, "Category")}
      {renderGroup("channels", filterOptions.channels, "Channel")}
    </div>
  );
}
