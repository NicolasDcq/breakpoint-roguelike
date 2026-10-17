// Atelier de fusion.

import { useState } from "react";
import { EDITIONS } from "../../engine/editions.js";
import { FUSED_MODULES } from "../../engine/fusedModules.js";
import { MODULES } from "../../engine/modules.js";
import { moduleView, patchVersion } from "../../engine/moduleView.js";
import { Modal } from "../common/Modal.jsx";
import { ModuleIcon } from "../common/ModuleIcon.jsx";
import { FX } from "../fx.jsx";

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

function FusionSlot({ m, slot, dim }) {
  let a = MODULES[m.defId];
  return (
    <div className={`fu-mini accent-${a.accent} ${dim ? "dim" : ""}`}>
      <span className="fu-slot num">{slot + 1}</span>
      <span className="fu-band"><ModuleIcon id={m.defId} size={12} /></span>
      <span className="fu-name">{a.name}</span>
      <span className="fu-lvl num">
        {"■".repeat(m.level)}
        {"□".repeat(3 - m.level)}
        {m.branch ? ` ${m.branch}` : ""}
      </span>
      {m.edition && <span className="fu-ed">{EDITIONS[m.edition].tag}</span>}
    </div>
  );
}

function FusionCard({ pair, board, onFuse, disabled }) {
  let [r, n] = useState(pair.slots[0]);
  let l = r === pair.slots[0] ? pair.slots[1] : pair.slots[0];
  let [d, u] = pair.slots.map((p) => board[p]);
  let i = FUSED_MODULES[pair.defId];
  let c = board[r].edition ?? board[l].edition;
  return (
    <div className="fu-card">
      <div className="fu-row">
        <FusionSlot m={d} slot={pair.slots[0]} />
        <span className="fu-plus">+</span>
        <FusionSlot m={u} slot={pair.slots[1]} />
        <span className="fu-arrow">➜</span>
        <div className={`fu-result accent-${MODULES[pair.defId].accent}`}>
          <span className="fu-v2 num">2.0</span>
          <span className="fu-name">{i.name}</span>
          {c && <span className="fu-ed">{EDITIONS[c].tag}</span>}
        </div>
      </div>
      <p className="fu-text">{FX(i.text)}</p>
      <div className="fu-actions">
        <div className="fu-keep">
          <span>Garder en</span>
          <div className="fu-seg" role="radiogroup" aria-label="Emplacement de la version 2.0">
            {pair.slots.map((p) => (
              <button
                key={p}
                role="radio"
                aria-checked={r === p}
                className={r === p ? "on" : ""}
                onClick={() => n(p)}
              >
                <span className="num">{"Empl. "}{p + 1}</span>
              </button>
            ))}
          </div>
        </div>
        <button className="fu-go" disabled={disabled} onClick={() => onFuse(r, l)}>
          Fusionner
        </button>
      </div>
    </div>
  );
}

export function FusionModal({ board, pairs, near, locked, mobile, onFuse, onClose }) {
  let [d, u] = useState(null);
  let i = d ? board[d.slot] : null;
  if (d && i?.fused) {
    let c = FUSED_MODULES[i.defId];
    return (
      <Modal className="fusion-modal fusion-done" onClose={onClose}>
        <span className="dim small">{d.sources}</span>
        <h2 className="fu-title gold">Fusion réussie</h2>
        <div className="fu-reveal">
          <span className="fu-rays" aria-hidden="true" />
          <div className={`fu-result big accent-${MODULES[i.defId].accent}`}>
            <span className="fu-v2 num">{patchVersion(i)}</span>
            <span className="fu-band"><ModuleIcon id={i.defId} size={18} /></span>
            <span className="fu-name">{c.name}</span>
            {i.edition && <span className="fu-ed">{EDITIONS[i.edition].tag}</span>}
          </div>
        </div>
        <div className="fu-card">
          <p className="fu-text strong">{FX(c.text)}</p>
          <p className="fu-text dim">
            {"Installé en emplacement "}
            {d.slot + 1}
            {", l’emplacement "}
            {d.freed + 1}
            {" est libéré"}
            {i.edition ? `, édition ${EDITIONS[i.edition].name} gardée` : ""}
            . Monte ensuite en 2.1, 2.2, 2.3 avec de la Data.
          </p>
        </div>
        <div className="fu-foot">
          {pairs.length > 0
            && (
              <button className="fu-next" onClick={() => u(null)}>
                Fusion suivante
                <small className="num">
                  {pairs.length}
                  {" restante"}
                  {pairs.length > 1 ? "s" : ""}
                </small>
              </button>
            )}
          <button className="deploy" onClick={onClose}>Continuer</button>
        </div>
      </Modal>
    );
  }
  return (
    <Modal className="fusion-modal" onClose={onClose}>
      <div className="fu-head">
        <div>
          <h2 className="fu-title">Fusion</h2>
          <span className="dim small">
            2 modules identiques niveau 3 ➜ 1 version 2.0, l’autre emplacement est libéré.
          </span>
        </div>
        {pairs.length > 0
          && (
            <span className="fu-count num">
              {pairs.length}
              {" prête"}
              {pairs.length > 1 ? "s" : ""}
            </span>
          )}
      </div>
      <div className="fu-list">
        {pairs.length === 0
          && (
            <p className="fu-empty">
              Aucune fusion prête. Il faut deux exemplaires du même module au niveau 3, quelle que soit leur spécialisation.
            </p>
          )}
        {pairs.map((c) => (
          <FusionCard
            key={`${c.defId}-${c.slots.join("-")}`}
            pair={c}
            board={board}
            disabled={locked}
            onFuse={(p, m) => {
              let y = `${moduleView(board[p]).name} + ${moduleView(board[m]).name}`;
              onFuse(p, m);
              u({ slot: p, freed: m, sources: y });
            }}
          />
        ))}
        {near.length > 0
          && (
            <div className="fu-card soon">
              <div className="fu-soon-head">
                <span>Bientôt</span>
                <span className="dim small">il manque un niveau 3</span>
              </div>
              {near.map((c) => (
                <div key={c.defId} className="fu-row soon-row">
                  <FusionSlot m={board[c.ready]} slot={c.ready} />
                  <span className="fu-plus">+</span>
                  <FusionSlot m={board[c.other]} slot={c.other} dim />
                  <div className="fu-soon-text">
                    <b>{FUSED_MODULES[c.defId].name}</b>
                    <span>
                      {"Améliore "}
                      {MODULES[c.defId].name}
                      {" de l’empl. "}
                      {c.other + 1}
                      {" au niveau 3 ("}
                      {c.data}
                      {" ◆)"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
      <div className="fu-foot">
        <button className="fu-back" onClick={onClose}>
          {mobile ? "Retour au plateau" : "Fermer"}
        </button>
      </div>
    </Modal>
  );
}
