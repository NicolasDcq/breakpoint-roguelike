// Écran d'accueil : titre, cartes à puce qui flottent, et le choix entre reprendre
// la partie en cours ou en commencer une nouvelle. Il lit la vue et n'appelle que le service.

import { useState } from "react";
import { useGame, useGameView } from "../GameContext.jsx";
import { MOBILE_QUERY, useMediaQuery } from "../hooks/useMediaQuery.js";
import { PluginCard } from "../components/PluginCard.jsx";
import { ConfirmNewRun } from "./InfoModals.jsx";

// Pose des cartes : téléphone (en éventail, qui se chevauchent) et ordinateur (dispersées).
const PHONE_FAN = [
  { id: "intern", rot: -9, delay: -0.4 },
  { id: "genai", rot: 0, delay: 0 },
  { id: "cloudarch", rot: 9, delay: -0.8 },
];
const DESKTOP_FAN = [
  { id: "intern", rot: -9, delay: -0.2, x: 0, y: 80 },
  { id: "cloudarch", rot: 0, delay: -0.9, x: 190, y: 30 },
  { id: "genai", rot: 8, delay: -1.6, x: 380, y: 100 },
  { id: "dba", rot: -5, delay: -2.1, x: 90, y: 370 },
  { id: "vc", rot: 6, delay: -0.6, x: 290, y: 390 },
];

/** Le chemin doré en pointillés qui traverse le fond (décor). */
function Route({ d, dash, width, viewBox }) {
  return (
    <svg className="menu-route" viewBox={viewBox} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <path d={d} strokeDasharray={dash} strokeWidth={width} />
    </svg>
  );
}

function Title() {
  return (
    <div className="menu-title">
      <div className="menu-logo">
        <h1>BREAKPOINT</h1>
        <span className="menu-beta">BÊTA {__APP_VERSION__}</span>
      </div>
      <p className="menu-tagline">un roguelike de mise en prod</p>
    </div>
  );
}

export function MainMenu({ onPlay, onTutorial }) {
  const { game } = useGame();
  const view = useGameView();
  const mobile = useMediaQuery(MOBILE_QUERY);
  const [confirming, setConfirming] = useState(false);

  const newRun = () => { game.newRun(); onPlay(true); };
  const askTutorial = () => (view.inProgress ? setConfirming("tuto") : onTutorial());
  const askNewRun = () => (view.inProgress ? setConfirming(true) : newRun());
  const contract = `Version ${view.contract.version} · contrat ${view.contract.letter}`;

  const tutorialBtn = <button className="menu-btn menu-btn-second menu-btn-tuto" onClick={askTutorial}>TUTORIEL</button>;

  const actions = view.inProgress ? (
    <>
      <button className="menu-btn menu-btn-main" onClick={() => onPlay(false)} autoFocus>
        REPRENDRE LA PARTIE
        <small>{contract}</small>
      </button>
      <button className="menu-btn menu-btn-second" onClick={askNewRun}>NOUVELLE PARTIE</button>
      {tutorialBtn}
    </>
  ) : (
    <>
      <button className="menu-btn menu-btn-main" onClick={newRun} autoFocus>NOUVELLE PARTIE</button>
      {tutorialBtn}
    </>
  );

  const confirm = confirming && <ConfirmNewRun onYes={confirming === "tuto" ? onTutorial : newRun} onNo={() => setConfirming(false)} />;

  if (mobile) {
    return (
      <main className="main-menu is-phone">
        <Route viewBox="0 0 390 844" d="M-10 330 H90 L120 360 H270 L300 330 H400 M-10 640 H60 L90 610 H300 L330 640 H400" dash="14 66" width={3} />
        <div className="menu-stage">
          <div className="menu-fan">
            {PHONE_FAN.map(({ id, rot, delay }) => (
              <div key={id} className="menu-card" style={{ "--r": `${rot}deg`, animationDelay: `${delay}s` }}>
                <PluginCard id={id} />
              </div>
            ))}
          </div>
          <Title />
          <div className="menu-spacer" />
          <div className="menu-actions">{actions}</div>
        </div>
        {confirm}
      </main>
    );
  }

  return (
    <main className="main-menu is-desktop">
      <Route viewBox="0 0 1440 900" d="M-10 230 H300 L340 270 H900 L940 230 H1450 M-10 690 H200 L240 650 H1100 L1140 690 H1450" dash="18 82" width={4} />
      <div className="menu-left">
        <Title />
        <div className="menu-actions">{actions}</div>
      </div>
      <div className="menu-fan">
        {DESKTOP_FAN.map(({ id, rot, delay, x, y }) => (
          <div key={id} className="menu-card" style={{ "--r": `${rot}deg`, animationDelay: `${delay}s`, left: x, top: y }}>
            <PluginCard id={id} />
          </div>
        ))}
      </div>
      {confirm}
    </main>
  );
}
