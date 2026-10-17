// Éléments d'une tuile de module : infobulle, éditions, familles.

import { EDITIONS, ML_GROWTH } from "../../engine/editions.js";
import {
  FAMILIES,
  FAMILY_LABELS,
  familyBonusText,
  familyLevel,
} from "../../engine/families.js";
import { BRANCHES, FUSED_MODULES } from "../../engine/fusedModules.js";
import { FAMILY_GLYPHS, MODULES } from "../../engine/modules.js";
import {
  countFamilies,
  describePatch,
  moduleView,
  patchVersion,
} from "../../engine/moduleView.js";
import { ModuleIcon } from "../common/ModuleIcon.jsx";
import { FX } from "../fx.jsx";

export function ModuleTip({ id, level, fused, branch, patch, edition, learn }) {
  let d = MODULES[id];
  let u = edition
    ? (
      <p className="tip-edition">
        {"Édition "}
        <b>{EDITIONS[edition].name}</b>
        {" : "}
        {EDITIONS[edition].text}
        {edition === "ml" && learn
          ? ` Déjà appris : +${Math.round(learn * ML_GROWTH * 100)} %.`
          : ""}
      </p>
    )
    : null;
  if (fused) {
    let c = FUSED_MODULES[id];
    return (
      <div className="tip-body">
        <strong>{c.name}{" "}<span className="fused-tag">{patchVersion({ patch })}</span></strong>
        <p>{FX(c.text)}</p>
        {u}
        <p className="dim">{describePatch({ defId: id, patch })}</p>
        <p className="tip-flavor">{c.flavor}</p>
        <p className="tip-syn">{"Fusion de deux modules "}{d.name}{" niveau 3."}</p>
      </div>
    );
  }
  let i = level === 3 && branch ? BRANCHES[id][branch] : null;
  return (
    <div className="tip-body">
      <strong>
        {d.name}
        {" "}
        <span className="dim">{"niveau "}{level}{i ? ` · ${branch} ${i.name}` : ""}</span>
      </strong>
      <p>{FX(i ? i.text : d.describe(level))}</p>
      {u}
      {level === 1 && <p className="dim">{"Niveau 2 : "}{d.describe(2)}</p>}
      {level === 2
        && (
          <p className="dim">
            {"Niveau 3 au choix : A "}
            {BRANCHES[id].A.name}
            {" ("}
            {BRANCHES[id].A.text}
            {") ou B "}
            {BRANCHES[id].B.name}
            {" ("}
            {BRANCHES[id].B.text}
            )
          </p>
        )}
      {level === 3
        && (
          <p className="dim">
            {"Fusion avec un 2e niveau 3 : "}
            {FUSED_MODULES[id].name}
            {". "}
            {FX(FUSED_MODULES[id].text)}
          </p>
        )}
      <p className="tip-flavor">{d.flavor}</p>
      <p className="tip-syn">
        {"Famille "}
        {FAMILY_LABELS[d.family]}
        {". "}
        {d.kind === "utility" ? "Utilitaire : ne produit rien lui-même." : "Producteur."}
        {d.usesNeighbors || i?.usesNeighbors ? " Ses voisins comptent." : ""}
      </p>
    </div>
  );
}

function EditionPattern({ m, crash }) {
  switch (m.edition) {
    case "ml":
      return (
        <svg className="ed-pat" viewBox="0 0 84 74" preserveAspectRatio="none" aria-hidden="true">
          <g stroke="#c4a7ff" strokeWidth=".8" fill="none">
            <path
              d="M10 15 L42 10 M10 15 L42 37 M10 37 L42 10 M10 37 L42 37 M10 37 L42 64 M10 59 L42 37 M10 59 L42 64 M42 10 L74 25 M42 37 L74 25 M42 37 L74 50 M42 64 L74 50"
            />
          </g>
          <g fill="#c4a7ff">
            {[[10, 15], [10, 37], [10, 59], [42, 10], [42, 37], [42, 64], [74, 25], [74, 50]].map(([o, a]) => <circle key={`${o}-${a}`} cx={o} cy={a} r="2.2" />)}
          </g>
        </svg>
      );
    case "free":
      return (
        <svg
          className="ed-pat drift"
          viewBox="0 0 84 148"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <g fill="#ffb547" fontFamily="JetBrains Mono, monospace" fontWeight="800" fontSize="11">
            {[[8, 16], [62, 30], [38, 48], [14, 70], [68, 86], [52, 108], [10, 128], [58, 146]].map(([o, a]) => <text key={`${o}-${a}`} x={o} y={a}>$</text>)}
          </g>
        </svg>
      );
    case "beta":
      return (
        <svg className="ed-pat" viewBox="0 0 84 74" preserveAspectRatio="none" aria-hidden="true">
          <g
            fill="none"
            stroke={crash ? "#ff6b6b" : "#ffd23f"}
            strokeWidth="1"
            strokeLinejoin="round"
            strokeLinecap="round"
          >
            {[[10, 14], [64, 24], [36, 40], [16, 58], [70, 62], [50, 66]].map(([o, a]) => (
              <g key={`${o}-${a}`}>
                <path d={`M${o} ${a - 6} L${o + 6} ${a + 5} L${o - 6} ${a + 5} Z`} />
                <path d={`M${o} ${a - 2} v3 M${o} ${a + 3} v.6`} />
              </g>
            ))}
          </g>
        </svg>
      );
    case "ctr": {
      let o = [];
      for (let r = 0; r < 7; r++) {
        for (let n = 0; n < 7; n++) {
          let l = n * 9 * 1.75 + (r % 2 ? 7.875 : 0);
          let d = r * 9 * 1.5;
          o.push(
            [30, 90, 150, 210, 270, 330].map((u) => `${(l + 9 * Math.cos(u * Math.PI / 180)).toFixed(1)},${(d + 9 * Math.sin(u * Math.PI / 180)).toFixed(1)}`).join(" "),
          );
        }
      }
      return (
        <svg className="ed-pat" viewBox="0 0 84 74" preserveAspectRatio="none" aria-hidden="true">
          <g fill="none" stroke="#5cb6ff" strokeWidth=".8">
            {o.map((r) => <polygon key={r} points={r} />)}
          </g>
        </svg>
      );
    }
    default:
      return null;
  }
}

export function EditionOverlay({ m, crash }) {
  let o = MODULES[m.defId].family;
  return (
    <>
      {m.edition
        && (
          <span className="ed-clip" aria-hidden="true">
            <EditionPattern m={m} crash={crash} />
            {m.edition === "opt" && <i className="ed-sweep" />}
          </span>
        )}
      {m.edition
        && (
          <span className="ed-chip" title={EDITIONS[m.edition].name}>
            {m.edition === "ml" && m.learn
              ? `ML +${Math.round(m.learn * ML_GROWTH * 100)}%`
              : EDITIONS[m.edition].tag}
          </span>
        )}
      {crash && <span className="ed-crash">PLANTE</span>}
      <span
        className={`tile-fam fam-${o}`}
        title={`Famille ${FAMILY_LABELS[o]}`}
        aria-hidden="true"
      >
        {FAMILY_GLYPHS[o]}
      </span>
      <span className="tile-icon"><ModuleIcon id={m.defId} size={30} /></span>
      <span className="tile-name">
        {m.fused ? FUSED_MODULES[m.defId].name : moduleView(m).name}
      </span>
      <span className="tile-effect">{moduleView(m).preview}</span>
      {m.fused
        ? <span className="fused-tag tile-badge">{patchVersion(m)}</span>
        : (
          <span className="tile-level" aria-hidden="true">
            {[1, 2, 3].map((a) => <i key={a} className={a <= m.level ? "on" : ""} />)}
            {m.level === 3
              && <b className={`tile-branch ${m.branch ? "" : "pending"}`}>{m.branch ?? "?"}</b>}
          </span>
        )}
    </>
  );
}

export function FamilyBar({ board, levels }) {
  let o = countFamilies(board);
  return (
    <div className="fam-bar" aria-label="Modules par famille">
      {FAMILIES.map((a) => {
        let r = familyLevel(levels, a);
        return (
          <span
            key={`${a}-${r}`}
            className={`fam-count fam-${a} ${o[a] ? "on" : ""} ${r > 1 ? "upd" : ""}`}
            title={`${FAMILY_LABELS[a]} : ${o[a]} module(s)${r > 1 ? `, niveau ${r} (${familyBonusText(a)} par niveau)` : ""}`}
          >
            <span className="fam-glyph" aria-hidden="true">{FAMILY_GLYPHS[a]}</span>
            <span className="fam-name">{FAMILY_LABELS[a]}</span>
            <b className="num">{o[a]}</b>
            {r > 1 && <i className="fam-lv num">{"niv. "}{r}</i>}
          </span>
        );
      })}
    </div>
  );
}
