// L'arrivage de la boutique : 2 emplacements, chacun un colis de composants,
// un booster de plans ou un Pack de Plugins (tirés au hasard).
// Même mise en scène que l'ancien jeu : le paquet (ou le colis) s'ouvre, puis on garde
// une carte sur trois, ou aucune.

import { useEffect, useRef, useState } from "react";
import { ARCHITECTURE_BY_ID, FAMILIES, MODULES, PACKS, PLUGINS, RULES, architectureBase } from "../../domain/index.js";
import { useGame } from "../GameContext.jsx";
import { ModuleIcon } from "../common/ModuleIcon.jsx";
import { fmtDec } from "../format.js";
import { ARCHITECTURE_ACCENT, FAMILY_ACCENT, FAMILY_COLOR } from "../visuals.js";
import { PluginCard } from "../components/PluginCard.jsx";
import { CommandCard } from "../components/CommandCard.jsx";
import { MOBILE_QUERY, useMediaQuery } from "../hooks/useMediaQuery.js";
import { ReplacePluginModal } from "./ReplacePluginModal.jsx";
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
        <span className="pk-count">{PACKS.booster.choices} PLANS · 1 GARDÉ</span>
      </div>
    </div>
  );
}

function PluginPackArt({ scale = 1, shake = false, big = false }) {
  const pack = big ? PACKS.gros : PACKS.plugins;
  return (
    <div className={`pk pk-plg ${big ? "pk-big" : ""} ${shake ? "shake" : ""}`} style={{ transform: `scale(${scale})` }} aria-hidden="true">
      <div className="pk-edge" style={{ clipPath: PACK_CLIP }} />
      <div className="pk-body" style={{ clipPath: PACK_CLIP }} />
      <div className="pk-label">
        <span className="pk-glyph">⬢</span>
        <b>{big ? <>GROS PACK<br />DE PLUGINS</> : <>PACK DE<br />PLUGINS</>}</b>
        <span className="pk-count">{pack.choices} PLUGINS · 1 GARDÉ</span>
      </div>
    </div>
  );
}

/** Pack Terminal : une commande tirée au hasard, sans choix. */
function TerminalPackArt({ scale = 1, shake = false }) {
  return (
    <div className={`pk pk-term ${shake ? "shake" : ""}`} style={{ transform: `scale(${scale})` }} aria-hidden="true">
      <div className="pk-edge" style={{ clipPath: PACK_CLIP }} />
      <div className="pk-body" style={{ clipPath: PACK_CLIP }} />
      <div className="pk-label">
        <span className="pk-glyph">$_</span>
        <b>PACK<br />TERMINAL</b>
        <span className="pk-count">{PACKS.terminal.choices} COMMANDES · 1 GARDÉE</span>
      </div>
    </div>
  );
}

function BoxArt({ small, open }) {
  return (
    <div className={`zb ${small ? "zb-small" : ""} ${open ? "zb-open" : ""}`} aria-hidden="true">
      <div className="zb-fl l" />
      <div className="zb-fl r" />
      <div className="zb-front">
        <div className="zb-label"><b>LIVRAISON</b><small>{PACKS.colis.choices} MODULES · 1 À GARDER</small><i /></div>
        <div className="zb-stamp">FRAGILE</div>
      </div>
      <div className="zb-tape"><span>FRAGILE</span></div>
    </div>
  );
}

const PACK_LOOK = {
  gros: {
    thumb: () => <PluginPackArt scale={0.5} big />,
    effect: `${PACKS.gros.choices} Plugins dont un rare ou mieux : tu en gardes un, ou aucun.`,
    sheetClass: "plg-sheet big-sheet",
  },
  plugins: {
    thumb: () => <PluginPackArt scale={0.5} />,
    effect: `${PACKS.plugins.choices} Plugins tirés au hasard : tu en gardes un, ou aucun.`,
    sheetClass: "plg-sheet",
  },
  colis: {
    thumb: () => <div className="zbw"><BoxArt small /></div>,
    effect: `${PACKS.colis.choices} modules tirés parmi tous : tu en gardes un pour ton parc, ou aucun.`,
    sheetClass: "box-sheet",
  },
  terminal: {
    thumb: () => <TerminalPackArt scale={0.5} />,
    effect: `${PACKS.terminal.choices} commandes tirées au hasard : tu en gardes une, ou aucune (il faut un emplacement libre dans ton Terminal).`,
    sheetClass: "",
  },
  booster: {
    thumb: () => <BoosterArt scale={0.5} />,
    effect: `${PACKS.booster.choices} plans tirés au hasard : tu en gardes un (+1 niveau à cette architecture), ou aucun.`,
    sheetClass: "",
  },
};

/** Le paquet en grand (boutique sur ordinateur) : l'illustration de chaque genre de paquet. */
export function PackArt({ packId }) {
  if (packId === "colis") return <BoxArt />;
  if (packId === "booster") return <BoosterArt />;
  if (packId === "terminal") return <TerminalPackArt />;
  return <PluginPackArt big={packId === "gros"} />;
}

export const packEffect = (packId) => PACK_LOOK[packId].effect;

/** Dans la boutique : l'arrivage (2 emplacements tirés au hasard). */
export function PackOffers({ view, onBuy }) {
  return (
    <div className="pack-arrivage">
      <span className="pack-arrivage-title">Arrivage · {view.packSlots.length} emplacements tirés au hasard · la relance ne le renouvelle pas</span>
      {view.packSlots.map((slot, index) => {
        const pack = PACKS[slot.packId];
        const look = PACK_LOOK[slot.packId];
        const available = !slot.sold;
        const affordable = view.money >= pack.price;
        return (
          <div key={index} className={`pack-sheet ${look.sheetClass} ${available ? "" : "done"}`}>
            <div className="pack-thumb">{available ? look.thumb() : <span className="pack-empty">▣</span>}</div>
            <div className="pack-text">
              <span className="pack-name">{pack.name}</span>
              <span className="pack-effect">{available ? look.effect : "Ouvert. Nouvel arrivage à la prochaine boutique."}</span>
            </div>
            {available && (
              <button className={`pack-buy ${affordable ? "" : "short"}`} disabled={!affordable} onClick={() => onBuy(index)}>
                <span className="num">{pack.price} $</span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PlanFace({ id, view }) {
  const architecture = ARCHITECTURE_BY_ID[id];
  const level = view.architectureLevels[id];
  const after = architectureBase(id, level + 1);
  return (
    <>
      <span className="pc-band">
        <span className="pc-kind">PLAN · NIV. {level} ➜ {level + 1}</span>
        <b className="pc-name">{architecture.name}</b>
      </span>
      <ArchitectureDiagram id={id} />
      <span className="pc-hint">{ARCHITECTURE_HINTS[id]}</span>
      <span className="pc-gain num">+{architecture.perLevel[0]} ⚡ · +{architecture.perLevel[1]} ×</span>
      <span className="pc-base">Base : {after.compute} ⚡ × {fmtDec(after.scale)}</span>
    </>
  );
}

function ModuleFace({ id, view }) {
  const module = MODULES[id];
  const owned = view.parc.filter((card) => card.moduleId === id).length;
  return (
    <>
      <span className="pc-band">
        <span className="pc-kind">{FAMILIES[module.family].name.toUpperCase()}</span>
        <b className="pc-name">{module.name}</b>
      </span>
      <span className={`pc-module-icon accent-${FAMILY_ACCENT[module.family]}`}><ModuleIcon id={id} size={30} /></span>
      <span className="pc-hint">{module.lines(1).map((line) => line.text).join(" ")}</span>
      <span className="pc-base">{owned ? `Déjà ${owned} dans ton parc` : "Nouveau dans ton parc"}</span>
    </>
  );
}

function CommandFace({ id }) {
  return <CommandCard id={id} className="pc-cmd" />;
}

function PluginFace({ id }) {
  return <PluginCard id={id} className="pc-puce" />;
}

const RARITY_ACCENT = { common: "#9aa3b8", uncommon: "#2bd96b", rare: "#3d8bff", epic: "#a35cff", legendary: "#ffcf4a" };

const CHOICE = {
  gros: { title: "Choisis un Plugin", noun: "un Plugin", accent: (id) => RARITY_ACCENT[PLUGINS[id].rarity] ?? "#13b6e0", name: (id) => PLUGINS[id].name, Face: PluginFace },
  plugins: { title: "Choisis un Plugin", noun: "un Plugin", accent: (id) => RARITY_ACCENT[PLUGINS[id].rarity] ?? "#13b6e0", name: (id) => PLUGINS[id].name, Face: PluginFace },
  terminal: { title: "Choisis une commande", noun: "une commande", accent: () => "#2bd96b", name: (id) => id, Face: CommandFace },
  booster: { title: "Choisis un plan", noun: "un plan", accent: (id) => ARCHITECTURE_ACCENT[id], name: (id) => ARCHITECTURE_BY_ID[id].name, Face: PlanFace },
  colis: { title: "Choisis un module", noun: "un module", accent: (id) => FAMILY_COLOR[MODULES[id].family], name: (id) => MODULES[id].name, Face: ModuleFace },
};

const prefersReducedMotion = () => globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
const REVEAL_MS = 1500;
const SETTLE_MS = 1100;

/** L'ouverture d'un paquet : il s'ouvre au toucher, puis on choisit une carte. */
export function PackOpening({ view, onPick }) {
  const { sound } = useGame();
  const { packId, choices } = view.openPack;
  const choice = CHOICE[packId];
  const reduced = useRef(prefersReducedMotion()).current;
  const [stage, setStage] = useState(reduced ? "cards" : "pack");
  const [ready, setReady] = useState(reduced);
  const [chosen, setChosen] = useState(null);
  const [taken, setTaken] = useState(null);
  const [replacing, setReplacing] = useState(false);
  const desktop = !useMediaQuery(MOBILE_QUERY);
  const isPluginPack = PACKS[packId].reward === "plugin";
  const isCardPack = isPluginPack || packId === "terminal"; // cartes à puce (même gabarit)
  const full = isPluginPack && view.pluginIds.length >= RULES.maxPlugins;

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

  const finish = (replaceId = null) => {
    setTaken(chosen);
    sound.play("upgrade");
    setTimeout(() => onPick(chosen, replaceId), reduced ? 0 : 650);
  };
  const take = () => {
    if (!chosen || taken) return;
    if (full) setReplacing(true);
    else finish();
  };

  const stageArt = packId === "colis"
    ? <span className="box-drop"><BoxArt /></span>
    : <span className="pack-drop">{packId === "terminal" ? <TerminalPackArt shake /> : isPluginPack ? <PluginPackArt shake big={packId === "gros"} /> : <BoosterArt shake />}</span>;

  return (
    <div className={`overlay pack-overlay ${packId === "colis" ? "box-overlay" : ""}`} role="dialog" aria-modal="true" aria-label={PACKS[packId].name}>
      {stage === "pack" ? (
        <button className={`pack-stage ${packId === "colis" ? "box-stage" : ""}`} onClick={() => setStage("cards")} aria-label="Ouvrir">
          <span className="pack-glow" />
          {stageArt}
          {packId !== "colis" && <><span className="pack-burst" /><span className="pack-ring" /></>}
          <span className="pack-tap">Touche pour ouvrir</span>
        </button>
      ) : (
        <div className={`pack-table ${taken ? "has-taken" : ""}`}>
          <h2 className="pack-title">{choice.title}</h2>
          <div className={`pack-cards ${choices.length > 2 ? "n3" : ""}`}>
            {choices.map((id, index) => (
              <button
                key={id}
                className={`pack-card ${isCardPack ? "plg-card" : "arch-card"} ${chosen === id ? "sel" : ""} ${taken === id ? "taken" : ""} ${taken && taken !== id ? "gone" : ""}`}
                style={{ "--i": index, "--acc": choice.accent(id) }}
                disabled={!ready || Boolean(taken)}
                onClick={() => { sound.play("click"); setChosen(id); }}
                aria-pressed={chosen === id}
              >
                <span className="pc-flip">
                  <span className="pc-back"><i>BP</i></span>
                  <span className="pc-face">
                    <span className="pc-shine" />
                    <choice.Face id={id} view={view} />
                  </span>
                </span>
              </button>
            ))}
          </div>
          <div className="pack-actions">
            <button className="primary pack-take" disabled={!ready || !chosen || Boolean(taken)} onClick={take}>
              {chosen ? `Garder : ${choice.name(chosen)}` : `Touche ${choice.noun}`}
            </button>
            <button className="ghost pack-pass" disabled={!ready || Boolean(taken)} onClick={() => onPick(null)}>Passer sans rien prendre</button>
          </div>
        </div>
      )}
      {replacing && chosen && (
        <ReplacePluginModal
          view={view}
          desktop={desktop}
          offer={{ id: chosen, price: 0 }}
          onClose={() => setReplacing(false)}
          onReplace={(pluginId) => { setReplacing(false); finish(pluginId); }}
        />
      )}
    </div>
  );
}
