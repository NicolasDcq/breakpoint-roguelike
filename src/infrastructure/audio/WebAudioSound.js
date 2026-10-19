// Adaptateur : sons du jeu (Web Audio). L'interface appelle play("deploy"), play("activate", 3)…
import { sfx } from "./sfx.js";

export const webAudioSound = {
  play(name, ...args) {
    sfx[name]?.(...args);
  },
};

/** Sans son : pour les tests. */
export const silentSound = { play() {} };
