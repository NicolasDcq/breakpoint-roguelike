// Détail de la production d'un module.

import { EDITIONS, ML_GROWTH, editionMultiplier } from "../../engine/editions.js";
import {
  FAMILY_LABELS,
  familyMultiplier,
  networkScaleBonus,
  opsRetriggerScale,
} from "../../engine/families.js";
import { diagonals, linkedNeighbors } from "../../engine/grid.js";
import { countFamilies, moduleView, patchVersion } from "../../engine/moduleView.js";
import { effectiveFamilyLevel } from "../../engine/plugins.js";
import { round2 } from "../../engine/util.js";
import { FX } from "../fx.jsx";

export function productionBreakdown(e, o, a) {
  let fam = a.family;
  let ltsOn = (e.jokers || []).some((j) => j.defId === "lts");
  let N = effectiveFamilyLevel(e.familyLevels || {}, fam, ltsOn);
  let d = moduleView(o) || a;
  let pr2 = typeof d.produce === "function" ? d.produce : null;
  let ctxDep = false;
  let base = {};
  let B = e.board;
  let sl = e.selected ? e.selected.slot : -1;
  if (pr2) {
    if (Array.isArray(B) && sl >= 0) {
      let fc = countFamilies(B);
      let emp = (e.unlocked || []).filter((x, i) => x && !B[i]).length;
      let cx = {
        slot: sl,
        level: o.level,
        module: o,
        board: B,
        neighbors: () => linkedNeighbors(B, sl),
        diagonals: () => diagonals(sl).filter((i) => B[i] != null),
        dataStock: () => e.data ?? 0,
        budget: () => e.budget ?? 0,
        emptyOpenSlots: () => emp,
        activationCount: () => 0,
        familyCount: (f2) => fc[f2] ?? 0,
        consumeData: (n) => (e.data ?? 0) >= n,
        consumeBudget: (n) => (e.budget ?? 0) >= n,
        armBoost: () => { },
        armQueue: () => { },
        retrigger: () => { },
        retryBonus: 0,
        isRetrigger: false,
        retriggerCount: () => 0,
        hasPlugin: (id) => (e.jokers || []).some((j) => j.defId === id),
      };
      try {
        base = pr2(cx) || {};
      } catch (_2) {
        ctxDep = true;
        base = {};
      }
    } else {
      ctxDep = /\be\.(?!level\b)\w+/.test(String(pr2));
      if (!ctxDep) {
        try {
          base = pr2({ level: o.level }) || {};
        } catch (_2) {
          base = {};
        }
      }
    }
  }
  let pm = o.fused ? 1 + 0.5 * (o.patch ?? 0) : 1;
  let em = editionMultiplier(o) * pm;
  let ed = { ...base };
  if (em !== 1) {
    for (let k of ["compute", "data", "budget"]) {
      if (ed[k]) {
        ed[k] = Math.round(ed[k] * em);
      }
    }
  }
  if (em !== 1 && ed.scale) {
    ed.scale = round2(ed.scale * em);
  }
  let key = fam === "calcul" ? "compute" : fam === "stockage" ? "data" : null;
  let tot = { ...ed };
  if (key && tot[key]) {
    tot[key] = Math.round(tot[key] * familyMultiplier(N));
  }
  return { N, ctxDep, base, em, pm, ed, tot, key, d };
}

export function fmtOutput(x) {
  let cm = (v) => String(v).replace(".", ",");
  let unit = { compute: "Compute", data: "Data", scale: "Scale", budget: "$" };
  return ["compute", "data", "scale", "budget"].filter((k) => x[k] > 0).map((k) => `+${cm(x[k])} ${unit[k]}`).join(" · ");
}

export function editionNote(o, sh) {
  if (!o.edition) {
    return null;
  }
  let m = editionMultiplier(o);
  if (m === 1) {
    return null;
  }
  let cm = (v) => String(v).replace(".", ",");
  return o.edition === "ml"
    ? `${EDITIONS.ml.name} +${Math.round((o.learn ?? 0) * ML_GROWTH * 100)} %` + (sh ? "" : ` (×${cm(+m.toFixed(2))})`)
    : `${EDITIONS[o.edition].name} (×${cm(m)})`;
}

export function ProductionDetail(e, o, a) {
  if (!a || a.kind !== "producer") {
    return null;
  }
  let L = [];
  let fam = a.family;
  let cm = (x) => String(x).replace(".", ",");
  let unit = { compute: "Compute", data: "Data", scale: "Scale", budget: "$" };
  let C2 = productionBreakdown(e, o, a);
  let N = C2.N;
  let ctxDep = C2.ctxDep;
  let base = C2.base;
  L.push([
    o.fused
      ? "Base · " + (C2.d && C2.d.name || "fusion")
      : o.level === 3 && o.branch ? "Base · niv. 3 " + o.branch : "Base · niv. " + o.level,
    ctxDep ? "dépend du plateau" : fmtOutput(base) || "aucune",
    null,
  ]);
  if (C2.pm !== 1) {
    L.push(["Version " + patchVersion(o), `production ×${cm(C2.pm)}`, null]);
  }
  let edl = editionNote(o);
  if (edl) {
    L.push([
      "Édition",
      ctxDep ? edl + " sur toute la production" : edl,
      ctxDep ? null : fmtOutput(C2.ed),
    ]);
  } else if (o.edition === "ml") {
    L.push([
      "Édition",
      `${EDITIONS.ml.name} : rien appris pour l’instant, +10 % après chaque déploiement`,
      null,
    ]);
  }
  let key = C2.key;
  if (key) {
    let v = C2.ed[key] || 0;
    let mult = familyMultiplier(N);
    let d = Math.round(v * mult) - v;
    let nm = unit[key];
    if (ctxDep) {
      L.push([
        `Famille ${FAMILY_LABELS[fam]} niv. ${N}`,
        `×${cm(mult.toFixed(1))} sur le ${nm} du module`,
        null,
      ]);
    } else {
      L.push([
        `Famille ${FAMILY_LABELS[fam]} niv. ${N}`,
        N > 1 && v
          ? `×${cm(mult.toFixed(1))} sur le ${nm} du module`
          : "niveau de départ, pas de bonus",
        N > 1 && v ? "+" + d : "0",
      ]);
    }
  }
  if (fam === "reseau") {
    let q = networkScaleBonus(N, 1);
    L.push([
      `Famille Réseau niv. ${N}`,
      `+${cm(q)} Scale par module Réseau du plateau`,
      q ? "+" + cm(q) : "0",
    ]);
  }
  if (fam === "ops") {
    let c = opsRetriggerScale(N);
    L.push([`Famille Ops niv. ${N}`, "Scale à chaque réactivation", c ? "+" + cm(c) : "0"]);
  }
  if (!ctxDep && (edl || C2.pm !== 1 || key && N > 1)) {
    L.push(["Total du module", null, fmtOutput(C2.tot) || "0", 1]);
  }
  return (
    <section
      className="prod"
      style={{
        margin: "10px 0",
        padding: "8px 10px",
        border: "2px solid #05070f",
        borderRadius: 8,
        background: "rgba(255,255,255,.03)",
      }}
    >
      <b style={{ fontSize: 13 }}>Production de ce module</b>
      <ul style={{ listStyle: "none", margin: "6px 0 0", padding: 0 }}>
        {L.map((r, i) => (
          <li
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: 8,
              fontSize: r[3] ? 14 : 12.5,
              padding: r[3] ? "7px 0 2px" : "3px 0",
              borderTop: r[3] ? "2px solid #2a3654" : "none",
              marginTop: r[3] ? 4 : 0,
            }}
          >
            <span style={r[3] ? { fontWeight: 700 } : undefined}>
              {r[0]}
              {r[1] ? <span className="dim small">{" — "}{FX(r[1])}</span> : null}
            </span>
            {r[2] ? <b style={{ whiteSpace: "nowrap" }}>{FX(r[2])}</b> : null}
          </li>
        ))}
      </ul>
      <p className="dim small" style={{ margin: "6px 0 0" }}>
        {e.mobile
          ? "Chaque Plugin ajoute son propre bonus au moment du déploiement."
          : "Chaque Plugin ajoute son propre bonus : voir le journal d’exécution."}
      </p>
    </section>
  );
}
