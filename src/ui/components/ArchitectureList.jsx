// La liste des architectures sur ordinateur : leur base à ton niveau, combien de fois chacune a été jouée
// (c'est elle qui décide de la cible d'apt upgrade) et celle que tu formes en ce moment.

import { ARCHITECTURES, architectureBase } from "../../domain/index.js";

export function ArchitectureList({ view, onShowAll }) {
  const formed = view.placedCount ? view.preview.architecture.id : null;
  return (
    <section className="gd-archs" aria-label="Architectures">
      <header className="gd-panel-head">
        <span className="gd-label">Architectures</span>
        <button type="button" className="gd-link" onClick={onShowAll}>Voir les plans</button>
      </header>
      <div className="gd-arch-cols" aria-hidden="true"><span /><span>Jouée</span><span>Base</span></div>
      <ol className="gd-arch-rows">
        {ARCHITECTURES.map((architecture) => {
          const plays = view.architecturePlays[architecture.id] ?? 0;
          const level = view.architectureLevels[architecture.id];
          const { compute, scale } = architectureBase(architecture.id, level);
          const isFormed = formed === architecture.id;
          const isNext = view.nextUpgradeId === architecture.id;
          return (
            <li key={architecture.id} className={`gd-arch ${isFormed ? "formed" : ""} ${isNext ? "next" : ""} ${plays ? "played" : ""}`}>
              <span className="gd-arch-name">
                {architecture.name}
                {level > 1 && <i className="num">niv. {level}</i>}
                {isFormed && <em>formée</em>}
                {isNext && <em className="apt" title="C'est l'architecture que apt upgrade monterait">apt upgrade</em>}
              </span>
              <span className="gd-arch-plays num">{plays ? `${plays}×` : "·"}</span>
              <span className="gd-arch-base num">{compute} × {scale}</span>
            </li>
          );
        })}
      </ol>
      <p className="gd-arch-note">La plus jouée gagne +1 niveau avec <b>apt upgrade</b> (à égalité, la dernière jouée).</p>
    </section>
  );
}
