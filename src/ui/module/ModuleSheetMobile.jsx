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
import { ModuleIcon } from "../common/ModuleIcon.jsx";
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
      setSel(null);
    },
    [module.uid, module.level, module.branch],
  );
  let pick = !module.fused && (module.level === 2 || module.level === 3 && !module.branch);
  let cost = module.level === 2 ? l : 0;
  let short = module.level === 2 && l !== null && e.data < l;
  let B = BRANCHES[module.defId];
  let cur = module.fused
    ? { lv: patchVersion(module), name: n.name, text: n.text, more: describePatch(module) }
    : module.level === 3 && module.branch
      ? {
        lv: "Niveau 3 · " + module.branch,
        name: B[module.branch].name,
        text: B[module.branch].text,
      }
      : { lv: "Niveau " + module.level, name: null, text: a.describe(module.level) };
  let effL = (() => {
    let el = editionNote(module, 1);
    if (!el || a.kind !== "producer") {
      return null;
    }
    let C2 = productionBreakdown(e, module, a);
    let ft2 = C2.key && C2.N > 1 ? ` et la famille ${FAMILY_LABELS[a.family]} niv. ${C2.N}` : "";
    return C2.ctxDep
      ? `Avec ${el}, toute sa production est multipliée (détail plus bas).`
      : `En vrai, avec ${el}${ft2}, il produit ${fmtOutput(C2.tot)} à chaque activation.`;
  })();
  let card = (lv, name, text, cls, more) => (
    <div className={"mm-card " + (cls || "")}>
      <span className="mm-lv">{lv}</span>
      {name && <b className="mm-cname">{name}</b>}
      <p className="mm-ctext">
        {FX(text)}
        {more ? <span className="dim">{" " + more}</span> : null}
      </p>
    </div>
  );
  let next = null;
  if (!module.fused && module.level === 1) {
    next = (
      <section className="mm-sec">
        <h3>Prochaine amélioration</h3>
        {card("Niveau 2", null, a.describe(2), "next")}
        <h3>Au niveau 3, tu choisiras une spécialisation</h3>
        <div className="mm-two">
          {["A", "B"].map((i) => card("Spécialisation " + i, B[i].name, B[i].text, "later"))}
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
          {" Le choix est définitif (seule une fusion le remplace)."}
        </p>
        <h3>Ensuite : la fusion</h3>
        {card("Fusion", n.name, n.text, "later")}
        <p className="mm-note">
          {`Deux ${a.name} niveau 3 fusionnent en ${n.name}, quelle que soit leur spécialisation.`}
        </p>
      </section>
    );
  } else if (!module.fused && module.level === 3) {
    next = (
      <section className="mm-sec">
        <h3>Prochaine étape : la fusion</h3>
        {card("Fusion", n.name, n.text, "next")}
        <p className="mm-note">
          {e.fusionPartner >= 0
            ? `Tu as un 2e ${a.name} niveau 3 : vous pouvez fusionner. Ça libère une case.`
            : `Il te faut un 2e ${a.name} niveau 3 (n’importe quelle spécialisation) pour fusionner.`}
        </p>
      </section>
    );
  } else if (module.fused) {
    next = (
      <section className="mm-sec">
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
    main = (
      <button
        className="primary fuse mm-go"
        disabled={e.locked || e.fusionPartner < 0}
        onClick={() => e.onFuse(slot)}
      >
        {e.fusionPartner >= 0 ? "Fusionner…" : "Fusion : 2e niveau 3 requis"}
      </button>
    );
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
  return (
    <div
      className={`module-sheet mm accent-${a.accent}`}
      role="dialog"
      aria-modal="true"
      aria-label={"Fiche de " + r.name}
    >
      <header className="mm-head">
        <span className="insp-icon mm-icon"><ModuleIcon id={module.defId} size={40} /></span>
        <div className="mm-title">
          <h2>{module.fused ? n.name : r.name}</h2>
          <span className="mm-sub">
            {`Famille ${FAMILY_LABELS[a.family]} · ${a.kind === "utility" ? "utilitaire" : "producteur"} · case ${slot + 1}`}
          </span>
          <span className="mm-tags">
            {module.fused && <span className="fused-tag">{patchVersion(module)}</span>}
            {r.branchName
              && <span className="branch-tag">{module.branch + " · " + r.branchName}</span>}
            {module.edition
              && (
                <span className={`ed-tag ed-tag-${module.edition}`}>
                  {EDITIONS[module.edition].name}
                </span>
              )}
          </span>
        </div>
        <span className="mm-wallet num">{e.data}{" ◆"}</span>
      </header>
      <div className="mm-body">
        <section className="mm-sec">
          <h3>Ce qu’il fait maintenant</h3>
          {card(cur.lv, cur.name, cur.text, "now", cur.more)}
          {effL && <p className="mm-eff">{FX(effL)}</p>}
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
        {r.flavor && <p className="flavor mm-flavor">{r.flavor}</p>}
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
                    <span className="mm-ctext">{FX(B[i].text)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        {pick
          && module.level === 3
          && e.fusionPartner >= 0
          && (
            <button
              className="primary fuse mm-alt"
              disabled={e.locked}
              onClick={() => e.onFuse(slot)}
            >
              Ou fusionner directement…
            </button>
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
  );
}
