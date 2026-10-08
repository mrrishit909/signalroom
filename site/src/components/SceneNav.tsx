// Scene Nav: horizontal top bar (desktop/tablet), bottom dock on phones (see
// responsive-spec.md section 1). Digits 1-7 jump to scenes only while focus
// is inside this nav (WCAG 2.1.4), handled by the onKeyDown here, not globally.
import { useRef } from "react";
import { SCENES, useRibbon, type SceneId } from "../lib/RibbonContext";

export function SceneNav() {
  const { activeScene, setActiveScene } = useRibbon();
  const navRef = useRef<HTMLElement>(null);

  function jumpTo(id: SceneId) {
    setActiveScene(id);
    const el = document.getElementById(`scene-end-${id}`) ?? document.getElementById(`scene-${id}`);
    el?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const n = Number(e.key);
    if (n >= 1 && n <= 7) {
      e.preventDefault();
      jumpTo(SCENES[n - 1].id);
    }
  }

  const activeLabel = SCENES.find((s) => s.id === activeScene)?.label ?? "";

  return (
    <>
      {/* Phone (responsive-spec.md section 1): the dock below becomes plain
          numbered dots, so the active scene's name is surfaced here instead. */}
      <p className="scene-nav-current mono" aria-hidden="true">{activeLabel}</p>
      <nav className="scene-nav" aria-label="Scene navigation" ref={navRef} onKeyDown={onKeyDown}>
        <ol>
          {SCENES.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className={s.id === activeScene ? "active" : ""}
                aria-current={s.id === activeScene ? "true" : undefined}
                aria-label={s.aria}
                onClick={() => jumpTo(s.id)}
              >
                <span className="n">{s.n}</span>
                <span className="label">{s.label}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
