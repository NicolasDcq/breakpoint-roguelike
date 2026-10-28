// La colonne de gauche de l'écran de jeu sur ordinateur (maquette A2) :
// contrat, formule, ressources, puis les grosses actions en bas (Déployer, Défausser, Parc).

import { ARCHITECTURE_BY_ID, STARTERS } from "../../domain/index.js";
import { SPEEDS } from "../gameSpeed.js";
import { fmt, fmtDec } from "../format.js";
import { SoundToggle } from "./TopBar.jsx";

const lengthClass = (text) => (text.length >= 8 ? "len-xl" : text.length >= 6 ? "len-l" : "");

export function GameHud({ view, animation, selectionCount, discarding, onDiscard, onDeploy, onParc, onArchitectures, onSkip, onSpeed, onRules, onRestart }) {
  const { contract, bossRule } = view;
  const running = Boolean(animation);
  const totals = animation?.formula ?? view.preview;
  const computeText = fmt(Math.round(totals.compute));
  const scaleText = fmtDec(totals.scale);
  const score = running ? totals.score : view.preview.score;
  const remaining = Math.max(0, contract.target - view.score);
  const enough = !running && view.placedCount > 0 && remaining > 0 && view.preview.score >= remaining;
  const ratio = remaining > 0 && view.placedCount ? score / remaining : 0;
  const heat = ratio >= 5 ? 3 : ratio >= 2 ? 2 : ratio >= 1 ? 1 : 0;
  const flames = heat > 0 && <span className="flames" aria-hidden="true"><i /><i /><i /><i /><i /></span>;
  const placed = view.preview.count > 0;
  const { level } = view.preview.architecture;
  const archName = placed ? ARCHITECTURE_BY_ID[view.preview.architecture.id].name : "Aucune";
  const progress = Math.min(100, (view.score / contract.target) * 100);
  return (
    <aside className="hud gd-hud">
      <div className="gd-top">
        <span className="gd-brand">Breakpoint</span>
        <span className="gd-env">{STARTERS[view.starterId].name}</span>
        <span className="gd-top-actions">
          <SoundToggle />
          <button type="button" className="ghost" onClick={onRules} aria-label="Règles">?</button>
          <button type="button" className="ghost" onClick={onRestart} aria-label="Nouvelle partie">↻</button>
        </span>
      </div>
      <section className={`gd-pan gd-contract topbar ${contract.boss ? "boss" : ""}`} aria-label="Contrat en cours">
        <span className={`gd-chip step-${contract.letter}`} aria-hidden="true"><small>V{contract.version}</small><b>{contract.letter}</b></span>
        <div className="gd-contract-main">
          <span className="gd-small">Version {contract.version}/{view.lastVersion} · contrat {contract.letter}{contract.boss ? " (boss)" : ""}</span>
          <h1 className="gd-contract-name">{contract.name}</h1>
          <div className="gd-goal"><span className="gd-small">Objectif</span><b className="num">{fmt(view.score)}<i> / {fmt(contract.target)}</i></b></div>
        </div>
        <div className="gd-bar" role="progressbar" aria-valuemin={0} aria-valuemax={contract.target} aria-valuenow={view.score}><i style={{ width: `${progress}%` }} /></div>
        {bossRule && <span className="rule-chip gd-rule">{bossRule}</span>}
      </section>
      <section className={`gd-pan score-panel gd-score ${running ? "running" : "forecast"} ${heat ? `on-fire heat-${heat}` : ""}`} aria-live="polite">
        <button type="button" className="gd-score-head arch-line" onClick={onArchitectures} aria-label="Voir les architectures">
          <span className="gd-small">{placed ? <>{archName} · niveau {level}</> : "Pose des modules"}</span>
          <span className="gd-prev">{running ? "Perf" : "Prévu"} <b className="num">{view.placedCount || running ? fmt(score) : "—"}</b></span>
        </button>
        <div className="formula gd-formula">
          <div className="term compute">{flames}<span className="term-label">Compute</span><span key={`c${computeText}`} className={`term-value num ${lengthClass(computeText)}`}>{computeText}</span></div>
          <span className="op">×</span>
          <div className="term scale">{flames}<span className="term-label">Scale</span><span key={`s${scaleText}`} className={`term-value num ${lengthClass(scaleText)}`}>{scaleText}</span></div>
        </div>
        {running ? (
          <div className="gd-run">
            <span className="chain num">{animation.step} activation{animation.step > 1 ? "s" : ""}</span>
            <span className="speed" role="group" aria-label="Vitesse">
              {SPEEDS.map((speed) => <button key={speed} type="button" className={animation.speed === speed ? "on" : ""} onClick={() => onSpeed(speed)}>×{speed}</button>)}
            </span>
            <button type="button" className="ghost" onClick={onSkip}>Passer</button>
          </div>
        ) : (
          <p className={`gd-forecast ${enough ? "ok" : ""}`}>
            {view.placedCount > 0 && remaining > 0
              ? (enough ? "De quoi livrer le contrat" : `Après ce déploiement, il manquera ${fmt(remaining - view.preview.score)}`)
              : !view.placedCount ? "Pose des modules sur le plateau." : ""}
          </p>
        )}
      </section>
      <div className="gd-stats">
        <div className="gd-stat"><span className="gd-small">Déploiements</span><b className="num deploys">{view.deploysLeft}</b></div>
        <div className="gd-stat"><span className="gd-small">Défausses</span><b className="num discards">{view.discardsLeft}</b></div>
        <div className="gd-stat"><span className="gd-small">Budget</span><b className="num money">${fmt(view.money)}</b></div>
        <div className="gd-stat"><span className="gd-small">Data</span><b className="num data">{fmt(view.data)} ◆</b></div>
      </div>
      <div className="gd-actions deploy-row">
        <button type="button" className={`gd-deploy deploy ${enough ? "hot" : ""}`} disabled={!view.placedCount || discarding || running} onClick={onDeploy}>Déployer</button>
        <div className="gd-actions-sub">
          <button type="button" className={`gd-discard discard-btn ${discarding ? "confirm" : ""}`} onClick={onDiscard} disabled={(!view.discardsLeft && !discarding) || running} aria-pressed={discarding}>
            {discarding ? `Confirmer${selectionCount ? ` (${selectionCount})` : ""}` : "Défausser"}
          </button>
          <button type="button" className="gd-parc parc-btn" onClick={onParc} aria-label={`Parc : ${view.drawCount} cartes dans la pioche`}>Parc ({view.drawCount})</button>
        </div>
      </div>
    </aside>
  );
}
