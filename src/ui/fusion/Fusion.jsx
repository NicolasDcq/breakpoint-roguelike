// Atelier de fusion : deux cases en haut (les composants choisis), le résultat
// en dessous. Toucher une case du haut ouvre la liste des modules niveau 3
// fusionnables (plateau et tiroir). Deux modules identiques donnent la 2.0,
// deux modules différents donnent un hybride qui garde les deux effets.

import { useState } from "react";
import { EDITIONS } from "../../engine/editions.js";
import { FAMILY_LABELS } from "../../engine/families.js";
import { FUSION_COST_STEP, fusionCost } from "../../engine/hybrids.js";
import { MODULES } from "../../engine/modules.js";
import { moduleView, patchVersion } from "../../engine/moduleView.js";
import { fusionCandidates, fusionCount, fusionResult } from "../../engine/reducer.js";
import { Modal } from "../common/Modal.jsx";
import { ModuleIcon } from "../common/ModuleIcon.jsx";
import { FX } from "../fx.jsx";
import { EffectLines } from "../module/EffectLines.jsx";

export const FuseIcon = ({ size = 22 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M6 3v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3M12 14v7M9 18l3 3 3-3" />
  </svg>
);

export const FAMILY_ACCENT = { calcul: "cyan", stockage: "violet", reseau: "pink", business: "amber", ops: "green" };

const moduleAt = (run, slot) => (slot >= 100 ? (run.drawer ?? [])[slot - 100] : run.board[slot]) ?? null;

export const placeLabel = (slot) => (slot >= 100 ? `Tiroir ${slot - 99}` : `Empl. ${slot + 1}`);

const levelText = (module) => `${"■".repeat(module.level)}${"□".repeat(3 - module.level)}${module.branch ? ` ${module.branch}` : ""}`;

// Bandeau de couleur d'un module : une couleur, ou deux pour un hybride.
export function FamilyBand({ module, size = 12, className = "" }) {
  let families = moduleView(module).families;
  if (families.length > 1) {
    return (
      <span className={`fu-band dual ${className}`}>
        {families.map((family) => <i key={family} className={`accent-${FAMILY_ACCENT[family]}`} />)}
      </span>
    );
  }
  return (
    <span className={`fu-band accent-${MODULES[module.defId].accent} ${className}`}>
      <ModuleIcon id={module.defId} size={size} />
    </span>
  );
}

export function FamilyChips({ families }) {
  return (
    <span className="fu-fams">
      {families.map((family) => (
        <span key={family} className={`fu-fam accent-${FAMILY_ACCENT[family]}`}>{FAMILY_LABELS[family]}</span>
      ))}
    </span>
  );
}

function PickedSlot({ run, slot, index, onOpen, disabled }) {
  let module = slot == null ? null : moduleAt(run, slot);
  if (!module) {
    return (
      <button className="fu-pick empty" onClick={onOpen} disabled={disabled}>
        <span className="fu-pick-plus">+</span>
        <b>{`Composant ${index + 1}`}</b>
        <small>Touche pour choisir</small>
      </button>
    );
  }
  let def = MODULES[module.defId];
  let view = moduleView(module);
  return (
    <button className={`fu-pick accent-${def.accent}`} onClick={onOpen} disabled={disabled}>
      <span className="fu-pick-head num">
        <span>{placeLabel(slot)}</span>
        <span>{levelText(module)}</span>
      </span>
      {module.edition && <span className="fu-ed">{EDITIONS[module.edition].tag}</span>}
      <span className="fu-pick-name">{def.name}</span>
      {view.branchName && <span className="fu-pick-branch">{view.branchName}</span>}
      <small>Toucher pour changer</small>
    </button>
  );
}

function ResultBox({ result }) {
  if (!result) {
    return (
      <div className="fu-outcome empty">
        <span className="fu-q">?</span>
        <b>Le module fusionné apparaît ici</b>
        <small>Nom, familles et effets, avec tes spécialisations.</small>
      </div>
    );
  }
  let view = moduleView(result);
  return (
    <div className="fu-outcome">
      <FamilyBand module={result} size={16} className="fu-outcome-band" />
      <div className="fu-outcome-body">
        <div className="fu-outcome-title">
          <span className={view.hybrid ? "fu-tag" : "fu-v2 num"}>{view.hybrid ? "HYBRIDE" : "2.0"}</span>
          <span className="fu-outcome-name">{view.name}</span>
        </div>
        <div className="fu-outcome-meta">
          <FamilyChips families={view.families} />
          {view.hybrid && (
            <span className="fu-outcome-branches">
              {view.parents.map((parent) => parent.branchName ?? MODULES[parent.defId].name).join(" · ")}
            </span>
          )}
        </div>
        <EffectLines module={result} numbered />
      </div>
    </div>
  );
}

function Picker({ run, index, other, current, onPick, onCancel }) {
  let candidates = fusionCandidates(run);
  let [chosen, setChosen] = useState(current ?? null);
  let groups = [
    { label: "Plateau", slots: candidates.filter((slot) => slot < 100) },
    { label: "Tiroir", slots: candidates.filter((slot) => slot >= 100) },
  ].filter((group) => group.slots.length);
  let chosenModule = chosen == null ? null : moduleAt(run, chosen);
  let chosenView = chosenModule ? moduleView(chosenModule) : null;
  return (
    <>
      <div className="fu-head">
        <div>
          <h2 className="fu-title">{`Composant ${index + 1}`}</h2>
          <span className="dim small">
            {candidates.length}
            {" module"}
            {candidates.length > 1 ? "s" : ""}
            {" niveau 3 fusionnable"}
            {candidates.length > 1 ? "s" : ""}
          </span>
        </div>
      </div>
      <div className="fu-list">
        {groups.map((group) => (
          <div key={group.label} className="fu-card fu-group">
            <span className="fu-group-label">{group.label}</span>
            <div className="fu-grid">
              {group.slots.map((slot) => {
                let module = moduleAt(run, slot);
                let def = MODULES[module.defId];
                let taken = slot === other;
                return (
                  <button
                    key={slot}
                    className={`fu-mini accent-${def.accent} ${chosen === slot ? "sel" : ""} ${taken ? "dim" : ""}`}
                    disabled={taken}
                    aria-pressed={chosen === slot}
                    onClick={() => setChosen(slot)}
                  >
                    <span className="fu-slot num">{slot >= 100 ? `T${slot - 99}` : slot + 1}</span>
                    {module.edition && <span className="fu-ed">{EDITIONS[module.edition].tag}</span>}
                    <span className="fu-band"><ModuleIcon id={module.defId} size={12} /></span>
                    <span className="fu-name">{def.name}</span>
                    <span className="fu-lvl num">{taken ? "déjà pris" : levelText(module)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {chosenView && (
          <div className="fu-card fu-detail">
            <div className="fu-detail-head">
              <b>{MODULES[chosenModule.defId].name}</b>
              {chosenView.branchName && <span className="fu-pick-branch">{chosenView.branchName}</span>}
            </div>
            <FamilyChips families={chosenView.families} />
            <EffectLines module={chosenModule} state={run} slot={chosen < 100 ? chosen : null} />
            {chosenModule.edition && (
              <p className="fu-text dim">
                {`Édition ${EDITIONS[chosenModule.edition].name} : `}
                {FX(EDITIONS[chosenModule.edition].text)}
              </p>
            )}
          </div>
        )}
      </div>
      <div className="fu-foot">
        <button className="fu-cancel" onClick={onCancel}>Annuler</button>
        <button className="deploy" disabled={chosen == null} onClick={() => onPick(chosen)}>
          {chosenModule ? `Choisir : ${MODULES[chosenModule.defId].name}` : "Choisir"}
        </button>
      </div>
    </>
  );
}

function FusionDone({ run, done, remaining, onNext, onClose }) {
  let module = run.board[done.slot] ?? (run.drawer ?? [])[done.slot - 100];
  if (!module) {
    return null;
  }
  let view = moduleView(module);
  return (
    <Modal className="fusion-modal fusion-done" onClose={onClose}>
      <span className="dim small">{done.sources}</span>
      <h2 className="fu-title gold">Fusion réussie</h2>
      <div className="fu-reveal">
        <span className="fu-rays" aria-hidden="true" />
        <div className={`fu-result big accent-${MODULES[module.defId].accent}`}>
          <span className={view.hybrid ? "fu-tag" : "fu-v2 num"}>{view.hybrid ? "HYBRIDE" : patchVersion(module)}</span>
          <FamilyBand module={module} size={18} />
          <span className="fu-name">{view.name}</span>
          {view.hybrid && (
            <span className="fu-outcome-branches">
              {view.parents.map((parent) => parent.branchName ?? MODULES[parent.defId].name).join(" · ")}
            </span>
          )}
          {module.edition && <span className="fu-ed">{EDITIONS[module.edition].tag}</span>}
        </div>
      </div>
      <div className="fu-card">
        <FamilyChips families={view.families} />
        <EffectLines module={module} state={run} slot={done.slot < 100 ? done.slot : null} numbered />
        <p className="fu-text dim">
          {`Installé en ${placeLabel(done.slot).toLowerCase()}, ${placeLabel(done.freed).toLowerCase()} est libéré`}
          {module.edition ? `, édition ${EDITIONS[module.edition].name} gardée` : ""}
          {". "}
          {view.families.length > 1
            ? `Il compte comme ${view.families.map((family) => FAMILY_LABELS[family]).join(" et comme ")}. `
            : ""}
          Monte ensuite en 2.1, 2.2, 2.3 avec de la Data.
        </p>
      </div>
      <div className="fu-foot">
        {remaining > 0 && (
          <button className="fu-next" onClick={onNext}>
            Fusion suivante
            <small className="num">
              {remaining}
              {" restante"}
              {remaining > 1 ? "s" : ""}
            </small>
          </button>
        )}
        <button className="deploy" onClick={onClose}>Continuer</button>
      </div>
    </Modal>
  );
}

export function FusionModal({ run, locked, mobile, onFuse, onClose }) {
  let [picks, setPicks] = useState([null, null]);
  let [picking, setPicking] = useState(null);
  let [editionFrom, setEditionFrom] = useState("slot");
  let [keepIndex, setKeepIndex] = useState(0);
  let [done, setDone] = useState(null);
  let count = fusionCount(run);
  let candidates = fusionCandidates(run);

  if (done) {
    return (
      <FusionDone
        run={run}
        done={done}
        remaining={count}
        onClose={onClose}
        onNext={() => {
          setDone(null);
          setPicks([null, null]);
          setKeepIndex(0);
          setEditionFrom("slot");
        }}
      />
    );
  }

  if (picking != null) {
    return (
      <Modal className="fusion-modal fusion-picker" onClose={() => setPicking(null)}>
        <Picker
          run={run}
          index={picking}
          other={picks[1 - picking]}
          current={picks[picking]}
          onCancel={() => setPicking(null)}
          onPick={(slot) => {
            let next = [...picks];
            next[picking] = slot;
            setPicks(next);
            setPicking(null);
            setEditionFrom("slot");
          }}
        />
      </Modal>
    );
  }

  let [first, second] = picks.map((slot) => (slot == null ? null : moduleAt(run, slot)));
  let ready = !!first && !!second;
  let keepSlot = picks[keepIndex];
  let otherSlot = picks[1 - keepIndex];
  let keepModule = ready ? moduleAt(run, keepSlot) : null;
  let otherModule = ready ? moduleAt(run, otherSlot) : null;
  let bothEditions = ready && first.edition && second.edition && first.edition !== second.edition;
  // L'édition choisie est celle du composant 1 ou 2 ; le moteur la lit par rapport à la case gardée.
  let editionOwner = editionFrom === "slot" ? 0 : 1;
  let editionAction = bothEditions ? (editionOwner === keepIndex ? "slot" : "partner") : undefined;
  let result = ready ? fusionResult(keepModule, otherModule, editionAction) : null;
  let cost = fusionCost(run);
  let enough = run.data >= cost;

  return (
    <Modal className="fusion-modal" onClose={onClose}>
      <div className="fu-head">
        <div>
          <h2 className="fu-title">Fusion</h2>
          <span className="dim small">2 modules niveau 3 ➜ 1 module fusionné, une case est libérée.</span>
        </div>
        {count > 0 && (
          <span className="fu-count num">
            {count}
            {" prête"}
            {count > 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div className="fu-list">
        {candidates.length < 2 && (
          <p className="fu-empty">
            Il faut deux modules niveau 3 (sur le plateau ou dans le tiroir), de n’importe quel type.
          </p>
        )}
        <div className="fu-picks">
          <PickedSlot run={run} slot={picks[0]} index={0} disabled={candidates.length < 2} onOpen={() => setPicking(0)} />
          <span className="fu-plus">+</span>
          <PickedSlot run={run} slot={picks[1]} index={1} disabled={candidates.length < 2} onOpen={() => setPicking(1)} />
        </div>
        <div className="fu-down" aria-hidden="true">▼</div>
        <ResultBox result={result} />
        {bothEditions && (
          <div className="fu-card fu-editions">
            <div className="fu-soon-head">
              <span>Édition à garder</span>
              <span className="dim small">les deux en ont une</span>
            </div>
            <div className="fu-edition-row">
              {[first, second].map((module, index) => (
                <button
                  key={index}
                  className={`fu-edition ${editionOwner === index ? "on" : ""}`}
                  aria-pressed={editionOwner === index}
                  onClick={() => setEditionFrom(index === 0 ? "slot" : "partner")}
                >
                  <b>{EDITIONS[module.edition].name}</b>
                  <span>{FX(EDITIONS[module.edition].text)}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {ready && (
          <div className="fu-card fu-settings">
            <div className="fu-keep">
              <span>Garder en</span>
              <div className="fu-seg" role="radiogroup" aria-label="Case du module fusionné">
                {picks.map((slot, index) => (
                  <button
                    key={slot}
                    role="radio"
                    aria-checked={keepIndex === index}
                    className={keepIndex === index ? "on" : ""}
                    onClick={() => setKeepIndex(index)}
                  >
                    <span className="num">{placeLabel(slot)}</span>
                  </button>
                ))}
              </div>
            </div>
            <span className={`fu-cost num ${enough ? "" : "short"}`}>
              {`${cost} ◆ · stock ${run.data} ➜ ${run.data - cost}`}
            </span>
            <span className="fu-cost-next dim small">{`La fusion suivante coûtera ${cost + FUSION_COST_STEP} ◆.`}</span>
          </div>
        )}
      </div>
      <div className="fu-foot">
        <button className="fu-back" onClick={onClose}>
          {mobile ? "Retour au plateau" : "Fermer"}
        </button>
        <button
          className="fu-go"
          disabled={!ready || !enough || locked}
          onClick={() => {
            let sources = `${MODULES[keepModule.defId].name} ${levelText(keepModule)} + ${MODULES[otherModule.defId].name} ${levelText(otherModule)}`;
            onFuse({ slot: keepSlot, partner: otherSlot, edition: editionAction });
            setDone({ slot: keepSlot, freed: otherSlot, sources });
          }}
        >
          {enough ? "Fusionner " : "Il faut "}
          <span className="fu-nowrap">{enough ? `· ${cost} ◆` : `${cost} ◆`}</span>
        </button>
      </div>
    </Modal>
  );
}
