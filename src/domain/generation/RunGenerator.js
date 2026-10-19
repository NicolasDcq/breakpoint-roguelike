// Génération procédurale d'une partie, à partir de sa graine.
// Tout ce qui rend une partie différente est tiré ici :
// - le profil de départ (le parc des 20 premiers modules) ;
// - le marché : les modules et Plugins que la boutique pourra vendre ;
// - les contrats : noms des clients, objectifs (± un peu) et boss des contrats C.

import { BASE_TARGETS, CLIENT_NAMES, LETTERS, TARGET_SPREAD, VERSIONS } from "../catalog/contracts.js";
import { BOSSES, BOSS_IDS } from "../catalog/bosses.js";
import { FAMILY_IDS } from "../catalog/families.js";
import { MODULE_IDS, familyOf } from "../catalog/modules.js";
import { PLUGIN_IDS } from "../catalog/plugins.js";
import { STARTERS, STARTER_IDS } from "../catalog/starters.js";
import { RULES } from "../catalog/rules.js";

const roundTo10 = (value) => Math.round(value / 10) * 10;

/** Le marché : une partie des modules de chaque famille, et une partie des Plugins. */
function drawMarket(rng) {
  const modules = FAMILY_IDS.flatMap((family) => {
    const ofFamily = MODULE_IDS.filter((id) => familyOf(id) === family);
    return rng.sample(ofFamily, Math.ceil(ofFamily.length * RULES.market.moduleShare));
  });
  return { modules, plugins: rng.sample(PLUGIN_IDS, RULES.market.plugins) };
}

function drawContracts(rng) {
  const bosses = rng.sample(BOSS_IDS, VERSIONS);
  return CLIENT_NAMES.flatMap((names, versionIndex) => {
    const picked = rng.sample(names, LETTERS.length);
    return LETTERS.map((letter, letterIndex) => {
      const index = versionIndex * LETTERS.length + letterIndex;
      const boss = letter === "C" ? bosses[versionIndex] : null;
      const spread = 1 + (rng.next() * 2 - 1) * TARGET_SPREAD;
      const target = roundTo10(BASE_TARGETS[index] * spread * (boss ? BOSSES[boss].targetFactor : 1));
      return Object.freeze({ version: versionIndex + 1, letter, name: picked[letterIndex], target, boss });
    });
  });
}

/** La recette d'une partie : à graine égale, recette égale. */
export function generateRun(rng) {
  const starterId = rng.sample(STARTER_IDS, 1)[0];
  return {
    starterId,
    startParc: STARTERS[starterId].parc,
    market: drawMarket(rng),
    contracts: drawContracts(rng),
  };
}
