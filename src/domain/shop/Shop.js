// La boutique entre deux contrats : des modules, des Plugins et des boosters de plans
// d'architecture. Service du domaine : il tire les offres et donne les prix.

import { MODULES } from "../catalog/modules.js";
import { PLUGINS } from "../catalog/plugins.js";
import { ARCHITECTURE_IDS } from "../catalog/architectures.js";
import { RULES } from "../catalog/rules.js";

export const OfferKind = Object.freeze({ MODULE: "module", PLUGIN: "plugin" });

const offer = (kind, id, price) => ({ kind, id, price, sold: false });

/**
 * Tire les offres de la boutique, dans le marché de la partie.
 * Les Plugins déjà possédés ne reviennent pas.
 */
export function rollOffers(rng, ownedPluginIds, market) {
  const { modules, plugins } = RULES.shop;
  const freePlugins = market.plugins.filter((id) => !ownedPluginIds.includes(id));
  return [
    ...rng.sample(market.modules, modules).map((id) => offer(OfferKind.MODULE, id, MODULES[id].price)),
    ...rng.sample(freePlugins, plugins).map((id) => offer(OfferKind.PLUGIN, id, PLUGINS[id].price)),
  ];
}

/** Les plans d'un booster : des architectures différentes, tirées au hasard. */
export const drawBooster = (rng) => rng.sample(ARCHITECTURE_IDS, RULES.booster.choices);

/** Prix pour retirer un module du parc. */
export const removalPrice = (pluginIds, currentPrice) =>
  (pluginIds.some((id) => PLUGINS[id].freeRemoval) ? 0 : currentPrice);
