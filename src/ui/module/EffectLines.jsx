// Effets d'un module en lignes : pastille, phrase, condition, « Ici : … », parent.

import { effectLines, hereContext } from "../../engine/effectLines.js";
import { MODULES } from "../../engine/modules.js";
import { BRANCHES } from "../../engine/fusedModules.js";
import { FX } from "../fx.jsx";

const KIND_CLASS = { c: "el-c", s: "el-s", d: "el-d", b: "el-b", r: "el-r", x: "el-x", g: "el-g" };
const FAMILY_ACCENT = { calcul: "cyan", stockage: "violet", reseau: "pink", business: "amber", ops: "green" };

// lines : lignes déjà calculées, ou module pour les calculer.
// state + slot : pour les « Ici : … ». compact : sans condition ni source (infobulles).
export function EffectLines({ module, lines, state, slot, compact = false, numbered = false, className = "" }) {
  let list = lines ?? effectLines(module);
  let here = state && slot != null && slot >= 0 ? hereContext(state, slot) : null;
  return (
    <ol className={`effect-lines ${compact ? "compact" : ""} ${numbered && list.length > 1 ? "numbered" : ""} ${className}`}>
      {list.map((l, index) => {
        let hereText = here && l.here ? l.here(here) : null;
        let source = l.source ? MODULES[l.source.defId] : null;
        return (
          <li key={index} className="el-row">
            <span className={`el-pill num ${KIND_CLASS[l.kind] ?? ""}`}>{l.value}</span>
            <span className="el-text">{l.text}</span>
            {!compact && l.cond && <span className="el-cond">{FX(l.cond)}</span>}
            {!compact && hereText && <span className="el-here">{FX(hereText)}</span>}
            {!compact && source && (
              <span className={`el-src accent-${FAMILY_ACCENT[source.family]}`}>
                <i />
                {source.name}
                {l.source.branch ? ` · ${BRANCHES[l.source.defId][l.source.branch].name}` : ""}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
