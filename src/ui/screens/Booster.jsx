// Boosters de plans d'architecture : l'offre en boutique et l'ouverture du paquet.
// Même mise en scène que les paquets de mises à jour de l'ancien jeu.

import { useEffect, useRef, useState } from "react";
import { ARCHITECTURE_BY_ID, RULES, architectureBase } from "../../domain/index.js";
import { useGame } from "../GameContext.jsx";
import { fmtDec } from "../format.js";
import { ARCHITECTURE_ACCENT } from "../visuals.js";
import { ArchitectureDiagram, ARCHITECTURE_HINTS } from "../components/ArchitectureDiagram.jsx";

/** Bord en dents de scie d'un paquet. */
function zigzagClip(width, height, teeth) {
  const step = width / teeth;
  const top = [];
  const bottom = [];
  for (let index = 0; index <= teeth; index++) {
    const x = (index * step).toFixed(1);
    top.push(`${x}px ${index % 2 === 0 ? 0 : 5}px`);
    bottom.push(`${x}px ${index % 2 === 0 ? height : height - 5}px`);
  }
  return `polygon(${[...top, ...bottom.reverse()].join(",")})`;
}
const PACK_CLIP = zigzagClip(150, 214, 25);

function BoosterArt({ scale = 1, shake = false }) {
  return (
    <div className={`pk pk-arch ${shake ? "shake" : ""}`} style={{ transform: `scale(${scale})` }} aria-hidden="true">
      <div className="pk-edge" style={{ clipPath: PACK_CLIP }} />
      <div className="pk-body" style={{ clipPath: PACK_CLIP }} />
      <div className="pk-label">
        <span className="pk-glyph">▦</span>
        <b>BOOSTER DE<br />PLANS</b>
        <span className="pk-count">{RULES.booster.choices} PLANS · 1 GARDÉ</span>
      </div>
    </div>
  );
}

/** Dans la boutique : les boosters encore disponibles. */
export function BoosterOffers({ view, onOpen }) {
  const price = RULES.booster.price;
  const affordable = view.money >= price;
  return (
    <div className="pack-arrivage">
      <span className="pack-arrivage-title">Arrivage · {RULES.booster.perShop} boosters par boutique · la relance ne les renouvelle pas</span>
      {Array.from({ length: RULES.booster.perShop }, (_, index) => {
        const available = index < view.boostersLeft;
        return (
          <div key={index} className={`pack-sheet ${available ? "" : "done"}`}>
            <div className="pack-thumb">{available ? <BoosterArt scale={0.5} /> : <span className="pack-empty">▦</span>}</div>
            <div className="pack-text">
              <span className="pack-name">Booster de plans d’architecture</span>
              <span className="pack-effect">
                {available
                  ? `${RULES.booster.choices} plans tirés au hasard : tu en gardes un (+1 niveau à cette architecture), ou aucun.`
                  : "Ouvert. Nouvel arrivage à la prochaine boutique."}
              </span>
            </div>
            {available && (
              <button className={`pack-buy ${affordable ? "" : "short"}`} disabled={!affordable} onClick={onOpen}>
                <span className="num">{price} $</span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

const prefersReducedMotion = () => globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
const REVEAL_MS = 1500;
const SETTLE_MS = 1100;

/** L'ouverture : le paquet tremble, s'ouvre, puis on choisit un plan. */
export function BoosterOpening({ view, onPick }) {
  const { sound } = useGame();
  const reduced = useRef(prefersReducedMotion()).current;
  const [stage, setStage] = useState(reduced ? "cards" : "pack");
  const [ready, setReady] = useState(reduced);
  const [chosen, setChosen] = useState(null);
  const [taken, setTaken] = useState(null);

  useEffect(() => {
    if (stage !== "pack") return undefined;
    sound.play("pack");
    const timer = setTimeout(() => setStage("cards"), REVEAL_MS);
    return () => clearTimeout(timer);
  }, [stage, sound]);
  useEffect(() => {
    if (stage !== "cards") return undefined;
    sound.play("reveal");
    if (reduced) return undefined;
    const timer = setTimeout(() => setReady(true), SETTLE_MS);
    return () => clearTimeout(timer);
  }, [stage, reduced, sound]);

  const take = () => {
    if (!chosen || taken) return;
    setTaken(chosen);
    sound.play("upgrade");
    setTimeout(() => onPick(chosen), reduced ? 0 : 650);
  };

  return (
    <div className="overlay pack-overlay" role="dialog" aria-modal="true" aria-label="Booster de plans d'architecture">
      {stage === "pack" ? (
        <button className="pack-stage" onClick={() => setStage("cards")} aria-label="Ouvrir le booster">
          <span className="pack-glow" />
          <span className="pack-drop"><BoosterArt shake /></span>
          <span className="pack-burst" />
          <span className="pack-ring" />
          <span className="pack-tap">Touche pour ouvrir</span>
        </button>
      ) : (
        <div className={`pack-table ${taken ? "has-taken" : ""}`}>
          <h2 className="pack-title">Choisis un plan</h2>
          <div className="pack-cards">
            {view.boosterChoices.map((id, index) => {
              const architecture = ARCHITECTURE_BY_ID[id];
              const level = view.architectureLevels[id];
              const after = architectureBase(id, level + 1);
              return (
                <button
                  key={id}
                  className={`pack-card arch-card ${chosen === id ? "sel" : ""} ${taken === id ? "taken" : ""} ${taken && taken !== id ? "gone" : ""}`}
                  style={{ "--i": index, "--acc": ARCHITECTURE_ACCENT[id] }}
                  disabled={!ready || Boolean(taken)}
                  onClick={() => { sound.play("click"); setChosen(id); }}
                  aria-pressed={chosen === id}
                >
                  <span className="pc-flip">
                    <span className="pc-back"><i>BP</i></span>
                    <span className="pc-face">
                      <span className="pc-shine" />
                      <span className="pc-band">
                        <span className="pc-kind">PLAN · NIV. {level} ➜ {level + 1}</span>
                        <b className="pc-name">{architecture.name}</b>
                      </span>
                      <ArchitectureDiagram id={id} />
                      <span className="pc-hint">{ARCHITECTURE_HINTS[id]}</span>
                      <span className="pc-gain num">+{architecture.perLevel[0]} ⚡ · +{architecture.perLevel[1]} ×</span>
                      <span className="pc-base">Base : {after.compute} ⚡ × {fmtDec(after.scale)}</span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="pack-actions">
            <button className="primary pack-take" disabled={!ready || !chosen || Boolean(taken)} onClick={take}>
              {chosen ? `Garder : ${ARCHITECTURE_BY_ID[chosen].name}` : "Touche un plan"}
            </button>
            <button className="ghost pack-pass" disabled={!ready || Boolean(taken)} onClick={() => onPick(null)}>Passer sans rien prendre</button>
          </div>
        </div>
      )}
    </div>
  );
}
