// Le tutoriel : Loup Niel commente la partie préparée, en éclairant la zone utile.
// Il ne lit que la vue ; il ne joue jamais à la place du joueur.

import { useEffect, useState } from "react";
import { TUTORIAL_STEPS } from "./steps.js";
import { LOUP_SVG } from "./loupNielSprites.js";

const PAD = 6;
const svgUrl = (pose) => `data:image/svg+xml;utf8,${encodeURIComponent(LOUP_SVG[pose] ?? LOUP_SVG.neutre)}`;

export function LoupNiel({ pose = "neutre", className = "" }) {
  return <img className={`loup ${className}`} src={svgUrl(pose)} alt="" draggable="false" />;
}

/** Le rectangle qui englobe les éléments visés, ou null s'ils ne sont pas à l'écran. */
function measure(selectors) {
  let box = null;
  for (const selector of selectors) {
    for (const element of document.querySelectorAll(selector)) {
      const r = element.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      box = box
        ? { left: Math.min(box.left, r.left), top: Math.min(box.top, r.top), right: Math.max(box.right, r.right), bottom: Math.max(box.bottom, r.bottom) }
        : { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    }
  }
  return box && { left: box.left - PAD, top: box.top - PAD, width: box.right - box.left + 2 * PAD, height: box.bottom - box.top + 2 * PAD };
}

function useRect(selectors, key) {
  const [rect, setRect] = useState(null);
  useEffect(() => {
    const update = () => setRect((old) => {
      const next = measure(selectors);
      return JSON.stringify(old) === JSON.stringify(next) ? old : next;
    });
    update();
    const timer = setInterval(update, 150);
    window.addEventListener("resize", update);
    return () => { clearInterval(timer); window.removeEventListener("resize", update); };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return rect;
}

/** Quatre panneaux autour de la zone : seul le trou laisse passer les clics. */
function Spotlight({ rect, interactive }) {
  const { left, top, width, height } = rect;
  const panel = (style) => <div className="tut-dim" style={style} />;
  return (
    <>
      {panel({ left: 0, top: 0, right: 0, height: Math.max(top, 0) })}
      {panel({ left: 0, top: top + height, right: 0, bottom: 0 })}
      {panel({ left: 0, top, width: Math.max(left, 0), height })}
      {panel({ left: left + width, top, right: 0, height })}
      <div className={`tut-ring ${interactive ? "" : "block"}`} style={{ left, top, width, height }} />
    </>
  );
}

export function Tutorial({ view, hidden = false, onQuit, onNewRun }) {
  const [index, setIndex] = useState(0);
  const current = TUTORIAL_STEPS.findIndex((step, i) => i >= index && step.phase === view.phase && (!step.when || step.when(view)));
  const step = current >= 0 ? TUTORIAL_STEPS[current] : null;
  const advance = () => setIndex(current + 1);
  const finished = step?.done?.(view);
  useEffect(() => { if (finished) setIndex(current + 1); }, [finished, current]);
  const rect = useRect(step?.target ?? [], step?.id);
  if (!step || finished || hidden) return null;

  const lower = rect && rect.top + rect.height / 2 > window.innerHeight * 0.5;
  const showNext = !step.interactive || step.last;
  return (
    <div className="tut-layer">
      {step.target.length > 0 && rect ? <Spotlight rect={rect} interactive={step.interactive} /> : <div className="tut-dim tut-all" />}
      <div className={`tut-bubble ${lower ? "top" : "bottom"}`} role="status">
        <div className="tut-top">
          {!step.last && <button className="tut-quit" onClick={onQuit}>Quitter le tuto</button>}
          <span className="tut-count num">{current + 1} / {TUTORIAL_STEPS.length}</span>
        </div>
        <div className="tut-row">
          <LoupNiel pose={step.pose} className="tut-loup" />
          <p className="tut-text" dangerouslySetInnerHTML={{ __html: step.text(view) }} />
        </div>
        {step.last ? (
          <div className="tut-end">
            <button className="tut-next" onClick={onNewRun}>Lancer une vraie partie</button>
            <button className="tut-skip" onClick={onQuit}>Continuer cette partie</button>
          </div>
        ) : showNext && <button className="tut-next" onClick={advance}>Suivant</button>}
      </div>
    </div>
  );
}

/** Proposé au premier lancement. */
export function TutorialOffer({ onStart, onSkip }) {
  return (
    <div className="tut-layer tut-offer">
      <div className="tut-dim tut-all" />
      <div className="tut-card" role="dialog" aria-modal="true">
        <LoupNiel pose="salut" className="tut-offer-loup" />
        <p className="tut-offer-text">Salut, moi c’est <b>Loup Niel</b>, ton CTO. On livre ensemble un premier contrat ?</p>
        <button className="deploy" onClick={onStart} autoFocus>C’est parti</button>
        <button className="tut-skip" onClick={onSkip}>Je connais déjà · passer</button>
      </div>
    </div>
  );
}
