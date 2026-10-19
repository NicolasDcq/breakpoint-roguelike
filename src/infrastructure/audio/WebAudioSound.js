// Adaptateur : sons du jeu (Web Audio) et bouton muet.
// L'interface appelle play("deploy"), play("activate", 3)…
import { isMuted, onMuteChange, setMuted, sfx } from "./sfx.js";

export const webAudioSound = {
  play(name, ...args) {
    sfx[name]?.(...args);
  },
  isMuted,
  setMuted,
  onMuteChange,
};

/** Sans son : pour les tests. */
export const silentSound = { play() {}, isMuted: () => true, setMuted() {}, onMuteChange: () => () => {} };
