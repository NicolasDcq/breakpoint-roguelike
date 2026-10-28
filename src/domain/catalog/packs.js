// Les paquets de l'arrivage : on paie, on ouvre, on garde une carte (ou aucune).
// La boutique a 2 emplacements ; chacun tire son type au hasard (RULES.shop.packWeights).
// La relance de la boutique ne renouvelle pas l'arrivage.
// - Colis de composants : 3 modules tirés parmi tous ; celui gardé rejoint le parc.
// - Booster de plans : 3 plans d'architecture ; celui gardé monte cette architecture d'un niveau.
// - Pack de Plugins : 2 Plugins (que le joueur n'a pas, selon leur rareté) ; celui gardé rejoint ses Plugins.
//   0,5 % de chance qu'un des deux soit légendaire (les légendaires ne se vendent pas en boutique).
// - Gros pack de Plugins : 3 Plugins dont un rare ou mieux au moins ; 1,5 % de chance d'un légendaire.
// - Pack Terminal : 1 commande tirée au hasard, sans choix ; elle rejoint le Terminal tout de suite.

import { ARCHITECTURE_IDS } from "./architectures.js";
import { MODULE_IDS } from "./modules.js";
import { drawPluginPack } from "./plugins.js";
import { COMMAND_IDS } from "./commands.js";

/** draw(rng, pluginIds) rend les `choices` cartes proposées à l'ouverture. */
const DEFINITIONS = {
  colis: { name: "Colis de composants", reward: "module", price: 4, choices: 3, draw: (rng) => rng.sample(MODULE_IDS, 3) },
  booster: { name: "Booster de plans d'architecture", reward: "architecture", price: 6, choices: 3, draw: (rng) => rng.sample(ARCHITECTURE_IDS, 3) },
  plugins: { name: "Pack de Plugins", reward: "plugin", price: 5, choices: 2, draw: (rng, pluginIds) => drawPluginPack(rng, pluginIds, 2, { legendaryChance: 0.005 }) },
  terminal: { name: "Pack Terminal", reward: "command", price: 3, choices: 1, draw: (rng) => rng.sample(COMMAND_IDS, 1) },
  gros: { name: "Gros pack de Plugins", reward: "plugin", price: 9, choices: 3, draw: (rng, pluginIds) => drawPluginPack(rng, pluginIds, 3, { guaranteeRare: true, legendaryChance: 0.015 }) },
};

export const PACKS = Object.freeze(Object.fromEntries(Object.entries(DEFINITIONS).map(([id, pack]) => [id, Object.freeze({ id, ...pack })])));
export const PACK_IDS = Object.keys(PACKS);

/** Les cartes d'un paquet : différentes, tirées au hasard. */
export const drawPack = (rng, packId, pluginIds = []) => PACKS[packId].draw(rng, pluginIds);
