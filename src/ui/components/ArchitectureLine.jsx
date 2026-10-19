// La base du déploiement : l'architecture formée par les modules posés.

import { ARCHITECTURE_BY_ID } from "../../domain/index.js";
import { fmtDec } from "../format.js";

export function ArchitecturePills({ compute, scale }) {
  return (
    <span className="arch-pills">
      <span className="el-pill num el-c">{compute} ⚡</span>
      <span className="el-pill num el-s">× {fmtDec(scale)}</span>
    </span>
  );
}

export function ArchitectureLine({ preview, flash, onShowAll }) {
  const placed = preview.count > 0;
  const { id, level, compute, scale } = preview.architecture;
  const architecture = ARCHITECTURE_BY_ID[id];
  return (
    <button className={`arch-line ${placed && id !== "monolithe" ? "on" : ""} ${flash ? "flash" : ""}`} onClick={onShowAll} aria-label="Voir les architectures">
      <span className="arch-tag">Base</span>
      {placed ? (
        <>
          <span className="arch-name">{architecture.name} <i className="num">niv. {level}</i></span>
          <span className="arch-rule">{architecture.rule}</span>
          <ArchitecturePills compute={compute} scale={scale} />
        </>
      ) : (
        <span className="arch-rule">Pose des modules : 2 identiques, 3 identiques, 5 familles…</span>
      )}
    </button>
  );
}
