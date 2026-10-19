// Une tuile de module : bandeau de famille, nom, niveau et résumé de l'effet.
// Sert pour le plateau, la main, le parc et la boutique.

import { MODULES } from "../../domain/index.js";
import { familyTag, moduleColor, moduleSummary } from "../visuals.js";

export function LevelBars({ level }) {
  return (
    <span className="lvl" aria-label={`niveau ${level}`}>
      {[1, 2, 3].map((step) => <i key={step} className={step <= level ? "on" : ""} />)}
    </span>
  );
}

export function TileContent({ card, value, withBandText = true }) {
  const module = MODULES[card.moduleId];
  const color = moduleColor(card.moduleId);
  return (
    <>
      <span className="band" style={{ background: color }}>{withBandText ? familyTag(module.family) : null}</span>
      <span className="tname">{module.shortName}</span>
      <LevelBars level={card.level} />
      <span className="tval">{value ?? moduleSummary(card.moduleId, card.level)}</span>
    </>
  );
}

export function ModuleTile({ card, className = "tile" }) {
  return (
    <div className={className} style={{ "--acc": moduleColor(card.moduleId) }}>
      <TileContent card={card} />
    </div>
  );
}
