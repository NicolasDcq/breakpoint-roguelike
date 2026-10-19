// Bandeau de l'architecture posée : elle donne la base du déploiement.

import { ARCHITECTURE_BY_ID } from "../../domain/index.js";
import { ArchitecturePills } from "./ArchitecturePills.jsx";

export function ArchitectureBanner({ preview, flash, onShowAll }) {
  const showAll = <button className="lbl link" onClick={onShowAll}>voir tout</button>;
  if (!preview.count) {
    return (
      <div className="panel combo none">
        <div><div className="cn">Base : architecture</div><div className="cl">Pose des modules : 2 identiques, 3 identiques, 5 familles…</div></div>
        {showAll}
      </div>
    );
  }
  const { id, level, compute, scale } = preview.architecture;
  const architecture = ARCHITECTURE_BY_ID[id];
  return (
    <div className={`panel combo ${id === "monolithe" ? "none" : ""} ${flash ? "flash" : ""}`}>
      <div style={{ minWidth: 0 }}>
        <div className="cn">{architecture.name} <span className="num" style={{ fontSize: 11, color: "var(--violet-hot)" }}>niv. {level}</span></div>
        <div className="cl">Base · {architecture.rule} · {showAll}</div>
      </div>
      <div className="cv"><ArchitecturePills compute={compute} scale={scale} /></div>
    </div>
  );
}
