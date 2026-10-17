// Fiche d'un module (ordinateur).

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
import { ProductionDetail } from "./Production.jsx";

export function ModuleInspector(e) {
  let { slot, module } = e.selected;
  let a = MODULES[module.defId];
  let r = moduleView(module);
  let n = FUSED_MODULES[module.defId];
  let l = module.level < 3 ? e.freeUpgrade ? 0 : upgradeCost(module.level, e.goodies) : null;
  let d = (module.patch ?? 0) < MAX_PATCH
    ? e.freeUpgrade ? 0 : patchCost(module.patch ?? 0, e.goodies)
    : null;
  let u = (i) => i === 0 ? "gratuit" : `${i} ◆`;
  return (
    <div
      className={`inspector accent-${a.accent} ${module.fused ? "fused" : ""} ${module.level === 3 && !module.fused ? "lvl3" : ""}`}
    >
      <div className="insp-head">
        <span className="insp-icon"><ModuleIcon id={module.defId} size={34} /></span>
        <div>
          <h2>
            {module.fused ? FUSED_MODULES[module.defId].name : r.name}
            {" "}
            {module.fused && <span className="fused-tag">{patchVersion(module)}</span>}
            {r.branchName
              && <span className="branch-tag">{module.branch}{" · "}{r.branchName}</span>}
            {module.edition
              && (
                <span className={`ed-tag ed-tag-${module.edition}`}>
                  {EDITIONS[module.edition].name}
                </span>
              )}
          </h2>
          <span className="dim small">
            {"Emplacement "}
            {slot + 1}
            {", famille "}
            {FAMILY_LABELS[a.family]}
            {", "}
            {a.kind === "utility" ? "utilitaire" : "producteur"}
          </span>
        </div>
        <button className="icon-btn" aria-label="Fermer" onClick={e.onDeselect}>✕</button>
      </div>
      <ol className="levels">
        {[1, 2].map((i) => (
          <li
            key={i}
            className={!module.fused && i === module.level
              ? "current"
              : module.fused || i < module.level ? "past" : ""}
          >
            <span className="lvl">{"Niv. "}{i}</span>
            <span>{FX(a.describe(i))}</span>
          </li>
        ))}
        {module.level === 3 && module.branch && !module.fused
          ? (
            <li className="current branch-row">
              <span className="lvl">{"Niv. 3 "}{module.branch}</span>
              <span>
                <b>{BRANCHES[module.defId][module.branch].name}</b>
                {" : "}
                {FX(BRANCHES[module.defId][module.branch].text)}
              </span>
            </li>
          )
          : ["A", "B"].map((i) => (
            <li
              key={i}
              className={`branch-row ${module.fused ? "past" : module.level >= 2 ? "choice" : ""}`}
            >
              <span className="lvl">{"Niv. 3 "}{i}</span>
              <span>
                <b>{BRANCHES[module.defId][i].name}</b>
                {" : "}
                {FX(BRANCHES[module.defId][i].text)}
              </span>
            </li>
          ))}
        <li className={`fusion-row ${module.fused ? "current" : ""}`}>
          <span className="lvl">{module.fused ? patchVersion(module) : "Fusion"}</span>
          <span>
            <b>{n.name}</b>
            {" : "}
            {FX(n.text)}
            {module.fused && <span className="dim">{" "}{describePatch(module)}</span>}
          </span>
        </li>
      </ol>
      {module.edition
        && (
          <p className="insp-edition">
            <b>{EDITIONS[module.edition].name}</b>
            {" : "}
            {FX(EDITIONS[module.edition].text)}
            {module.edition === "ml" && module.learn
              ? ` Déjà appris : +${Math.round(module.learn * ML_GROWTH * 100)} %.`
              : ""}
          </p>
        )}
      {ProductionDetail(e, module, a)}
      <p className="flavor">{r.flavor}</p>
      <div className="insp-actions">
        {module.fused
          ? (
            <button
              className="primary data"
              disabled={e.locked || d === null || e.data < d}
              onClick={() => e.onUpgrade(slot)}
            >
              {d === null ? "Version finale" : `Passer en 2.${(module.patch ?? 0) + 1} (${u(d)})`}
            </button>
          )
          : module.level === 2 || module.level === 3 && !module.branch
            ? (
              <div className="branch-pick">
                {["A", "B"].map((i) => (
                  <button
                    key={i}
                    className="primary data branch-btn"
                    disabled={e.locked || module.level === 2 && (l === null || e.data < l)}
                    onClick={() => e.onUpgrade(slot, i)}
                    title={BRANCHES[module.defId][i].text}
                  >
                    <span className="branch-letter">{i}</span>
                    <span className="branch-name">{BRANCHES[module.defId][i].name}</span>
                    <span className="branch-cost num">
                      {module.level === 2 && l !== null ? u(l) : "gratuit"}
                    </span>
                  </button>
                ))}
                {module.level === 3
                  && e.fusionPartner >= 0
                  && (
                    <button
                      className="primary fuse"
                      disabled={e.locked}
                      onClick={() => e.onFuse(slot)}
                    >
                      Fusion…
                    </button>
                  )}
              </div>
            )
            : module.level === 3
              ? (
                <button
                  className="primary fuse"
                  disabled={e.locked || e.fusionPartner < 0}
                  onClick={() => e.onFuse(slot)}
                  title={e.fusionPartner < 0 ? `Il faut un 2e module ${a.name} niveau 3` : undefined}
                >
                  {e.fusionPartner >= 0 ? "Fusion…" : "Fusion : 2e niveau 3 requis"}
                </button>
              )
              : (
                <button
                  className="primary data"
                  disabled={e.locked || l === null || e.data < l}
                  onClick={() => e.onUpgrade(slot)}
                >
                  {l === null ? "Version finale" : `Améliorer (${u(l)})`}
                </button>
              )}
        <button className="ghost" disabled={e.locked} onClick={() => e.onSell(slot)}>
          Vendre +
          {e.sellValue ?? 0}
          {" $"}
        </button>
      </div>
      <p className="dim small">
        {module.level === 3 && !module.branch && !module.fused
          ? "Niveau 3 atteint grâce à un bonus : choisis sa spécialisation, gratuitement. Le choix est définitif."
          : module.level === 2 && !module.fused
            ? "Niveau 3 : choisis une spécialisation, A ou B. Le choix est définitif (une fusion le remplace)."
            : module.level === 3 && !module.fused
              ? `Deux modules ${a.name} niveau 3 fusionnent en ${n.name}, quelle que soit leur spécialisation, et libèrent un emplacement.`
              : module.fused
                ? `Les versions mineures coûtent ${PATCH_COSTS.map((i, c) => patchCost(c, e.goodies)).join(", ")} ◆.`
                : e.mobile
                  ? "Glisse le module pour le déplacer."
                  : "Glisse le module pour le déplacer."}
      </p>
    </div>
  );
}
