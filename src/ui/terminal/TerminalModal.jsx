// La fenêtre du Terminal : elle s'ouvre, tape la commande lettre par lettre, montre la sortie,
// puis applique l'effet. Pour cp, rm et ln -s, une main de modules tirée au hasard dans le parc
// s'affiche : on choisit puis on exécute (la commande n'est consommée qu'à ce moment).
// Sur téléphone, la fenêtre est plein écran, avec une croix de fermeture.

import { useEffect, useRef, useState } from "react";
import { ARCHITECTURE_BY_ID, COMMANDS, MODULES, architectureBase } from "../../domain/index.js";
import { refusalMessage } from "../messages.js";
import { fmtDec } from "../format.js";
import { tileClasses } from "../visuals.js";
import { ModuleFace } from "../components/ModuleFace.jsx";
import { cardLabel } from "./commandLook.js";

const prefersReducedMotion = () => globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
const ABORT = "terminal-abort";

/** L'effet d'une commande, montré sous le texte : crans, gros chiffre ou architecture. */
function Panel({ panel }) {
  if (!panel) return null;
  if (panel.kind === "pips") {
    return (
      <div className="tmx-panel">
        <div className="tmx-pips">
          {Array.from({ length: panel.lit }, (_, index) => <span key={index} className="tmx-pip" />)}
          <span className={`tmx-pip ${panel.added ? "new" : "ghost"}`} />
        </div>
        <div className="tmx-cap">{panel.label} : {panel.added ? `${panel.lit} → ${panel.lit + 1}` : panel.lit}</div>
      </div>
    );
  }
  if (panel.kind === "big") {
    return (
      <div className="tmx-panel tmx-big">
        <span className="tmx-big-label">{panel.label}</span>
        <span className="tmx-big-value" style={{ color: panel.color }}>{panel.value} {panel.unit}</span>
        {panel.gain > 0 && panel.done && <span className="tmx-big-gain">+{panel.gain}</span>}
        {panel.coins && Array.from({ length: 14 }, (_, index) => (
          <span key={index} className="tmx-coin" style={{ "--dx": `${(index * 37) % 240 - 120}px`, "--dy": `${-60 - (index * 53) % 70}px`, animationDelay: `${index * 40}ms` }} />
        ))}
        {panel.cap && <div className="tmx-cap">{panel.cap}</div>}
      </div>
    );
  }
  const { name, level, label, compute, scale, flash } = panel;
  return (
    <div className="tmx-panel">
      <div className={`tmx-arch ${flash ? "up" : ""}`}>
        <div className="tmx-arch-row"><span className="tmx-arch-name">{name}</span><span className="tmx-arch-lv">NIV {level}</span></div>
        <div className="tmx-arch-val">{compute} ⚡ × {fmtDec(scale)}</div>
        <div className="tmx-cap">{label}</div>
      </div>
    </div>
  );
}

/** Pose d'un module de la main : même tuile que sur le plateau. */
function HandTile({ card, selected, state, onToggle, locked }) {
  return (
    <div className={`slot drawer-slot filled parc-cell tmx-tile ${selected ? "sel" : ""} ${state ?? ""}`}>
      <button type="button" className={tileClasses(card)} onClick={onToggle} disabled={locked} aria-pressed={selected} aria-label={`${MODULES[card.moduleId].name} niveau ${card.level}`}>
        <ModuleFace card={card} />
      </button>
      {state === "dup" && <span className="tmx-badge">+1 EN PIOCHE</span>}
      {state === "joker" && <span className="tmx-badge joker">JOKER</span>}
    </div>
  );
}

/**
 * @param {object} props
 * @param {object} props.view  la vue de la partie
 * @param {{ slot: number, id: string, commandId: string, value: object }} props.session  la commande lancée
 * @param {object} props.game  le service
 * @param {(cancel: boolean) => void} props.onClose  cancel : la commande ciblée n'a pas été exécutée
 */
export function TerminalModal({ view, session, game, sound, showToast, onClose }) {
  const { id, commandId, value } = session;
  const command = COMMANDS[commandId];
  const targeted = Boolean(command.targets);
  const control = useRef({ gen: 0, fast: prefersReducedMotion() }); // gen change : la scène en cours s'arrête
  const bodyRef = useRef(null);
  const [lines, setLines] = useState([]);
  const [panel, setPanel] = useState(null);
  const [stage, setStage] = useState("run"); // run → (pick → run) → done
  const [selected, setSelected] = useState([]);
  const [states, setStates] = useState({});
  const handCards = useRef(targeted ? value.hand.map((uid) => view.parc.find((card) => card.uid === uid)).filter(Boolean) : []).current;
  const pickRef = useRef(null);
  const parcAtOpen = useRef(view.parc.length).current;
  const architectures = view.architecturePlays;

  const sleep = (ms) => {
    const gen = control.current.gen;
    return new Promise((resolve, reject) => {
      const settle = () => (control.current.gen === gen ? resolve() : reject(ABORT));
      if (control.current.fast) settle(); else setTimeout(settle, ms);
    });
  };
  const tween = (from, to, ms, set) => new Promise((resolve, reject) => {
    const gen = control.current.gen;
    if (control.current.fast) { set(to); resolve(); return; }
    const start = performance.now();
    const step = (now) => {
      if (control.current.gen !== gen) { reject(ABORT); return; }
      const t = Math.min(1, (now - start) / ms);
      set(Math.round(from + (to - from) * (1 - (1 - t) ** 3)));
      if (t < 1) requestAnimationFrame(step); else resolve();
    };
    requestAnimationFrame(step);
  });
  const push = (kind, text) => setLines((current) => [...current, { kind, text }]);
  const out = async (text, kind = "out", wait = 280) => { push(kind, text); await sleep(wait); };
  const type = async (text) => {
    push("cmd", "");
    for (let index = 1; index <= text.length; index++) {
      setLines((current) => current.map((line, at) => (at === current.length - 1 ? { ...line, text: text.slice(0, index), typing: index < text.length } : line)));
      await sleep(26 + Math.random() * 14);
    }
    await sleep(220);
  };

  // Les scènes des commandes sans cible : le texte, puis l'effet.
  const scenes = {
    ping: async () => {
      await type("ping -c 1 parc.local");
      await out("PING parc.local (10.0.0.1): 56 data bytes");
      await out("64 bytes from 10.0.0.1: time=0.4 ms");
      await out("1 packets transmitted, 1 received, 0% packet loss", "ok");
      const now = value.deploysLeft - 1;
      setPanel({ kind: "pips", label: "DÉPLOIEMENTS RESTANTS", lit: now, added: false });
      await sleep(600);
      setPanel({ kind: "pips", label: "DÉPLOIEMENTS RESTANTS", lit: now, added: true });
      await out("+1 déploiement pour ce contrat", "ok", 200);
    },
    ssh: async () => {
      await type("ssh -p 22 plateau@parc.local");
      await out("Authenticating with public key \"parc\"...");
      await out("Connexion établie. Une case supplémentaire est accordée.", "ok");
      const now = value.maxPlaced - 1;
      setPanel({ kind: "pips", label: "MODULES POSÉS AU PLUS", lit: now, added: false });
      await sleep(600);
      setPanel({ kind: "pips", label: "MODULES POSÉS AU PLUS", lit: now, added: true });
      await out("+1 module posé pour ce contrat", "ok", 200);
    },
    motherlode: async () => {
      await type("motherlode");
      await out(`balance: ${value.before} $`);
      await out("doublement en cours (plafond +20 $)...");
      const base = { kind: "big", label: "ARGENT", color: "#ffb020", unit: "$", gain: value.gain, cap: "PLAFOND : +20 $ AU PLUS", coins: !control.current.fast };
      setPanel({ ...base, value: value.before });
      await tween(value.before, value.after, 900, (current) => setPanel({ ...base, value: current }));
      setPanel({ ...base, value: value.after, done: true });
      await out(`balance: ${value.after} $`, "ok", 200);
    },
    mysqldump: async () => {
      await type("mysqldump --all-databases > parc.sql");
      push("out", "");
      for (let percent = 0; percent <= 100; percent += 10) {
        const full = percent / 10;
        setLines((current) => current.map((line, at) => (at === current.length - 1 ? { ...line, text: `-- dump ${"█".repeat(full)}${"░".repeat(10 - full)} ${percent}%` } : line)));
        await sleep(110);
      }
      await out(`-- ${value.before} ◆ lus, doublés (plafond +10 ◆)`, "out", 200);
      const base = { kind: "big", label: "DATA", color: "#b99bff", unit: "◆", gain: value.gain, cap: "PLAFOND : +10 ◆ AU PLUS" };
      setPanel({ ...base, value: value.before });
      await tween(value.before, value.after, 800, (current) => setPanel({ ...base, value: current }));
      setPanel({ ...base, value: value.after, done: true });
      await out(`-- dump terminé : ${value.after} ◆`, "ok", 200);
    },
    "apt upgrade": async () => {
      await type("apt upgrade");
      await out("Lecture des listes de paquets... Fait");
      await out("Architectures les plus jouées :", "out", 200);
      const ranked = Object.entries(architectures).filter(([, plays]) => plays > 0).sort((a, b) => b[1] - a[1]).slice(0, 3);
      for (const [archId, plays] of ranked) await out(`  ${ARCHITECTURE_BY_ID[archId].name.padEnd(18)} ${plays}×${archId === value.architectureId ? "   <- la plus jouée" : ""}`, archId === value.architectureId ? "ok" : "out", 200);
      await out(`Mise à niveau : ${ARCHITECTURE_BY_ID[value.architectureId].name} ${value.before} -> ${value.after}`, "out", 300);
      const before = architectureBase(value.architectureId, value.before);
      const after = architectureBase(value.architectureId, value.after);
      const base = { kind: "arch", name: ARCHITECTURE_BY_ID[value.architectureId].name, label: "BASE DE DÉPART DU DÉPLOIEMENT" };
      setPanel({ ...base, level: value.before, compute: before.compute, scale: before.scale });
      await sleep(500);
      await tween(0, 100, 700, (percent) => setPanel({ ...base, level: value.before, compute: Math.round(before.compute + (after.compute - before.compute) * percent / 100), scale: percent >= 100 ? after.scale : Math.floor(before.scale + (after.scale - before.scale) * percent / 100) }));
      setPanel({ ...base, level: value.after, compute: after.compute, scale: after.scale, flash: true });
      await out(`${ARCHITECTURE_BY_ID[value.architectureId].name} passe au niveau ${value.after}`, "ok", 200);
    },
  };

  /** Après le choix : la suite d'une commande ciblée. */
  const finishTargeted = async (picks, result) => {
    const labels = picks.map((uid) => cardLabel(handCards.find((card) => card.uid === uid)));
    const others = Object.fromEntries(handCards.filter((card) => !picks.includes(card.uid)).map((card) => [card.uid, "dim"]));
    if (commandId === "cp") {
      await type(`cp ${labels[0]} pioche/`);
      await out(`${labels[0]} -> pioche/${labels[0]}_copie`);
      setStates({ ...others, [picks[0]]: "dup" });
      await out(`1 module copié. Le parc passe à ${result.parcSize} cartes.`, "ok", 200);
    } else if (commandId === "rm") {
      await type(`rm ${labels.join(" ")}`);
      setStates({ ...others, ...Object.fromEntries(picks.map((uid) => [uid, "burn"])) });
      await out(`${picks.length} module${picks.length > 1 ? "s" : ""} supprimé${picks.length > 1 ? "s" : ""}`, "out", 700);
      await out(`Le parc passe à ${result.parcSize} cartes.`, "ok", 200);
    } else {
      await type(`ln -s '*' ${labels[0]}`);
      setStates({ ...others, [picks[0]]: "joker" });
      await out(`${labels[0]} compte maintenant comme n'importe quel module.`, "ok", 300);
      await out("Il garde ses propres effets, jusqu'à la fin du prochain contrat.", "out", 200);
    }
  };

  useEffect(() => {
    const ctl = control.current;
    (async () => {
      try {
        await sleep(450);
        if (id === "!!") {
          await type("!!");
          await out(commandId, "out", 350);
        }
        if (targeted) {
          await type(commandId);
          await out(commandId === "rm" ? "rm: choisis jusqu'à 2 modules dans ta main." : "Choisis un module dans ta main tirée au hasard.", "hint", 200);
          setStage("pick");
          const picked = await new Promise((resolve) => { pickRef.current = resolve; });
          setStage("run");
          await finishTargeted(picked.uids, picked.result);
        } else {
          await scenes[commandId]();
        }
        setStage("done");
      } catch (error) {
        if (error !== ABORT) throw error;
      }
    })();
    return () => { ctl.gen++; };
  }, []); // une seule fois : la fenêtre s'ouvre pour une commande

  useEffect(() => { bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight }); }, [lines, panel, stage]);

  const limit = command.targets?.max ?? 1;
  const toggle = (uid) => {
    sound.play("click");
    setSelected((current) => {
      if (current.includes(uid)) return current.filter((other) => other !== uid);
      if (current.length >= limit) { showToast(limit === 1 ? `Un seul module pour ${commandId}.` : `${limit} modules au plus pour ${commandId}.`); return current; }
      return [...current, uid];
    });
  };
  const execute = () => {
    if (!selected.length) { push("err", `${commandId}: opérande manquante. Touche un module.`); return; }
    const result = game.applyCommand(selected);
    if (!result.ok) { sound.play("error"); showToast(refusalMessage(result.reason, view)); return; }
    sound.play("upgrade");
    pickRef.current?.({ uids: selected, result: result.value });
    pickRef.current = null;
  };
  const close = () => onClose(stage === "pick");

  return (
    <div className="tmx-overlay" role="dialog" aria-modal="true" aria-label="Terminal" onKeyDown={(event) => event.key === "Escape" && close()}>
      <div className="tmx-window">
        <div className="tmx-bar">
          <span className="tmx-dots" aria-hidden="true"><i /><i /><i /></span>
          <span className="tmx-title">breakpoint@parc : ~</span>
          <button type="button" className="tmx-btn" onClick={() => { control.current.fast = true; }}>Accélérer</button>
          <button type="button" className="tmx-btn tmx-x" onClick={close} aria-label="Fermer le terminal">✕</button>
        </div>
        <div className="tmx-body" ref={bodyRef} aria-live="polite">
          {lines.map((line, index) => (
            <div key={index} className={`tmx-line ${line.kind}`}>
              {line.kind === "cmd" && <span className="tmx-ps">$</span>} <span>{line.text}</span>
              {line.typing && <span className="tmx-cursor" />}
            </div>
          ))}
          {targeted && (stage === "pick" || Object.keys(states).length > 0) && (
            <>
              <p className="tmx-handlabel">Main tirée au hasard · {handCards.length} modules sur {parcAtOpen}</p>
              <div className="tmx-hand">
                {handCards.map((card) => (
                  <HandTile
                    key={card.uid}
                    card={card}
                    selected={selected.includes(card.uid)}
                    state={states[card.uid]}
                    locked={stage !== "pick"}
                    onToggle={() => toggle(card.uid)}
                  />
                ))}
              </div>
            </>
          )}
          <Panel panel={panel} />
        </div>
        <div className="tmx-foot">
          {stage === "pick" && <button type="button" className="tmx-go" onClick={execute}>Exécuter {commandId}{selected.length ? ` (${selected.length})` : ""}</button>}
          {stage === "done" && <button type="button" className="tmx-go" onClick={() => onClose(false)} autoFocus>Fermer</button>}
        </div>
      </div>
    </div>
  );
}
