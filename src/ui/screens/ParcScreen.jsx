import { MODULES } from "../../domain/index.js";
import { moduleColor } from "../visuals.js";
import { EffectList } from "../components/EffectList.jsx";
import { Overlay } from "../components/Overlay.jsx";

export function ParcScreen({ view, backLabel, onBack }) {
  const groups = new Map();
  view.parc.forEach((card) => {
    const key = `${card.moduleId}-${card.level}`;
    groups.set(key, { card, count: (groups.get(key)?.count ?? 0) + 1 });
  });
  return (
    <Overlay label="Ton parc">
      <div className="title-neon">TON PARC</div>
      <p className="hint">
        {view.parc.length} modules. Il reste {view.drawCount} cartes dans la pioche de ce contrat ({view.playedCount} jouées ou défaussées, elles reviendront au contrat suivant). Un parc plus petit fait revenir plus souvent tes meilleurs modules, mais s'épuise plus vite.
      </p>
      <div className="panel" style={{ padding: 10, display: "grid", gap: 10 }}>
        {[...groups.values()].map(({ card, count }) => (
          <div key={`${card.moduleId}-${card.level}`} style={{ display: "grid", gridTemplateColumns: "auto minmax(0,1fr)", gap: 8, alignItems: "start", paddingBottom: 8, borderBottom: "2px dashed var(--line)" }}>
            <span className="fam num" style={{ background: moduleColor(card.moduleId), fontSize: 12 }}>×{count}</span>
            <div>
              <b>{MODULES[card.moduleId].name}</b> <span className="num" style={{ fontSize: 11, color: "var(--dim)" }}>niv. {card.level}</span>
              <EffectList moduleId={card.moduleId} level={card.level} />
            </div>
          </div>
        ))}
      </div>
      <button className="btn blue" onClick={onBack}>{backLabel}</button>
    </Overlay>
  );
}
