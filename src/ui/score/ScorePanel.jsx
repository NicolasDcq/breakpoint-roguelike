// Panneau du score, formule et bouton Déployer.

import { useEffect, useRef } from "react";
import { sfx } from "../../audio/sfx.js";
import { fmt, fmtDec } from "../../engine/format.js";
import { FuseIcon } from "../fusion/Fusion.jsx";

export function ScorePanel({ playback, last, preview, remaining, canDeploy, deployCost, onDeploy, onSkip, onSpeed, onShop, shopClosed, fusionCount, onFusion }) {
  let m = playback.animating;
  let y = m ? playback.totals : preview ? { compute: preview.compute, scale: preview.scale } : null;
  let v = y?.compute ?? 0;
  let w = y?.scale ?? 1;
  let T = m && (playback.event?.t === "end" || !playback.playing);
  let te = Math.floor(v * w);
  let H = te >= 1e3;
  let N = fmt(v);
  let S = fmtDec(w);
  let U = (fe) => fe.length >= 8 ? "len-xl" : fe.length >= 6 ? "len-l" : "";
  let j = !m && preview !== null && remaining > 0 && preview.score >= remaining;
  let ne = m ? te : preview?.score ?? 0;
  let L = remaining > 0 && (m || preview) ? ne / remaining : 0;
  let Q = L >= 5 ? 3 : L >= 2 ? 2 : L >= 1 ? 1 : 0;
  let q = useRef(0);
  useEffect(
    () => {
      if (!m) {
        q.current = 0;
        return;
      }
      if (Q > q.current) {
        q.current = Q;
        sfx.fire(Q);
      }
    },
    [m, Q],
  );
  let le = Q > 0 && <span className="flames" aria-hidden="true"><i /><i /><i /><i /><i /></span>;
  return (
    <section
      className={`score-panel ${m ? "running" : "forecast"} ${Q ? `on-fire heat-${Q}` : ""}`}
      aria-live="polite"
    >
      <div className="formula">
        <div className="term compute">
          {le}
          <span className="term-label">Compute</span>
          <span key={`c${v}`} className={`term-value num ${U(N)}`}>{N}</span>
        </div>
        <span className="op">×</span>
        <div className="term scale">
          {le}
          <span className="term-label">Scale</span>
          <span key={`s${w}`} className={`term-value num ${U(S)}`}>{S}</span>
        </div>
        <span className="op">=</span>
        <div className={`term perf ${T ? "final" : ""} ${H && T ? "huge" : ""}`}>
          <span className="term-label">
            {m
              ? "Performance"
              : (
                <>
                  <span className="perf-long">Prévu au prochain déploiement</span>
                  <span className="perf-short">Prévu</span>
                </>
              )}
          </span>
          <span key={T ? `p${te}` : "p"} className="term-value num">{y ? fmt(te) : "—"}</span>
        </div>
      </div>
      <div className="deploy-row">
        {m
          ? (
            <>
              <span className="chain num">
                {playback.activationCount}
                {" activation"}
                {playback.activationCount > 1 ? "s" : ""}
              </span>
              <div className="speed" role="group" aria-label="Vitesse">
                {[1, 2, 4].map((fe) => (
                  <button
                    key={fe}
                    className={playback.speed === fe ? "on" : ""}
                    onClick={() => onSpeed(fe)}
                  >
                    ×
                    {fe}
                  </button>
                ))}
              </div>
              <button className="ghost" onClick={onSkip}>Passer</button>
            </>
          )
          : (
            <>
              <span className="forecast-info small">
                {preview
                  && remaining > 0
                  && (
                    <span className={j ? "ok" : "short"}>
                      {j
                        ? "De quoi livrer le contrat"
                        : `Après ce déploiement, il manquera ${fmt(remaining - preview.score)}`}
                    </span>
                  )}
                {last
                  && (
                    <span className="dim">
                      {"Dernier déploiement : "}
                      <b className="num">{fmt(last.score)}</b>
                    </span>
                  )}
              </span>
              {onShop
                && (
                  <button
                    className="shop-btn"
                    onClick={onShop}
                    disabled={!!shopClosed}
                    title={shopClosed ? "Boutique fermée pendant ce contrat" : undefined}
                    aria-label={shopClosed ? "Boutique fermée pendant ce contrat" : "Boutique"}
                  >
                    {shopClosed ? "Fermée" : "Boutique"}
                  </button>
                )}
              <button
                className={`fusion-btn ${fusionCount ? "ready" : ""}`}
                onClick={onFusion}
                aria-label={fusionCount
                  ? `Fusion : ${fusionCount} possible${fusionCount > 1 ? "s" : ""}`
                  : "Fusion : aucune possible"}
              >
                <FuseIcon size={24} />
                <span className="fusion-label">Fusion</span>
                {fusionCount > 0 && <span className="fusion-badge num">{fusionCount}</span>}
              </button>
              <button
                className={`deploy ${j ? "hot" : ""}`}
                disabled={!canDeploy.ok}
                onClick={onDeploy}
                title={canDeploy.reason}
              >
                <span>Déployer</span>
                {deployCost > 0 && <span className="deploy-cost num">−{deployCost}{" $"}</span>}
              </button>
              {!canDeploy.ok
                && canDeploy.reason
                && <span className="dim small">{canDeploy.reason}</span>}
            </>
          )}
      </div>
    </section>
  );
}
