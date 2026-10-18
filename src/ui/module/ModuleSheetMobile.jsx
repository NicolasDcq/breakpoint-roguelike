// Fiche d'un module en écran plein (téléphone).

import * as React from "react";
import { sfx } from "../../audio/sfx.js";
import { EDITIONS, ML_GROWTH } from "../../engine/editions.js";
import { FAMILY_LABELS } from "../../engine/families.js";
import { BRANCHES, FUSED_MODULES } from "../../engine/fusedModules.js";
import { patchCost, upgradeCost } from "../../engine/goodies.js";
import { MODULES } from "../../engine/modules.js";
import {
  MAX_PATCH,
  PATCH_COSTS,
  describePatch,
  moduleView,
  patchVersion,
} from "../../engine/moduleView.js";
import { FamilyBand, FamilyChips } from "../fusion/Fusion.jsx";
import { effectLines } from "../../engine/effectLines.js";
import { EffectLines } from "./EffectLines.jsx";
import { FX } from "../fx.jsx";
import {
  ProductionDetail,
  editionNote,
  fmtOutput,
  productionBreakdown,
} from "./Production.jsx";

export function ModuleSheetMobile(e) {
  let RR = React;
  let { slot, module } = e.selected;
  let a = MODULES[module.defId];
  let r = moduleView(module);
  let n = FUSED_MODULES[module.defId];
  let l = module.level < 3 ? e.freeUpgrade ? 0 : upgradeCost(module.level, e.goodies) : null;
  let d = (module.patch ?? 0) < MAX_PATCH
    ? e.freeUpgrade ? 0 : patchCost(module.patch ?? 0, e.goodies)
    : null;
  let u = (i) => i === 0 ? "gratuit" : `${i} ◆`;
  let [sel, setSel] = RR.useState(null);
  RR.useEffect(
    () => {
      if (!e.desktop) {
        return undefined;
      }
      let onKey = (event) => event.key === "Escape" && e.onDeselect();
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    },
    [e.desktop, e.onDeselect],
  );
  RR.useEffect(
    () => {
      setSel(null);
    },
    [module.uid, module.level, module.branch],
  );
  let pick = !module.fused && (module.level === 2 || module.level === 3 && !module.branch);
  let cost = module.level === 2 ? l : 0;
  let short = module.level === 2 && l !== null && e.data < l;
  let B = BRANCHES[module.defId];
  let cur = r.hybrid
    ? { lv: `Hybride · ${patchVersion(module)}`, name: r.baseName, more: describePatch(module) }
    : module.fused
    ? { lv: patchVersion(module), name: n.name, more: describePatch(module) }
    : module.level === 3 && module.branch
      ? { lv: "Niveau 3 · " + module.branch, name: B[module.branch].name }
      : { lv: "Niveau " + module.level, name: null };
  let board = { board: e.board, unlocked: e.unlocked, data: e.data, budget: e.budget };
  // « En ce moment » : ce que le module produit vraiment sur ce plateau (avant les Plugins).
  let nowText = (() => {
    if (r.kind === "producer") {
      let C2 = productionBreakdown(e, module, a);
      if (C2.ctxDep || !fmtOutput(C2.tot)) {
        return null;
      }
      // Rien à apprendre si le total est déjà écrit tel quel dans les lignes.
      if (fmtOutput(C2.tot) === fmtOutput(C2.base) && !effectLines(module).some((entry) => entry.here)) {
        return null;
      }
      let el = editionNote(module, 1);
      let raised = C2.familyKeys.filter((entry) => entry.level > 1).map((entry) => `famille ${FAMILY_LABELS[entry.family]} niv. ${entry.level}`);
      let extra = [el, ...raised].filter(Boolean);
      return { value: `${fmtOutput(C2.tot)} à chaque activation`, note: extra.length ? `Avec ${extra.join(" et ")}. Avant les Plugins et les boosts.` : "Avant les Plugins et les boosts." };
    }
    return null;
  })();
  // Carte d'effets : lignes pour un module (réel ou à venir).
  let card = (lv, name, target, cls, more, live = false) => (
    <div className={"mm-card " + (cls || "")}>
      <span className="mm-lv">{lv}</span>
      {name && <b className="mm-cname">{name}</b>}
      <EffectLines module={target} state={live ? board : null} slot={live ? slot : null} numbered={live} />
      {more ? <p className="mm-ctext dim">{more}</p> : null}
    </div>
  );
  let fusionNote = `Au niveau 3, fusionne-le avec le bouton Fusion (${e.fusionCost ?? 12} ◆, puis plus cher à chaque fusion) : avec un 2e ${a.name}, il devient ${n.name} ; avec un autre module niveau 3, un hybride qui garde les deux effets et les deux familles.`;
  let next = null;
  if (!module.fused && module.level === 1) {
    next = (
      <section className="mm-sec">
        <h3>Prochaine amélioration</h3>
        {card("Niveau 2", null, { defId: module.defId, level: 2 }, "next")}
        <h3>Au niveau 3, tu choisiras une spécialisation</h3>
        <div className="mm-two">
          {["A", "B"].map((i) => <React.Fragment key={i}>{card("Spécialisation " + i, B[i].name, { defId: module.defId, level: 3, branch: i }, "later")}</React.Fragment>)}
        </div>
      </section>
    );
  } else if (pick) {
    next = (
      <section className="mm-sec">
        <p className="mm-note">
          {module.level === 3
            ? "Niveau 3 atteint grâce à un bonus : choisis sa spécialisation, gratuitement."
            : "Le niveau 3 se joue en choisissant une spécialisation, A ou B. Compare-les en bas de l’écran."}
          {" Le choix est définitif ; une fusion hybride la garde."}
        </p>
        <p className="mm-note">{fusionNote}</p>
      </section>
    );
  } else if (!module.fused && module.level === 3) {
    next = (
      <section className="mm-sec">
        <h3>Prochaine étape : la fusion</h3>
        <p className="mm-note">{fusionNote.replace("Au niveau 3, fusionne", "Fusionne")}</p>
      </section>
    );
  } else if (module.fused) {
    next = (
      <section className="mm-sec">
        {r.hybrid && (
          <p className="mm-note">
            {"Fusion de "}
            {r.parents.map((parent) => `${MODULES[parent.defId].name}${parent.branchName ? ` (${parent.branchName})` : ""}`).join(" et ")}
            {". Il compte comme "}
            {r.families.map((family) => FAMILY_LABELS[family]).join(" et comme ")}
            {"."}
          </p>
        )}
        <p className="mm-note">
          {d === null
            ? "Version finale atteinte."
            : `Chaque version mineure renforce le module. Coûts : ${PATCH_COSTS.map((i, c) => patchCost(c, e.goodies)).join(", ")} ◆.`}
        </p>
      </section>
    );
  }
  let main;
  if (module.fused) {
    main = (
      <button
        className="primary data mm-go"
        disabled={e.locked || d === null || e.data < d}
        onClick={() => e.onUpgrade(slot)}
      >
        {d === null ? "Version finale" : `Passer en 2.${(module.patch ?? 0) + 1} · ${u(d)}`}
      </button>
    );
  } else if (pick) {
    main = (
      <button
        className="primary data mm-go"
        disabled={e.locked || !sel || l === null && module.level === 2 || short}
        onClick={() => {
          if (sel) {
            e.onUpgrade(slot, sel);
          }
        }}
      >
        {short
          ? `Il te manque ${l - e.data} ◆`
          : sel ? `Choisir ${sel} · ${B[sel].name} · ${u(cost)}` : "Touche une spécialisation"}
      </button>
    );
  } else if (module.level === 3) {
    main = null;
  } else {
    main = (
      <button
        className="primary data mm-go"
        disabled={e.locked || l === null || e.data < l}
        onClick={() => e.onUpgrade(slot)}
      >
        {l === null
          ? "Version finale"
          : e.data < l
            ? `Améliorer · ${u(l)} (il te manque ${l - e.data} ◆)`
            : `Améliorer au niveau ${module.level + 1} · ${u(l)}`}
      </button>
    );
  }
  let where = slot >= 100 ? `tiroir ${slot - 99}` : `case ${slot + 1}`;
  return (
    <>
    <div className="mm-backdrop" aria-hidden="true" onClick={e.onDeselect} />
    <div
      className={`module-sheet mm ${e.desktop ? "mm-desk" : ""} accent-${a.accent}`}
      role="dialog"
      aria-modal="true"
      aria-label={"Fiche de " + r.name}
    >
      <span className="mm-handle" aria-hidden="true" />
      <header className="mm-head">
        <span className={`mm-tile accent-${a.accent}`} aria-hidden="true">
          <FamilyBand module={module} size={18} className="mm-tile-band" />
          <span className="mm-tile-name">{r.baseName ?? r.name}</span>
          <span className="mm-tile-lvl num">
            {module.fused ? patchVersion(module) : `${"■".repeat(module.level)}${"□".repeat(3 - module.level)}`}
          </span>
        </span>
        <div className="mm-title">
          <h2>{r.name}</h2>
          <span className="mm-tags">
            <FamilyChips families={r.families} />
            {module.fused && <span className="fused-tag">{r.hybrid ? "HYBRIDE" : patchVersion(module)}</span>}
            {r.branchName
              && <span className="branch-tag">{module.branch + " · " + r.branchName}</span>}
            {module.edition
              && (
                <span className={`ed-tag ed-tag-${module.edition}`}>
                  {EDITIONS[module.edition].name}
                </span>
              )}
          </span>
          <span className="mm-sub">
            {`${r.kind === "utility" ? "Utilitaire" : "Producteur"} · ${where}`}
          </span>
          {r.flavor && <span className="mm-flavor">{r.flavor}</span>}
        </div>
        <span className="mm-wallet num">{e.data}{" ◆"}</span>
      </header>
      <div className="mm-body">
        <section className="mm-sec">
          <h3>Ce qu’il fait maintenant</h3>
          {nowText && (
            <div className="mm-now">
              <span className="mm-now-k">En ce moment, sur ton plateau</span>
              <span className="mm-now-v">{FX(nowText.value)}</span>
              <small>{nowText.note}</small>
            </div>
          )}
          {card(cur.lv, cur.name, module, "now", cur.more, true)}
        </section>
        {module.edition
          && (
            <p className="insp-edition mm-ed">
              <b>{EDITIONS[module.edition].name}</b>
              {" : "}
              {FX(EDITIONS[module.edition].text)}
              {module.edition === "ml" && module.learn
                ? ` Déjà appris : +${Math.round(module.learn * ML_GROWTH * 100)} %.`
                : ""}
            </p>
          )}
        {next}
        {ProductionDetail(e, module, a)}
      </div>
      <footer className="mm-foot">
        {pick
          && (
            <div className="mm-spec">
              <span className="mm-spec-t">{"Spécialisation · niveau 3 · "}{u(cost)}</span>
              <div className="mm-two">
                {["A", "B"].map((i) => (
                  <button
                    key={i}
                    className={"mm-pick" + (sel === i ? " sel" : "")}
                    aria-pressed={sel === i}
                    disabled={e.locked}
                    onClick={() => {
                      sfx.click();
                      setSel(i);
                    }}
                  >
                    <span className="mm-letter">{i}</span>
                    <b className="mm-cname">{B[i].name}</b>
                    <EffectLines module={{ defId: module.defId, level: 3, branch: i }} compact />
                  </button>
                ))}
              </div>
            </div>
          )}
        {main}
        <div className="mm-row">
          <button className="ghost mm-sell" disabled={e.locked} onClick={() => e.onSell(slot)}>
            Vendre +
            {e.sellValue ?? 0}
            {" $"}
          </button>
          <button className="mm-back" onClick={e.onDeselect}>Retour au plateau</button>
        </div>
      </footer>
    </div>
    </>
  );
}
