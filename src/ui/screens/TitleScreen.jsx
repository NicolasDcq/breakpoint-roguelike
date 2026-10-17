// Écran titre : menu, règles, difficulté, entreprise.

import { useEffect, useState } from "react";
import { COMPANIES } from "../../engine/companies.js";
import { DIFFICULTIES, MAX_DIFFICULTY, difficultyInfo } from "../../engine/difficulty.js";
import { isTutorialDone } from "../../tutorial/tutorial.js";
import { TutorialWelcome } from "../../tutorial/TutorialOverlay.jsx";
import {
  CompanyCarousel,
  CompanyGrid,
  CompanyIcon,
  STAKE_COLORS,
  isCompanyAvailable,
} from "../companies/Companies.jsx";
import { PickStarter } from "./PickStarter.jsx";

export function RulesList() {
  return (
    <ol className="rules">
      <li>
        <b>Un contrat = un objectif de Performance</b>
        {" à atteindre en quelques déploiements. Les scores des déploiements s’additionnent."}
      </li>
      <li>
        <b>Performance = Compute ⚡ × Scale.</b>
        {" Les modules produisent du Compute et du Scale à chaque déploiement, puis tout repart à zéro."}
      </li>
      <li>
        <b>Les modules s’activent dans l’ordre des numéros</b>
        {" (1 → 25). L’ordre et les voisins comptent : une API a besoin de Data produite "}
        <i>avant</i>
        {" elle, un Cache booste le module "}
        <i>suivant</i>
        .
      </li>
      <li>
        <b>Budget $ et Data ◆ se gardent d’un contrat à l’autre.</b>
        {" Le Budget achète, la Data améliore les modules ou se fait consommer par certains d’entre eux."}
      </li>
      <li>
        <b>8 versions de 3 contrats.</b>
        {" Le contrat C de chaque version est une livraison majeure : plus exigeant, mieux payé, et suivi d’une récompense. La baie gagne une 4e rangée à partir de la version 4."}
      </li>
      <li>
        <b>Les Plugins changent les règles.</b>
        {" Jusqu’à "}
        {5}
        , appliqués de gauche à droite. Construis ton architecture autour d’eux.
      </li>
    </ol>
  );
}

const LockIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

function LevelPicker({ level, maxUnlocked, onLevel, endless, endlessUnlocked, endlessBest, onEndless, won = 0, companyName }) {
  return (
    <section className="levels-pick" aria-label="Environnement">
      <h2 className="pick-title">Choisis ta difficulté</h2>
      <div className="level-grid" role="radiogroup">
        {DIFFICULTIES.map((i) => {
          let c = i.level > maxUnlocked;
          let p = DIFFICULTIES[i.level - 2];
          return (
            <button
              key={i.level}
              role="radio"
              aria-checked={!endless && i.level === level}
              aria-disabled={c}
              disabled={c}
              className={`level-tile ${!endless && i.level === level ? "on" : ""} ${c ? "locked" : ""}`}
              onClick={() => onLevel(i.level)}
              title={c && p
                ? `Gagne en ${p.name}${companyName ? ` avec ${companyName}` : ""} pour débloquer`
                : undefined}
            >
              <span
                className={`level-num num stake ${i.level <= won ? "won" : ""} ${i.level === 4 ? "dark" : ""}`}
                style={{ "--stake": STAKE_COLORS[i.level - 1] }}
              >
                {i.level}
              </span>
              <span className="level-name">{i.name}</span>
              {c
                ? <span className="level-lock"><LockIcon />LOCK</span>
                : <span className="level-rule">{i.rule}</span>}
            </button>
          );
        })}
        <button
          role="radio"
          aria-checked={endless}
          aria-disabled={!endlessUnlocked}
          disabled={!endlessUnlocked}
          className={`level-tile endless-tile ${endless ? "on" : ""} ${endlessUnlocked ? "" : "locked"}`}
          onClick={onEndless}
          title={endlessUnlocked
            ? undefined
            : `Gagne en ${DIFFICULTIES[MAX_DIFFICULTY - 1].name}${companyName ? ` avec ${companyName}` : ""} pour débloquer`}
        >
          <span className="level-num num">∞</span>
          <span className="level-name">Prod infinie</span>
          {endlessUnlocked
            ? (
              <span className="level-rule">
                Les règles d’
                {DIFFICULTIES[MAX_DIFFICULTY - 1].name}
                , sans fin : après la version 8, chaque version finit sur un boss.
                {endlessBest > 0
                  && <b className="endless-best">{" Record : version "}{endlessBest}.</b>}
              </span>
            )
            : <span className="level-lock"><LockIcon />LOCK</span>}
        </button>
      </div>
      <p className="dim small">
        Chaque environnement garde toutes les règles des précédents. Gagne une partie pour débloquer le suivant.
      </p>
    </section>
  );
}

export function TitleScreen({ choices, onPick, level, maxUnlocked, onLevel, devUnlock, onDevUnlock, company, access, onCompany, ...c }) {
  let [p, m] = useState("menu");
  let [y, v] = useState("carousel");
  useEffect(
    () => {
      window.scrollTo(0, 0);
    },
    [p, y],
  );
  let w = c.endless ? "∞ Prod infinie" : `${level}. ${difficultyInfo(level).name}`;
  let T = COMPANIES[company];
  let te = isCompanyAvailable(access, company);
  let H = p === "company" ? 1 : p === "env" ? 2 : 3;
  return p === "menu"
    ? (
      <div className="title-screen menu-screen">
        <div className="title-inner">
          <div className="menu-chips" aria-hidden="true">
            <span className="menu-chip fam-c" style={{ "--r": "-10deg" }}>
              <i />
              <b>Serveur</b>
            </span>
            <span className="menu-chip fam-s big" style={{ "--r": "0deg" }}>
              <i />
              <b>Base de données</b>
            </span>
            <span className="menu-chip fam-r" style={{ "--r": "10deg" }}>
              <i />
              <b>Load Balancer</b>
            </span>
          </div>
          <h1 className="logo">BREAKPOINT</h1>
          <p className="tagline">un roguelike de mise en prod</p>
          <p className="pitch">
            Construis ton architecture, fais tourner ton économie, recrute des Plugins improbables et livre 8 versions de 3 contrats de plus en plus absurdes.
          </p>
          <button className="deploy play-btn" onClick={() => m("company")}>Jouer</button>
          {c.onTutorial
            && (isTutorialDone()
              ? (
                <button className="ghost tz-menu-btn" onClick={c.onTutorial}>
                  Tutoriel avec Loup Niel
                </button>
              )
              : <TutorialWelcome onStart={c.onTutorial} />)}
          <details className="rules-fold"><summary>Comment jouer</summary><RulesList /></details>
          <label className="dev-toggle">
            <input
              type="checkbox"
              checked={devUnlock}
              onChange={(N) => onDevUnlock(N.target.checked)}
            />
            <span className="dev-switch" aria-hidden="true" />
            <span>
              <b>Mode dev</b>
              {" : toutes les entreprises, tous les environnements et la Prod infinie débloqués pour tester. Désactivé, seuls ceux que tu as vraiment débloqués restent ouverts."}
            </span>
          </label>
        </div>
      </div>
    )
    : (
      <div className="title-screen step-screen">
        <div className="title-inner">
          <div className="step-bar">
            <button
              className="ghost step-back"
              onClick={() => p === "company" && y === "grid"
                ? v("carousel")
                : m(p === "joker" ? "env" : p === "env" ? "company" : "menu")}
            >
              ← Retour
            </button>
            {p === "company"
              && y === "carousel"
              && <button className="ghost step-back" onClick={() => v("grid")}>▦ Toutes</button>}
            <span className="step-count">{"Étape "}{H}{" / 3"}</span>
          </div>
          {p === "company"
            ? (
              <>
                <h2 className="pick-title">
                  {y === "grid" ? "Toutes les entreprises" : "Choisis ton entreprise"}
                </h2>
                {y === "grid"
                  ? (
                    <CompanyGrid
                      selected={company}
                      access={access}
                      onSelect={(N) => {
                        onCompany(N);
                        v("carousel");
                      }}
                    />
                  )
                  : <CompanyCarousel selected={company} access={access} onSelect={onCompany} />}
                <button className="deploy play-btn" disabled={!te} onClick={() => m("env")}>
                  {te ? `Choisir ${T.name}` : "🔒 Verrouillée"}
                </button>
              </>
            )
            : p === "env"
              ? (
                <>
                  <div className="co-strip" style={{ "--co": T.color }}>
                    <span className="co-logo small"><CompanyIcon id={company} size={22} /></span>
                    <span className="co-strip-text">
                      <b>{T.name}</b>
                      <span>{"+ "}{T.plus}{" · − "}{T.minus}</span>
                    </span>
                    <span className="num gold">
                      {access.profile.companies[company].won}
                      /
                      {MAX_DIFFICULTY}
                      {" ✓"}
                    </span>
                  </div>
                  <LevelPicker
                    level={level}
                    maxUnlocked={maxUnlocked}
                    onLevel={onLevel}
                    won={access.profile.companies[company].won}
                    companyName={T.name}
                    {...c}
                  />
                  <button className="deploy play-btn" onClick={() => m("joker")}>
                    {"Continuer en "}
                    {w}
                  </button>
                </>
              )
              : (
                <>
                  <span className="env-badge">{T.name}{" · "}{w}</span>
                  <h2 className="pick-title">Choisis ton premier Plugin</h2>
                  <PickStarter ids={choices} onPick={onPick} />
                </>
              )}
        </div>
      </div>
    );
}
