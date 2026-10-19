// Panneau du score : base de l'architecture, formule, et boutons d'action.

import { fmt, fmtDec } from "../format.js";
import { ArchitectureLine } from "./ArchitectureLine.jsx";

const lengthClass = (text) => (text.length >= 8 ? "len-xl" : text.length >= 6 ? "len-l" : "");

function ParcIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="6" y="3" width="13" height="16" rx="2" />
      <path d="M4 7v12a2 2 0 0 0 2 2h10" />
    </svg>
  );
}

export function ScorePanel({ view, animation, selectionCount, onDiscard, onDeploy, onParc, onArchitectures, onSkip, onSpeed }) {
  const running = Boolean(animation);
  const totals = animation?.formula ?? view.preview;
  const computeText = fmt(Math.round(totals.compute));
  const scaleText = fmtDec(totals.scale);
  const score = running ? totals.score : view.preview.score;
  const remaining = Math.max(0, view.contract.target - view.score);
  const enough = !running && view.placedCount > 0 && remaining > 0 && view.preview.score >= remaining;
  const ratio = remaining > 0 && view.placedCount ? score / remaining : 0;
  const heat = ratio >= 5 ? 3 : ratio >= 2 ? 2 : ratio >= 1 ? 1 : 0;
  const flames = heat > 0 && <span className="flames" aria-hidden="true"><i /><i /><i /><i /><i /></span>;
  return (
    <section className={`score-panel ${running ? "running" : "forecast"} ${heat ? `on-fire heat-${heat}` : ""}`} aria-live="polite">
      <ArchitectureLine preview={view.preview} flash={animation?.flash} onShowAll={onArchitectures} />
      <div className="formula">
        <div className="term compute">
          {flames}
          <span className="term-label">Compute</span>
          <span key={`c${computeText}`} className={`term-value num ${lengthClass(computeText)}`}>{computeText}</span>
        </div>
        <span className="op">×</span>
        <div className="term scale">
          {flames}
          <span className="term-label">Scale</span>
          <span key={`s${scaleText}`} className={`term-value num ${lengthClass(scaleText)}`}>{scaleText}</span>
        </div>
        <span className="op">=</span>
        <div className={`term perf ${animation?.done ? "final" : ""}`}>
          <span className="term-label">
            {running ? "Performance" : <><span className="perf-long">Prévu au prochain déploiement</span><span className="perf-short">Prévu</span></>}
          </span>
          <span className="term-value num">{view.placedCount || running ? fmt(score) : "—"}</span>
        </div>
      </div>
      <div className="deploy-row">
        {running ? (
          <>
            <span className="chain num">{animation.step} activation{animation.step > 1 ? "s" : ""}</span>
            <div className="speed" role="group" aria-label="Vitesse">
              {[1, 2, 4].map((speed) => (
                <button key={speed} className={animation.speed === speed ? "on" : ""} onClick={() => onSpeed(speed)}>×{speed}</button>
              ))}
            </div>
            <button className="ghost" onClick={onSkip}>Passer</button>
          </>
        ) : (
          <>
            <span className="forecast-info small">
              {view.placedCount > 0 && remaining > 0 && (
                <span className={enough ? "ok" : "short"}>
                  {enough ? "De quoi livrer le contrat" : `Après ce déploiement, il manquera ${fmt(remaining - view.preview.score)}`}
                </span>
              )}
              {!view.placedCount && <span className="dim">Choisis des modules dans ta main et pose-les sur le plateau.</span>}
            </span>
            <button className="shop-btn discard-btn" onClick={onDiscard} disabled={!view.discardsLeft || !selectionCount}>
              Défausser{selectionCount ? ` (${selectionCount})` : ""}
            </button>
            <button className="fusion-btn ready parc-btn" onClick={onParc} aria-label={`Parc : ${view.drawCount} cartes dans la pioche`}>
              <ParcIcon />
              <span className="fusion-label">Parc</span>
              <span className="fusion-badge num">{view.drawCount}</span>
            </button>
            <button className={`deploy ${enough ? "hot" : ""}`} disabled={!view.placedCount} onClick={onDeploy}>
              <span>Déployer</span>
            </button>
          </>
        )}
      </div>
    </section>
  );
}
