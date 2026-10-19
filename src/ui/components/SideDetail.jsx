// Détail de la carte choisie dans la main (panneau latéral, ou bulle sur téléphone).

import { FAMILIES, MODULES } from "../../domain/index.js";
import { EffectLines } from "./EffectLines.jsx";

export function SideDetail({ view, selection, desktop = false }) {
  const card = selection.length === 1 ? view.hand.find((other) => other.uid === selection[0]) : null;
  let content = null;
  if (card) {
    const module = MODULES[card.moduleId];
    content = (
      <>
        <p><b>{module.name}</b> <span className="dim">· {FAMILIES[module.family].name} · niveau {card.level}</span></p>
        <EffectLines moduleId={card.moduleId} level={card.level} />
        <p className="dim small">Touche une case vide pour le poser. La case 1 s'active en premier.</p>
      </>
    );
  } else if (selection.length > 1) {
    content = <p><b>{selection.length} cartes choisies.</b> Défausse-les pour en piocher d'autres.</p>;
  }
  if (!content && desktop) {
    content = <p className="dim">Touche une carte de ta main pour voir son effet, puis une case pour la poser. Touche un module posé pour le reprendre. Choisis plusieurs cartes pour les défausser.</p>;
  }
  return <aside className="side">{content && <div className="hint side-detail">{content}</div>}</aside>;
}
