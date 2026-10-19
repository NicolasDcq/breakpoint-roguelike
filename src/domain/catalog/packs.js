// Les paquets de l'arrivage : on paie, on ouvre, on garde une carte sur trois (ou aucune).
// La relance de la boutique ne renouvelle pas l'arrivage.
// - Colis de composants : 3 modules tirés parmi tous ; celui gardé rejoint le parc.
// - Booster de plans : 3 plans d'architecture ; celui gardé monte cette architecture d'un niveau.

import { ARCHITECTURE_IDS } from "./architectures.js";
import { MODULE_IDS } from "./modules.js";

const DEFINITIONS = {
  colis: { name: "Colis de composants", reward: "module", price: 4, perShop: 2, choices: 3, pool: MODULE_IDS },
  booster: { name: "Booster de plans d'architecture", reward: "architecture", price: 6, perShop: 2, choices: 3, pool: ARCHITECTURE_IDS },
};

export const PACKS = Object.freeze(Object.fromEntries(Object.entries(DEFINITIONS).map(([id, pack]) => [id, Object.freeze({ id, ...pack })])));
export const PACK_IDS = Object.keys(PACKS);

/** Les cartes d'un paquet : différentes, tirées au hasard dans son lot. */
export const drawPack = (rng, packId) => rng.sample(PACKS[packId].pool, PACKS[packId].choices);
