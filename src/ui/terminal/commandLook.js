// Tout ce que l'interface sait des commandes du Terminal, en plus du catalogue du domaine :
// le code gravé sur la carte, la taille du texte de l'écran, le nom d'un module dans le terminal.

import { COMMAND_IDS, MODULES } from "../../domain/index.js";

/** « CMD-01 », « CMD-02 »… dans l'ordre du catalogue. */
export const COMMAND_CODE = Object.fromEntries(COMMAND_IDS.map((id, index) => [id, `CMD-${String(index + 1).padStart(2, "0")}`]));

/** Taille du texte de l'écran de la carte, pour que les noms longs (« apt upgrade ») tiennent. */
export const screenSize = (name) => (name.length > 9 ? 13 : name.length > 6 ? 16 : 21);

/** Le nom d'un module tel qu'on l'écrit dans le terminal : « serveur_12 ». */
export function cardLabel(card) {
  const name = MODULES[card.moduleId].name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${name}_${card.uid.replace(/\D/g, "")}`;
}
