// Le détail de la carte choisie, ou une aide.

import { FAMILIES, MODULES } from "../../domain/index.js";
import { familyColor } from "../visuals.js";
import { EffectList } from "./EffectList.jsx";

export function DetailPanel({ view, selection }) {
  const card = selection.length === 1 ? view.hand.find((other) => other.uid === selection[0]) : null;
  if (card) {
    const module = MODULES[card.moduleId];
    return (
      <div className="panel detail">
        <div className="dt">
          <b>{module.name}</b>
          <span className="fam" style={{ background: familyColor(module.family) }}>{FAMILIES[module.family].name.toUpperCase()}</span>
          <span className="num" style={{ fontSize: 11, color: "var(--dim)" }}>niv. {card.level}</span>
        </div>
        <EffectList moduleId={card.moduleId} level={card.level} />
        <div className="hint">Touche une case vide pour le poser. L'ordre des numéros compte : la case 1 s'active en premier.</div>
      </div>
    );
  }
  return (
    <div className="panel detail">
      {selection.length > 1
        ? <div className="hint"><b style={{ color: "var(--text)" }}>{selection.length} cartes choisies.</b> Défausse-les pour en piocher d'autres.</div>
        : <div className="hint">Touche une carte pour voir son effet et la poser. Touche un module posé pour le reprendre. Choisis plusieurs cartes pour les défausser.</div>}
    </div>
  );
}
