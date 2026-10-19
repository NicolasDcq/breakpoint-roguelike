// Barre du haut : contrat, progression, ressources et boutons.

import { useEffect, useState } from "react";
import { CONTRACTS } from "../../domain/index.js";
import { useGame } from "../GameContext.jsx";
import { fmt } from "../format.js";
import { Tooltip } from "../common/Tooltip.jsx";

function Resource({ kind, value, label, icon }) {
  return (
    <div className={`res ${kind}`} tabIndex={0} aria-label={`${label} : ${value}`}>
      <span className="res-icon">{icon}</span>
      <span className="res-text">
        <span className="num">{fmt(value)}</span>
        <span className="res-label">{label}</span>
      </span>
    </div>
  );
}

function SoundToggle() {
  const { sound } = useGame();
  const [muted, setMuted] = useState(sound.isMuted);
  useEffect(() => sound.onMuteChange(setMuted), [sound]);
  return (
    <button className={`ghost sound-btn ${muted ? "off" : ""}`} onClick={() => sound.setMuted(!muted)} aria-label={muted ? "Activer le son" : "Couper le son"} aria-pressed={!muted}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 9h4l5-4v14l-5-4H4z" />
        {muted ? <path d="M17 9l5 6M22 9l-5 6" /> : <path d="M16.5 8.5a5 5 0 0 1 0 7M19.5 5.5a9 9 0 0 1 0 13" />}
      </svg>
    </button>
  );
}

function RunContracts({ current }) {
  return (
    <div className="tip-body">
      <strong>Les contrats de la partie</strong>
      <ol className="tip-list run-list">
        {CONTRACTS.map((contract, index) => (
          <li key={contract.name} className={`${index === current ? "current" : index < current ? "done" : ""} ${contract.letter === "A" ? "version-start" : ""}`}>
            <span className="run-label num">{contract.version}{contract.letter}</span>
            <span>{contract.name}</span>
            <span className="num">{fmt(contract.target)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function TopBar({ view, onRules, onRestart }) {
  const { contract, score, bossRule, limits, deploysLeft } = view;
  const progress = Math.min(100, (score / contract.target) * 100);
  const used = limits.deploys - deploysLeft;
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true" />
        <span className="brand-name">Breakpoint</span>
        <span className="env-badge">Le Parc</span>
      </div>
      <section className={`contract ${contract.boss ? "boss" : ""}`} aria-label="Contrat en cours">
        <div className={`contract-chip step-${contract.letter} ${contract.boss ? "boss" : ""}`} aria-hidden="true">
          <small>V{contract.version}</small>
          <b>{contract.letter}</b>
        </div>
        <div className="contract-head">
          <Tooltip touch content={<RunContracts current={view.contractIndex} />}>
            <span className="contract-step" tabIndex={0}>
              Version {contract.version}/4, contrat {contract.letter}{contract.boss ? (view.nextContract ? " (boss)" : " (boss final)") : ""}
            </span>
          </Tooltip>
          <h1 className="contract-name">{contract.name}</h1>
        </div>
        <div className="contract-progress">
          <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={contract.target} aria-valuenow={score}>
            <div className={`bar-fill ${progress >= 100 ? "full" : ""}`} style={{ width: `${progress}%` }} />
          </div>
          <div className="contract-numbers">
            <span className="num big">{fmt(score)}</span>
            <span className="dim"> / {fmt(contract.target)} Performance</span>
          </div>
        </div>
        <div className="contract-meta">
          <div className="deploy-pips" aria-label={`${deploysLeft} déploiements restants`}>
            {Array.from({ length: limits.deploys }, (_, index) => <span key={index} className={`pip ${index < used ? "used" : ""}`} />)}
            <span className="dim small">{deploysLeft} déploiement{deploysLeft > 1 ? "s" : ""}</span>
          </div>
          <div className="deploy-pips discard-pips" aria-label={`${view.discardsLeft} défausses restantes`}>
            <span className="dim small">· {view.discardsLeft} défausse{view.discardsLeft > 1 ? "s" : ""}</span>
          </div>
          {bossRule && <span className="rule-chip">{bossRule}</span>}
        </div>
      </section>
      <div className="resources">
        <Tooltip content={<div className="tip-body"><strong>Budget</strong><p>Gagné en livrant les contrats et avec les modules Business. Sert en boutique.</p></div>}>
          <Resource kind="budget" value={view.money} label="Budget" icon="$" />
        </Tooltip>
        <Tooltip content={<div className="tip-body"><strong>Data</strong><p>Stock qui reste d'un déploiement à l'autre. Améliore les modules en boutique, ou alimente l'API et l'Analytics.</p></div>}>
          <Resource kind="data" value={view.data} label="Data" icon="◆" />
        </Tooltip>
      </div>
      <div className="top-actions">
        <SoundToggle />
        <button className="ghost" onClick={onRules} aria-label="Règles">
          <span className="lbl-long">Règles</span>
          <span className="lbl-short" aria-hidden="true">?</span>
        </button>
        <button className="ghost" onClick={onRestart} aria-label="Nouvelle partie">
          <span className="lbl-long">Nouvelle partie</span>
          <span className="lbl-short" aria-hidden="true">↻</span>
        </button>
      </div>
    </header>
  );
}
