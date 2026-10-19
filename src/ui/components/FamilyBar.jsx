// Nombre de modules posés par famille.

import { FAMILY_IDS, MODULES } from "../../domain/index.js";
import { FAMILY_GLYPHS, familyName } from "../visuals.js";

export function FamilyBar({ board }) {
  const counts = Object.fromEntries(FAMILY_IDS.map((family) => [family, 0]));
  board.filter(Boolean).forEach((card) => { counts[MODULES[card.moduleId].family]++; });
  return (
    <div className="fam-bar" aria-label="Modules posés par famille">
      {FAMILY_IDS.map((family) => (
        <span key={family} className={`fam-count fam-${family} ${counts[family] ? "on" : ""}`} title={`${familyName(family)} : ${counts[family]} module(s)`}>
          <span className="fam-glyph" aria-hidden="true">{FAMILY_GLYPHS[family]}</span>
          <span className="fam-name">{familyName(family)}</span>
          <b className="num">{counts[family]}</b>
        </span>
      ))}
    </div>
  );
}
