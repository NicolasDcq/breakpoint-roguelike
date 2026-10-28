// Le détail du module survolé (ou, à défaut, du premier module posé), avec le bouton Améliorer.

import { FAMILIES, MODULES, upgradeCost } from "../../domain/index.js";
import { EffectLines } from "./EffectLines.jsx";

export function ModuleDetail({ view, card, locked, onUpgrade }) {
  if (!card) {
    return (
      <section className="gd-detail empty" aria-label="Détail du module">
        <span className="gd-label">Détail</span>
        <p>Survole un module pour voir son effet. Glisse-le pour le poser ou le déplacer.</p>
      </section>
    );
  }
  const module = MODULES[card.moduleId];
  const cost = upgradeCost(card.level);
  return (
    <section className="gd-detail" aria-label="Détail du module">
      <span className="gd-label">Détail</span>
      <h3>{module.name} <i>· niveau {card.level}</i></h3>
      <EffectLines moduleId={card.moduleId} level={card.level} compact />
      <p className="gd-detail-fam">Famille {FAMILIES[module.family].name}. {module.producer ? "Producteur." : "Soutien : ne produit rien lui-même."}</p>
      <div className="gd-detail-foot">
        <span className="gd-level">Niveau {card.level} / 3</span>
        {cost ? (
          <button type="button" className="gd-upgrade" disabled={locked || view.data < cost} onClick={() => onUpgrade(card.uid)}>Améliorer {cost} ◆</button>
        ) : <span className="gd-level">Niveau max</span>}
      </div>
    </section>
  );
}
