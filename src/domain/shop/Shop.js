// La boutique entre deux contrats : des Plugins (tirés selon leur rareté), l'arrivage de
// paquets (voir catalog/packs.js) et des services. Service du domaine : tirages et prix.

import { PLUGINS, PLUGIN_IDS } from "../catalog/plugins.js";
import { RULES } from "../catalog/rules.js";

export const OfferKind = Object.freeze({ PLUGIN: "plugin" });

const offer = (kind, id, price) => ({ kind, id, price, sold: false });
const rarityWeight = (pluginId) => RULES.rarityWeights[PLUGINS[pluginId].rarity];

/** Tire les Plugins de la boutique parmi tous ceux qu'on n'a pas, selon leur rareté. */
export function rollOffers(rng, ownedPluginIds) {
  const free = PLUGIN_IDS.filter((id) => !ownedPluginIds.includes(id));
  return rng.weightedSample(free, rarityWeight, RULES.shop.plugins).map((id) => offer(OfferKind.PLUGIN, id, PLUGINS[id].price));
}

/** Prix pour retirer un module du parc. */
export const removalPrice = (pluginIds, currentPrice) =>
  (pluginIds.some((id) => PLUGINS[id].freeRemoval) ? 0 : currentPrice);
