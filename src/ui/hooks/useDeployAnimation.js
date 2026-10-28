// Animation d'un déploiement : d'abord la base (l'architecture), puis chaque case
// qui s'active fait monter la formule. À la fin, le déploiement est joué pour de vrai.
// Vitesse ×1, ×2, ×3 (réglage du menu, gardé pour toutes les parties), et « Passer » pour aller au résultat.

import { useCallback, useRef, useState } from "react";
import { ARCHITECTURE_BY_ID } from "../../domain/index.js";
import { fmtDec } from "../format.js";
import { popupLines } from "../visuals.js";
import { loadSpeed, saveSpeed } from "../gameSpeed.js";

const prefersReducedMotion = () => globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

export const TIMING = { base: 900, perActivation: 420, perPlugin: 380, end: 600 };

let fireKey = 0;

/** Ce qu'affiche la bulle d'un Plugin qui s'active : « ×1,5 », « +15 ⚡ », « +0,3 × », « +1 ◆ ». */
function firingOf(entry) {
  const key = ++fireKey;
  if (entry.mult) return { key, kind: "mult", text: `×${fmtDec(entry.mult)}` };
  if (entry.scaleTimes > 1) return { key, kind: "scale", text: `×${fmtDec(entry.scaleTimes)}` };
  if (entry.compute > 0) return { key, kind: "compute", text: `+${fmtDec(entry.compute)} ⚡` };
  if (entry.scale > 0) return { key, kind: "scale", text: `+${fmtDec(entry.scale)} ×` };
  if (entry.data > 0) return { key, kind: "data", text: `+${entry.data} ◆` };
  return { key, kind: "retry", text: "↻" };
}
const firingMap = (entries) => (entries.length ? Object.fromEntries(entries.map((entry) => [entry.id, firingOf(entry)])) : null);

export function useDeployAnimation({ game, sound, preferences }) {
  const [animation, setAnimation] = useState(null);
  const running = useRef(false);
  const speed = useRef(1);
  const skipped = useRef(false);

  const wait = (ms) => (skipped.current ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, ms / speed.current)));

  const setSpeed = useCallback((value) => {
    speed.current = value;
    saveSpeed(preferences, value);
    setAnimation((previous) => (previous ? { ...previous, speed: value } : previous));
  }, [preferences]);
  const skip = useCallback(() => { skipped.current = true; }, []);

  const play = useCallback(async () => {
    if (running.current) return null;
    running.current = true;
    speed.current = loadSpeed(preferences); // le réglage du menu, ou celui changé pendant le dernier déploiement
    skipped.current = prefersReducedMotion();
    const result = game.previewDeploy();
    const { architecture } = result;
    let compute = architecture.compute;
    let scale = architecture.scale;
    const formula = () => ({ compute, scale: Math.round(scale * 100) / 100, score: Math.round(compute * scale) });
    const basePop = { key: "base", cell: null, lines: [{ tone: "boost", text: ARCHITECTURE_BY_ID[architecture.id].name }, { tone: "compute", text: `${architecture.compute} ⚡` }, { tone: "scale", text: `× ${fmtDec(architecture.scale)}` }] };
    if (!skipped.current) sound.play("deploy");
    setAnimation({ step: 0, speed: speed.current, formula: formula(), highlight: architecture.members, flash: true, pops: [basePop], firing: null, pluginFiring: null, fired: [] });
    await wait(TIMING.base);
    for (const [index, event] of result.events.entries()) {
      if (skipped.current) break;
      if (!event.failure) {
        compute += event.output.compute;
        scale += event.output.scale;
      }
      sound.play(event.failure ? "fail" : event.isRetrigger ? "retrigger" : "activate", index, event.isRetrigger);
      const pop = { key: `e${index}`, cell: event.cell, lines: popupLines(event) };
      setAnimation((previous) => ({ ...previous, step: index + 1, flash: false, formula: formula(), firing: { cell: event.cell, failure: event.failure }, pluginFiring: firingMap(event.plugins ?? []), pops: [...previous.pops.slice(-6), pop] }));
      await wait(TIMING.perActivation);
    }
    setAnimation((previous) => ({ ...previous, step: result.events.length, firing: null, pluginFiring: null }));
    for (const entry of result.endEvents ?? []) {
      if (skipped.current) break;
      sound.play("joker");
      setAnimation((previous) => ({ ...previous, pluginFiring: firingMap([entry]) }));
      await wait(TIMING.perPlugin);
    }
    if (result.fired.length) sound.play("joker");
    sound.play("score", result.score > 0);
    setAnimation((previous) => ({ ...previous, step: result.events.length, firing: null, pluginFiring: null, fired: result.fired, done: true, formula: { compute: result.compute, scale: result.scale, score: result.score } }));
    await wait(TIMING.end);
    const outcome = game.deploy();
    setAnimation(null);
    running.current = false;
    return outcome.ok ? result : null;
  }, [game, sound, preferences]);

  return { animation, play, setSpeed, skip };
}
