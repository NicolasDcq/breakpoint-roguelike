// La main : les modules piochés. On en choisit un pour le poser, ou plusieurs pour les défausser.

import { moduleColor } from "../visuals.js";
import { TileContent } from "./ModuleTile.jsx";

export function Hand({ view, selection, onToggle, onShowParc, onShowRules }) {
  return (
    <div className="panel hand-wrap">
      <div className="hand-head">
        <span className="lbl">
          Main {view.hand.length} · posés {view.placedCount}/{view.limits.maxPlaced} · <b style={{ color: "var(--text)" }}>pioche {view.drawCount}</b>
        </span>
        <span style={{ display: "flex", gap: 10 }}>
          <button className="lbl link" onClick={onShowParc}>Parc ({view.parc.length})</button>
          <button className="lbl link" onClick={onShowRules}>Règles</button>
        </span>
      </div>
      <div className="hand">
        {view.hand.map((card) => {
          const selected = selection.includes(card.uid);
          return (
            <button key={card.uid} className={`card ${selected ? "sel" : ""}`} style={{ "--acc": moduleColor(card.moduleId) }} aria-pressed={selected} onClick={() => onToggle(card.uid)}>
              <TileContent card={card} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
