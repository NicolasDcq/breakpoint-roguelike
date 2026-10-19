import { ARCHITECTURES, architectureBase } from "../../domain/index.js";
import { ArchitecturePills } from "../components/ArchitecturePills.jsx";
import { Overlay } from "../components/Overlay.jsx";

export function ArchitecturesScreen({ view, backLabel, onBack }) {
  const current = view.placedCount ? view.preview.architecture.id : null;
  return (
    <Overlay label="Architectures">
      <div className="title-neon">ARCHITECTURES</div>
      <p className="hint">Comme les mains au poker : la plus forte formée par les modules posés compte, quelle que soit leur place. Elle donne la base du déploiement : le Compute et le Scale de départ. Ensuite, chaque module posé améliore cette base, case par case. Les mises à jour de la boutique la font monter de niveau.</p>
      <div className="panel archs">
        {ARCHITECTURES.map((architecture) => {
          const level = view.architectureLevels[architecture.id];
          const plays = view.architecturePlays[architecture.id];
          return (
            <div key={architecture.id} className={`arch ${current === architecture.id ? "cur" : ""}`}>
              <span className="an">{architecture.name} <span className="num" style={{ fontSize: 11, color: "var(--violet-hot)" }}>niv. {level}</span></span>
              <span className="ar">{architecture.rule}{plays ? ` · jouée ${plays} fois` : ""}</span>
              <span className="av"><ArchitecturePills {...architectureBase(architecture.id, level)} /></span>
            </div>
          );
        })}
      </div>
      <button className="btn blue" onClick={onBack}>{backLabel}</button>
    </Overlay>
  );
}
