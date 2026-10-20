// L'intérieur d'une tuile de module (plateau, main, parc) et son infobulle.

import { FAMILIES, MODULES } from "../../domain/index.js";
import { ModuleIcon } from "../common/ModuleIcon.jsx";
import { FAMILY_GLYPHS, moduleSummary } from "../visuals.js";
import { EffectLines } from "./EffectLines.jsx";

/** Pastille « amélioration possible » (deux chevrons), comme dans l'ancien jeu. */
export function UpgradeDot() {
  return (
    <span className="up-ready up-dot" title="Amélioration possible : touche le module" aria-label="Amélioration possible">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 11l7-6 7 6M5 20l7-6 7 6" />
      </svg>
    </span>
  );
}

export function ModuleFace({ card, upgradable = false }) {
  const module = MODULES[card.moduleId];
  return (
    <>
      {upgradable && <UpgradeDot />}
      <span className={`tile-fam fam-${module.family}`} title={`Famille ${FAMILIES[module.family].name}`} aria-hidden="true">
        {FAMILY_GLYPHS[module.family]}
      </span>
      <span className="tile-icon"><ModuleIcon id={card.moduleId} size={30} /></span>
      <span className="tile-name">{module.shortName}</span>
      <span className="tile-effect">{moduleSummary(card)}</span>
      <span className="tile-level" aria-hidden="true">
        {[1, 2, 3].map((step) => <i key={step} className={step <= card.level ? "on" : ""} />)}
      </span>
    </>
  );
}

export function ModuleTip({ card }) {
  const module = MODULES[card.moduleId];
  return (
    <div className="tip-body">
      <strong>{module.name} <span className="dim">niveau {card.level}</span></strong>
      <EffectLines moduleId={card.moduleId} level={card.level} compact />
      <p className="tip-syn">
        Famille {FAMILIES[module.family].name}. {module.producer ? "Producteur." : "Soutien : ne produit rien lui-même."}
      </p>
    </div>
  );
}
