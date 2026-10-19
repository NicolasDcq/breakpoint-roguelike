// « Ta partie » : ce que la graine a tiré pour cette partie.
// Profil de départ, marché de la boutique, et les contrats avec leurs boss.

import { BOSSES, FAMILY_IDS, MODULES, PLUGINS, STARTERS } from "../../domain/index.js";
import { Modal } from "../common/Modal.jsx";
import { ModuleIcon } from "../common/ModuleIcon.jsx";
import { fmt } from "../format.js";
import { FAMILY_ACCENT, PLUGIN_LOOK } from "../visuals.js";

/** Compte les exemplaires de chaque module, dans l'ordre des familles. */
function countModules(moduleIds) {
  const counts = new Map();
  moduleIds.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
  return [...counts.entries()].sort(([a], [b]) => FAMILY_IDS.indexOf(MODULES[a].family) - FAMILY_IDS.indexOf(MODULES[b].family));
}

function ModuleChip({ moduleId, count }) {
  const accent = FAMILY_ACCENT[MODULES[moduleId].family];
  return (
    <span className={`brief-chip accent-${accent}`} title={MODULES[moduleId].name}>
      <span className={`arch-mini accent-${accent}`}><ModuleIcon id={moduleId} size={14} /></span>
      <span className="brief-chip-name">{MODULES[moduleId].shortName}</span>
      {count > 1 && <b className="num">×{count}</b>}
    </span>
  );
}

export function BriefingModal({ view, onClose }) {
  const starter = STARTERS[view.starterId];
  return (
    <Modal className="rules-modal briefing-modal" onClose={onClose}>
      <h2 className="modal-title">Ta partie</h2>
      <p className="dim small">Graine {view.seed}. Une autre partie tirera un autre profil, un autre marché et d’autres boss.</p>

      <section className="brief-sec">
        <h3>Profil de départ · {starter.name}</h3>
        <p className="small">{starter.text}</p>
        <div className="brief-chips">
          {countModules(starter.parc).map(([moduleId, count]) => <ModuleChip key={moduleId} moduleId={moduleId} count={count} />)}
        </div>
      </section>

      <section className="brief-sec">
        <h3>Le marché · la boutique ne vendra que ça</h3>
        <div className="brief-chips">
          {countModules(view.market.modules).map(([moduleId]) => <ModuleChip key={moduleId} moduleId={moduleId} count={1} />)}
        </div>
        <div className="brief-chips brief-plugins">
          {view.market.plugins.map((id) => (
            <span key={id} className="brief-chip" title={PLUGINS[id].text}>
              <span aria-hidden="true">{PLUGIN_LOOK[id]?.emoji}</span>
              <span className="brief-chip-name">{PLUGINS[id].name}</span>
            </span>
          ))}
        </div>
      </section>

      <section className="brief-sec">
        <h3>Les contrats</h3>
        <ol className="brief-contracts">
          {view.contracts.map((contract, index) => (
            <li key={index} className={`${contract.boss ? "boss" : ""} ${index === view.contractIndex ? "current" : index < view.contractIndex ? "done" : ""}`}>
              <span className="num brief-step">{contract.version}{contract.letter}</span>
              <span className="brief-name">{contract.name}</span>
              <span className="num brief-target">{fmt(contract.target)}</span>
              {contract.boss && <span className="rule-chip">{BOSSES[contract.boss].text}</span>}
            </li>
          ))}
        </ol>
      </section>

      <button className="deploy" onClick={onClose}>C’est parti</button>
    </Modal>
  );
}
