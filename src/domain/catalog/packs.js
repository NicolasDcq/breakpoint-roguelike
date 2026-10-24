// Les paquets de l'arrivage : on paie, on ouvre, on garde une carte (ou aucune).
// La boutique a 2 emplacements ; chacun tire son type au hasard (RULES.shop.packWeights).
// La relance de la boutique ne renouvelle pas l'arrivage.
// - Colis de composants : 3 modules tirés parmi tous ; celui gardé rejoint le parc.
// - Booster de plans : 3 plans d'architecture ; celui gardé monte cette architecture d'un niveau.
// - Pack de Plugins : 2 Plugins (que le joueur n'a pas, selon leur rareté) ; celui gardé rejoint ses Plugins.

import { ARCHITECTURE_IDS } from "./architectures.js";
import { MODULE_IDS } from "./modules.js";
import { drawPlugins } from "./plugins.js";

/** draw(rng, pluginIds) rend les `choices` cartes proposées à l'ouverture. */
const DEFINITIONS = {
  colis: { name: "Colis de composants", reward: "module", price: 4, choices: 3, draw: (rng) => rng.sample(MODULE_IDS, 3) },
  booster: { name: "Booster de plans d'architecture", reward: "architecture", price: 6, choices: 3, draw: (rng) => rng.sample(ARCHITECTURE_IDS, 3) },
  plugins: { name: "Pack de Plugins", reward: "plugin", price: 5, choices: 2, draw: (rng, pluginIds) => drawPlugins(rng, pluginIds, 2) },
};

export const PACKS = Object.freeze(Object.fromEntries(Object.entries(DEFINITIONS).map(([id, pack]) => [id, Object.freeze({ id, ...pack })])));
export const PACK_IDS = Object.keys(PACKS);

/** Les cartes d'un paquet : différentes, tirées au hasard. */
export const drawPack = (rng, packId, pluginIds = []) => PACKS[packId].draw(rng, pluginIds);
