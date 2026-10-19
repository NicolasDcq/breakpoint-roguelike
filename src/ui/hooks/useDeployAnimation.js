// Animation d'un déploiement : d'abord la base (l'architecture), puis chaque case
// qui s'active fait monter la formule. À la fin, le déploiement est joué pour de vrai.

import { useCallback, useRef, useState } from "react";
import { ARCHITECTURE_BY_ID, frNumber } from "../../domain/index.js";
import { outputColor, outputText } from "../visuals.js";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const prefersReducedMotion = () => globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

export const TIMING = { base: 900, perActivation: 420, end: 500 };

export function useDeployAnimation({ game, sound }) {
  const [animation, setAnimation] = useState(null);
  const running = useRef(false);

  const play = useCallback(async () => {
    if (running.current) return null;
    running.current = true;
    const result = game.previewDeploy();
    if (!prefersReducedMotion()) {
      const { architecture } = result;
      let compute = architecture.compute;
      let scale = architecture.scale;
      const formula = () => ({ compute, scale: Math.round(scale * 100) / 100, score: Math.round(compute * scale) });
      const basePop = { key: "base", cell: null, text: `${ARCHITECTURE_BY_ID[architecture.id].name} : ${architecture.compute} ⚡ × ${frNumber(architecture.scale)}` };
      sound.play("deploy");
      setAnimation({ step: 0, formula: formula(), highlight: architecture.members, flash: true, pops: [basePop], firing: null, fired: [] });
      await wait(TIMING.base);
      for (const [index, event] of result.events.entries()) {
        if (!event.failure) {
          compute += event.output.compute;
          scale += event.output.scale;
        }
        sound.play(event.failure ? "fail" : "activate", index, event.isRetrigger);
        const pop = { key: `e${index}`, cell: event.cell, text: outputText(event), color: outputColor(event), failure: Boolean(event.failure) };
        setAnimation((previous) => ({ ...previous, step: index + 1, flash: false, formula: formula(), firing: { cell: event.cell, failure: event.failure, step: index + 1 }, pops: [...previous.pops, pop] }));
        await wait(TIMING.perActivation);
      }
      if (result.fired.length) sound.play("joker");
      setAnimation((previous) => ({ ...previous, firing: null, fired: result.fired, formula: { compute: result.compute, scale: result.scale, score: result.score } }));
      await wait(TIMING.end);
    }
    const outcome = game.deploy();
    setAnimation(null);
    running.current = false;
    return outcome.ok ? result : null;
  }, [game, sound]);

  return { animation, play };
}
