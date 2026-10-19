// Fiche d'un module : panneau qui monte sur téléphone, fenêtre au centre sur ordinateur.
// Elle sert pour une carte de la main comme pour un module posé.

import { useEffect } from "react";
import { FAMILIES, MODULES, RULES, upgradeCost } from "../../domain/index.js";
import { ModuleIcon } from "../common/ModuleIcon.jsx";
import { FAMILY_ACCENT } from "../visuals.js";
import { EffectLines } from "./EffectLines.jsx";

function LevelCard({ label, card, className = "" }) {
  return (
    <div className={`mm-card ${className}`}>
      <span className="mm-lv">{label}</span>
      <EffectLines moduleId={card.moduleId} level={card.level} />
    </div>
  );
}

export function ModuleSheet({ card, place, view, desktop, marked, onClose, actions }) {
  const module = MODULES[card.moduleId];
  const accent = FAMILY_ACCENT[module.family];
  const nextLevel = card.level < RULES.maxCardLevel ? card.level + 1 : null;
  const onBoard = place.kind === "cell";
  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const freeCell = view.board.findIndex((other) => other === null);
  const canPlace = !onBoard && view.placedCount < view.limits.maxPlaced && freeCell >= 0;
  return (
    <>
      <div className="mm-backdrop" aria-hidden="true" onClick={onClose} />
      <div className={`module-sheet mm ${desktop ? "mm-desk" : ""} accent-${accent}`} role="dialog" aria-modal="true" aria-label={`Fiche de ${module.name}`}>
        <span className="mm-handle" aria-hidden="true" />
        <header className="mm-head">
          <span className={`mm-tile accent-${accent}`} aria-hidden="true">
            <span className={`fu-band mm-tile-band accent-${accent}`}><ModuleIcon id={card.moduleId} size={18} /></span>
            <span className="mm-tile-name">{module.shortName}</span>
            <span className="mm-tile-lvl num">{"■".repeat(card.level)}{"□".repeat(RULES.maxCardLevel - card.level)}</span>
          </span>
          <div className="mm-title">
            <h2>{module.name}</h2>
            <span className="mm-tags">
              <span className="fu-fams"><span className={`fu-fam accent-${accent}`}>{FAMILIES[module.family].name}</span></span>
            </span>
            <span className="mm-sub">
              {module.producer ? "Producteur" : "Soutien"} · {onBoard ? `case ${place.cell + 1}` : "dans ta main"}
            </span>
          </div>
          <span className="mm-wallet num">{view.data} ◆</span>
        </header>
        <div className="mm-body">
          <section className="mm-sec">
            <h3>Ce qu’il fait</h3>
            <LevelCard label={`Niveau ${card.level}`} card={card} className="now" />
          </section>
          {nextLevel && (
            <section className="mm-sec">
              <h3>Prochaine amélioration</h3>
              <LevelCard label={`Niveau ${nextLevel}`} card={{ ...card, level: nextLevel }} className="next" />
              <p className="mm-note">S’améliore en boutique, entre deux contrats, pour {upgradeCost(card.level)} ◆. Chaque exemplaire du parc s’améliore à part.</p>
            </section>
          )}
          <section className="mm-sec">
            <p className="mm-note">Famille {FAMILIES[module.family].name} : {FAMILIES[module.family].role}</p>
          </section>
        </div>
        <footer className="mm-foot">
          {onBoard ? (
            <button className="primary data mm-go" onClick={() => actions.takeBack(place.cell)}>Reprendre en main</button>
          ) : (
            <button className="primary data mm-go" disabled={!canPlace} onClick={() => actions.place(card.uid, freeCell)}>
              {canPlace ? `Poser sur la case ${freeCell + 1}` : `${view.limits.maxPlaced} modules déjà posés`}
            </button>
          )}
          <div className="mm-row">
            {!onBoard && (
              <button className="ghost mm-sell" disabled={!view.discardsLeft} onClick={() => actions.toggleDiscard(card.uid)}>
                {marked ? "Ne plus défausser" : "À défausser"}
              </button>
            )}
            <button className="mm-back" onClick={onClose}>Retour au plateau</button>
          </div>
        </footer>
      </div>
    </>
  );
}
