// Fin de partie : victoire ou défaite.

import { COMPANIES } from "../../engine/companies.js";
import { MAX_DIFFICULTY, difficultyInfo } from "../../engine/difficulty.js";
import { fmt } from "../../engine/format.js";
import { PLUGINS } from "../../engine/plugins.js";
import { Modal } from "../common/Modal.jsx";

export function EndModal({ state, onRestart, unlocked, endlessBest, newCompanies = [] }) {
  let n = state.phase === "victory";
  let l = state.history.at(-1);
  let d = !n && l ? state.contracts.find((p) => p.id === l.contractId) : null;
  let u = !n && !!state.endless;
  let i = state.contracts[Math.min(state.contractIndex, state.contracts.length - 1)];
  let c = Math.ceil(state.contracts.length / 3);
  return (
    <Modal className={`end-modal ${n || u ? "won" : "lost"}`}>
      <h2 className="end-title">
        {n ? "Mise en production réussie" : u ? "Fin de la Prod infinie" : "Incident en production"}
      </h2>
      {u
        && (
          <p className="endless-reached">
            {"Version "}
            <b className="num">{i.version}</b>
            {" atteinte, contrat "}
            {i.step}
            {i.version >= endlessBest && i.version > 0
              ? " : nouveau record !"
              : ` (record : version ${endlessBest})`}
          </p>
        )}
      <p className="modal-sub">
        {n
          ? `Les ${state.contracts.length} contrats sont livrés, ${state.contracts.at(-1).name} compris. Personne ne comprend comment, et c’est très bien.`
          : d
            ? `${d.name} n’a pas été livré : ${fmt(l.score)} sur ${fmt(d.target)}.`
            : "Run abandonnée."}
      </p>
      <p className="end-level">
        <span>
          <b>{COMPANIES[state.company ?? "startup"].name}</b>
          {" ·"}
          {" "}
          {state.endless
            ? <b>∞ Prod infinie</b>
            : <>{"Environnement "}{state.level}{" : "}<b>{difficultyInfo(state.level).name}</b></>}
        </span>
        {unlocked
          && unlocked > MAX_DIFFICULTY
          && <span className="unlocked">Nouveau mode débloqué : ∞ Prod infinie</span>}
        {newCompanies.map((p) => (
          <span key={p} className="unlocked company-unlocked">
            {"Nouvelle entreprise débloquée : "}
            {COMPANIES[p].name}
          </span>
        ))}
        {unlocked
          && unlocked <= MAX_DIFFICULTY
          && (
            <span className="unlocked">
              {"Nouvel environnement débloqué : "}
              {unlocked}
              {". "}
              {difficultyInfo(unlocked).name}
            </span>
          )}
      </p>
      <div className="stats">
        <div>
          <span className="num">
            {state.history.filter((p) => p.success).length}
            /
            {state.contracts.length}
          </span>
          <span>contrats livrés</span>
        </div>
        <div>
          <span className="num">{fmt(state.stats.bestDeploy)}</span>
          <span>meilleur déploiement</span>
        </div>
        <div>
          <span className="num">{fmt(state.stats.totalScore)}</span>
          <span>Performance totale</span>
        </div>
        <div>
          <span className="num">{state.stats.maxActivations}</span>
          <span>activations max en un déploiement</span>
        </div>
      </div>
      <div className="end-jokers">
        {state.jokers.map((p) => (
          <span key={p.uid} className="end-joker" title={PLUGINS[p.defId].name}>
            {PLUGINS[p.defId].emoji}
          </span>
        ))}
      </div>
      <div className="history-grid" role="list" aria-label="Contrats de la run">
        {Array.from({ length: c }, (p, m) => (
          <div key={m} className="history-version" role="listitem">
            <span className="hv-label num">v{m + 1}</span>
            {state.contracts.slice(m * 3, m * 3 + 3).map((y, v) => {
              let w = m * 3 + v;
              let T = state.history[w];
              return (
                <span
                  key={y.id}
                  className={`hv-cell ${T ? T.success ? "ok" : "ko" : "todo"} ${y.major ? "major" : ""}`}
                  title={`${y.version}${y.step} ${y.name} : ${T ? `${fmt(T.score)} / ` : ""}${fmt(y.target)}`}
                >
                  {y.step}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <p className="dim small">{"Graine de la run : "}{state.seed}</p>
      <button className="deploy" onClick={onRestart}>Nouvelle run</button>
    </Modal>
  );
}
