// Barre du haut : contrat, ressources, son.

import { useEffect, useRef, useState } from "react";
import { isMuted, onMuteChange, setMuted } from "../../audio/sfx.js";
import { findRule, ruleShortText, ruleText } from "../../engine/contracts.js";
import { fmt } from "../../engine/format.js";
import { Tooltip } from "../common/Tooltip.jsx";
import { Laptop } from "../goodies/Goodies.jsx";

function useDelta(e) {
  let t = useRef(e);
  let [o, a] = useState({ n: 0, delta: 0 });
  useEffect(
    () => {
      if (e === t.current) {
        return;
      }
      let r = e - t.current;
      t.current = e;
      a((n) => ({ n: n.n + 1, delta: r }));
    },
    [e],
  );
  return o;
}

function Resource({ kind, value, label, icon }) {
  let r = useDelta(value);
  let n = r.n === 0 ? "" : r.delta > 0 ? "up" : "down";
  return (
    <div className={`res ${kind} ${value < 0 ? "negative" : ""}`} tabIndex={0}>
      <span className="res-icon">{icon}</span>
      <span className="res-text">
        <span key={r.n} className={`num ${n}`}>{fmt(value)}</span>
        <span className="res-label">{label}</span>
      </span>
      {r.n > 0
        && (
          <span key={`d${r.n}`} className={`res-delta num ${n}`} aria-hidden="true">
            {r.delta > 0 ? "+" : "−"}
            {fmt(Math.abs(r.delta))}
          </span>
        )}
    </div>
  );
}

export function TopBar(e) {
  let { contract } = e;
  let o = Math.min(100, e.score / contract.target * 100);
  let a = findRule(contract, "minDataProduced");
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true" />
        <span className="brand-name">Breakpoint</span>
        <span className="env-badge" title="Environnement de la partie">{e.envName}</span>
      </div>
      <section className={`contract ${contract.boss ? "boss" : ""}`} aria-label="Contrat en cours">
        <div
          className={`contract-chip step-${contract.step} ${contract.boss ? "boss" : ""}`}
          aria-hidden="true"
        >
          <small>V{contract.version}</small>
          <b>{contract.step}</b>
        </div>
        <div className="contract-head">
          <Tooltip
            touch
            content={<div className="tip-body">
              <strong>Les contrats de cette run</strong>
              <ol className="tip-list run-list">
                {e.contracts.map((r, n) => (
                  <li
                    key={r.id}
                    className={`${n === e.contractIndex ? "current" : n < e.contractIndex ? "done" : ""} ${r.step === "A" ? "version-start" : ""} ${r.major ? "major" : ""}`}
                  >
                    <span className="run-label num">{r.version}{r.step}</span>
                    <span>{r.name}</span>
                    <span className="num">{fmt(r.target)}</span>
                    {r.rules.map((l) => (
                      <span key={l.kind} className={`mini-rule ${r.boss ? "boss" : ""}`}>
                        {ruleShortText(l)}
                      </span>
                    ))}
                  </li>
                ))}
              </ol>
            </div>}
          >
            <span className="contract-step" tabIndex={0}>
              {e.endless ? `Version ${contract.version} (infini)` : `Version ${contract.version}/8`}
              {", contrat "}
              {contract.step}
              {contract.major && !contract.boss
                ? " (livraison majeure)"
                : contract.boss ? contract.version > 8 ? " (boss)" : " (boss final)" : ""}
            </span>
          </Tooltip>
          <h1 className="contract-name">{contract.name}</h1>
          <span className="contract-client">{contract.client}</span>
        </div>
        <div className="contract-progress">
          <div
            className="bar"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={contract.target}
            aria-valuenow={e.score}
          >
            <div className={`bar-fill ${o >= 100 ? "full" : ""}`} style={{ width: `${o}%` }} />
          </div>
          <div className="contract-numbers">
            <span className="num big">{fmt(e.score)}</span>
            <span className="dim">{"/ "}{fmt(contract.target)}{" Performance"}</span>
          </div>
        </div>
        <div className="contract-meta">
          <div
            className="deploy-pips"
            aria-label={`${contract.deploys - e.deploysUsed} déploiements restants`}
          >
            {Array.from({ length: contract.deploys }, (r, n) => <span key={n} className={`pip ${n < e.deploysUsed ? "used" : ""}`} />)}
            <span className="dim small">
              {contract.deploys - e.deploysUsed}
              {" déploiement"}
              {contract.deploys - e.deploysUsed > 1 ? "s" : ""}
            </span>
          </div>
          {contract.rules.map((r) => (
            <span key={r.kind} className="rule-chip">
              {ruleText(r, contract.deploys)}
              {a
                && r.kind === "minDataProduced"
                && (
                  <b className={e.dataProduced >= a.amount ? "ok" : ""}>
                    {" "}
                    {e.dataProduced}
                    /
                    {a.amount}
                  </b>
                )}
            </span>
          ))}
        </div>
      </section>
      <div className="resources">
        <Tooltip
          content={<TipBody
            title="Budget"
            text="Stock persistant. Sert à acheter des modules, des Plugins, des emplacements et des relances."
          />}
        >
          <Resource kind="budget" value={e.budget} label="Budget" icon="$" />
        </Tooltip>
        <Tooltip
          content={<TipBody
            title="Data"
            text="Stock persistant. Produite par les Bases de données. Dépense-la pour améliorer un module, ou laisse l’API et l’Analytics la consommer pendant un déploiement."
          />}
        >
          <Resource kind="data" value={e.data} label="Data" icon="◆" />
        </Tooltip>
      </div>
      <Laptop goodies={e.goodies} />
      <div className="top-actions">
        <SoundToggle />
        <button className="ghost" onClick={e.onRules} aria-label="Règles">
          <span className="lbl-long">Règles</span>
          <span className="lbl-short" aria-hidden="true">?</span>
        </button>
        <button className="ghost" onClick={e.onRestart} aria-label="Nouvelle run">
          <span className="lbl-long">Nouvelle run</span>
          <span className="lbl-short" aria-hidden="true">↻</span>
        </button>
        <button
          className={`ghost hint-btn ${e.hintOn ? "on" : ""}`}
          onClick={e.onHint}
          disabled={!e.hintAvailable}
          aria-label="Astuce"
          aria-pressed={!!e.hintOn}
          title={e.hintOn ? "Masquer l’astuce" : "Afficher l’astuce du contrat"}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 18h6" />
            <path d="M10 21h4" />
            <path
              d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}

function SoundToggle() {
  let [e, t] = useState(isMuted);
  useEffect(() => onMuteChange(t), []);
  return (
    <button
      className={`ghost sound-btn ${e ? "off" : ""}`}
      onClick={() => setMuted(!e)}
      aria-label={e ? "Activer le son" : "Couper le son"}
      aria-pressed={!e}
      title={e ? "Son coupé" : "Son activé"}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 9h4l5-4v14l-5-4H4z" />
        {e
          ? <path d="M17 9l5 6M22 9l-5 6" />
          : <path d="M16.5 8.5a5 5 0 0 1 0 7M19.5 5.5a9 9 0 0 1 0 13" />}
      </svg>
    </button>
  );
}

function TipBody({ title, text }) {
  return <div className="tip-body"><strong>{title}</strong><p>{text}</p></div>;
}
