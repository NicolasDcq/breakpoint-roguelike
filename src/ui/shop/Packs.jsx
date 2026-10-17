// Arrivage : colis de Plugins, paquets de mises à jour et leur ouverture.

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { sfx } from "../../audio/sfx.js";
import {
  FAMILY_LABELS,
  PACK_CHOICES,
  familyBonusText,
  familyLevel,
  familyTargetText,
} from "../../engine/families.js";
import { FAMILY_GLYPHS } from "../../engine/modules.js";
import { PLUGINS } from "../../engine/plugins.js";
import { FX } from "../fx.jsx";
import { PluginCard } from "../plugins/PluginCard.jsx";

function zigzagClip(e, t, o) {
  let a = e / o;
  let r = [];
  let n = [];
  for (let l = 0; l <= o; l++) {
    let d = (l * a).toFixed(1);
    r.push(`${d}px ${l % 2 === 0 ? 0 : 5}px`);
    n.push(`${d}px ${l % 2 === 0 ? t : t - 5}px`);
  }
  return `polygon(${[...r, ...n.reverse()].join(",")})`;
}

const PACK_CLIP = zigzagClip(150, 214, 25);

function PackArt({ scale = 1, shake = false }) {
  return (
    <div
      className={`pk ${shake ? "shake" : ""}`}
      style={{ transform: `scale(${scale})` }}
      aria-hidden="true"
    >
      <div className="pk-edge" style={{ clipPath: PACK_CLIP }} />
      <div className="pk-body" style={{ clipPath: PACK_CLIP }} />
      <div className="pk-label">
        <span className="pk-glyph">▣</span>
        <b>PAQUET DE<br />MISES À JOUR</b>
        <span className="pk-count">{PACK_CHOICES}{" CARTES · 1 GARDÉE"}</span>
      </div>
    </div>
  );
}

export function Arrivals(p) {
  let arr = p.arr ?? ["update", "update"];
  let tk = p.taken ?? [false, false];
  return (
    <div className="pack-arrivage">
      {[
        <span className="pack-arrivage-title">
          Arrivage · 2 par boutique · la relance ne le renouvelle pas
        </span>,
        ...arr.map((kd, i) => kd === "box"
          ? (
            <BoxOffer
              key={i}
              {...p}
              available={!tk[i]}
              price={p.price + 1}
              onBuy={() => p.onBuySlot(i)}
            />
          )
          : <UpdateOffer key={i} {...p} available={!tk[i]} onBuy={() => p.onBuySlot(i)} />),
      ]}
    </div>
  );
}

function BoxArt({ small, open }) {
  return (
    <div className={`zb ${small ? "zb-small" : ""} ${open ? "zb-open" : ""}`}>
      <div className="zb-fl l" />
      <div className="zb-fl r" />
      <div className="zb-front">
        <div className="zb-label"><b>LIVRAISON</b><small>3 PLUGINS · 1 À GARDER</small><i /></div>
        <div className="zb-stamp">FRAGILE</div>
      </div>
      <div className="zb-tape"><span>FRAGILE</span></div>
    </div>
  );
}

function BoxOffer({ available, price, budget, disabled, onBuy }) {
  let n = budget >= price;
  return (
    <div className={`pack-sheet box-sheet ${available ? "" : "done"}`}>
      <div className="pack-thumb">
        {available
          ? <div className="zbw"><BoxArt small /></div>
          : <span className="pack-empty">▣</span>}
      </div>
      <div className="pack-text">
        <span className="pack-name">Colis de composants</span>
        {available
          ? (
            <>
              <span className="pack-effect">
                3 Plugins tirés selon leur rareté : tu en gardes un, ou aucun.
              </span>
              <span className="pack-note">Tiré au hasard dans l’arrivage</span>
            </>
          )
          : <span className="pack-effect">Pris. Nouvel arrivage à la prochaine boutique.</span>}
      </div>
      {available
        && (
          <button
            className={`pack-buy ${n ? "" : "short"}`}
            disabled={disabled || !n}
            onClick={onBuy}
          >
            <span className="num">{price}{" $"}</span>
          </button>
        )}
    </div>
  );
}

export function BoxOpening({ choices, full, onPick, onSkip }) {
  let RR = React;
  let [st2, setSt] = RR.useState("box");
  let [sel, setSel] = RR.useState(null);
  RR.useEffect(
    () => {
      if (st2 !== "cut") {
        return;
      }
      let v = setTimeout(
        () => {
          setSt("cards");
          sfx.reveal();
        },
        1100,
      );
      return () => clearTimeout(v);
    },
    [st2],
  );
  return (
    <div
      className="overlay pack-overlay box-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Colis de composants"
    >
      {st2 !== "cards"
        ? (
          <button
            className={`pack-stage box-stage ${st2 === "cut" ? "cutting" : ""}`}
            onClick={() => {
              if (st2 === "box") {
                sfx.pack();
                setSt("cut");
              }
            }}
            aria-label="Ouvrir le colis"
          >
            <span className="pack-glow" />
            <span className="box-drop"><BoxArt open={st2 === "cut"} /></span>
            <span className="box-cutter" />
            <span className="pack-tap">
              {st2 === "box" ? "Touche pour ouvrir le colis" : "Ouverture…"}
            </span>
          </button>
        )
        : (
          <div className="pack-table box-table">
            <h2 className="pack-title">Choisis un Plugin</h2>
            {full
              && (
                <p className="box-full">
                  Tes emplacements de Plugin sont pleins : passe, ou vends un Plugin avant d’ouvrir un colis.
                </p>
              )}
            <div className="box-cards">
              {choices.map((d, w) => (
                <button
                  key={d}
                  className={`box-card ${sel === d ? "sel" : ""}`}
                  style={{ "--i": w }}
                  onClick={() => {
                    sfx.click();
                    setSel(d);
                  }}
                  aria-pressed={sel === d}
                >
                  <PluginCard id={d} variant="offer" />
                </button>
              ))}
            </div>
            <div className="pack-actions">
              <button
                className="primary pack-take"
                disabled={!sel || full}
                onClick={() => {
                  sfx.upgrade();
                  onPick(sel);
                }}
              >
                {sel ? `Garder : ${PLUGINS[sel].name}` : "Touche un Plugin"}
              </button>
              <button className="ghost pack-pass" onClick={onSkip}>Passer sans rien prendre</button>
            </div>
          </div>
        )}
    </div>
  );
}

function UpdateOffer({ available, price, budget, disabled, onBuy }) {
  let n = budget >= price;
  return (
    <div className={`pack-sheet ${available ? "" : "done"}`}>
      <div className="pack-thumb">
        {available ? <PackArt scale={0.5} /> : <span className="pack-empty">▣</span>}
      </div>
      <div className="pack-text">
        <span className="pack-name">Paquet de mises à jour</span>
        {available
          ? (
            <>
              <span className="pack-effect">
                {PACK_CHOICES}
                {" familles tirées au hasard : tu en gardes une (+1 niveau), ou aucune."}
              </span>
              <span className="pack-note">Tiré au hasard dans l’arrivage</span>
            </>
          )
          : <span className="pack-effect">Pris. Nouvel arrivage à la prochaine boutique.</span>}
      </div>
      {available
        && (
          <button
            className={`pack-buy ${n ? "" : "short"}`}
            disabled={disabled || !n}
            onClick={onBuy}
          >
            <span className="num">{price}{" $"}</span>
          </button>
        )}
    </div>
  );
}

const prefersReducedMotion = () => typeof window < "u"
  && !!window.matchMedia
  && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const PACK_REVEAL_MS = 1500;

const PACK_SETTLE_MS = 1100;

export function PackOpening({ choices, levels, onPick, onSkip }) {
  let r = useRef(prefersReducedMotion()).current;
  let [n, l] = useState(r ? "cards" : "pack");
  let [d, u] = useState(r);
  let [i, c] = useState(null);
  let [p, m] = useState(null);
  useEffect(
    () => {
      if (n !== "pack") {
        return;
      }
      let v = window.setTimeout(() => l("cards"), PACK_REVEAL_MS);
      return () => window.clearTimeout(v);
    },
    [n],
  );
  useEffect(
    () => {
      if (n !== "cards" || (sfx.reveal(), r)) {
        return;
      }
      let v = window.setTimeout(() => u(true), PACK_SETTLE_MS);
      return () => window.clearTimeout(v);
    },
    [n, r],
  );
  let y = () => {
    if (!(!i || p)) {
      m(i);
      sfx.upgrade();
      window.setTimeout(() => onPick(i), r ? 0 : 650);
    }
  };
  return (
    <div
      className="overlay pack-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Paquet de mises à jour"
    >
      {n === "pack"
        ? (
          <button className="pack-stage" onClick={() => l("cards")} aria-label="Ouvrir le paquet">
            <span className="pack-glow" />
            <span className="pack-drop"><PackArt shake /></span>
            <span className="pack-burst" />
            <span className="pack-ring" />
            <span className="pack-tap">Touche pour ouvrir</span>
          </button>
        )
        : (
          <div className={`pack-table ${p ? "has-taken" : ""}`}>
            <h2 className="pack-title">Choisis une mise à jour</h2>
            <div className="pack-cards">
              {choices.map((v, w) => {
                let T = familyLevel(levels, v);
                return (
                  <button
                    key={v}
                    className={`pack-card fam-${v} ${i === v ? "sel" : ""} ${p === v ? "taken" : ""} ${p && p !== v ? "gone" : ""}`}
                    style={{ "--i": w }}
                    disabled={!d || !!p}
                    onClick={() => {
                      sfx.click();
                      c(v);
                    }}
                    aria-pressed={i === v}
                  >
                    <span className="pc-flip">
                      <span className="pc-back"><i>BP</i></span>
                      <span className="pc-face">
                        <span className="pc-shine" />
                        <span className="pc-kind">MISE À JOUR · FAMILLE</span>
                        <span className="pc-glyph">{FAMILY_GLYPHS[v]}</span>
                        <b className="pc-name">{FAMILY_LABELS[v]}</b>
                        <span className="pc-lv num">{"NIV. "}{T}{" ➜ "}{T + 1}</span>
                        <span className="pc-effect">{FX(familyBonusText(v))}</span>
                        <span className="pc-scope">{familyTargetText(v)}</span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="pack-actions">
              <button className="primary pack-take" disabled={!d || !i || !!p} onClick={y}>
                {i ? `Prendre : ${FAMILY_LABELS[i]}` : "Touche une carte"}
              </button>
              <button className="ghost pack-pass" disabled={!d || !!p} onClick={onSkip}>
                Passer sans rien prendre
              </button>
            </div>
          </div>
        )}
    </div>
  );
}
