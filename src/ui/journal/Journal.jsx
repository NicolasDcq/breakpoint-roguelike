// Journal d'exécution.

import { useEffect, useRef } from "react";
import { describeEvent } from "./events.js";

export function Journal(e) {
  let t = useRef(null);
  let a = (e.last ? e.revealed === null ? e.last.events : e.last.events.slice(0, e.revealed + 1) : []).map((r) => describeEvent(r, e.jokers)).filter((r) => r !== null);
  useEffect(
    () => {
      if (t.current) {
        t.current.scrollTop = t.current.scrollHeight;
      }
    },
    [a.length],
  );
  return e.last
    ? (
      <ol className="journal" ref={t}>
        {a.map((r, n) => (
          <li
            key={n}
            className={`jl jl-${r.kind}`}
            style={{ paddingLeft: 10 + Math.min(r.depth, 6) * 12 }}
          >
            {r.slot !== undefined && <span className="jl-slot num">{r.slot + 1}</span>}
            <span className="jl-title">{r.title}</span>
            {r.detail && <span className="jl-detail">{r.detail}</span>}
          </li>
        ))}
      </ol>
    )
    : (
      <div className="journal empty">
        <p>
          Lance un déploiement : chaque activation, bonus et Plugin déclenché s’affichera ici, dans l’ordre.
        </p>
      </div>
    );
}
