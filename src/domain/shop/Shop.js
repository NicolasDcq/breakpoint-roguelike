// La boutique entre deux contrats : des Plugins (tirés selon leur rareté), l'arrivage de
// paquets (voir catalog/packs.js) et des services. Service du domaine : tirages et prix.

import { PLUGINS, drawPlugins } from "../catalog/plugins.js";
import { PACK_IDS } from "../catalog/packs.js";
import { RULES } from "../catalog/rules.js";

export const OfferKind = Object.freeze({ PLUGIN: "plugin" });

const offer = (kind, id, price) => ({ kind, id, price, sold: false });

/** Tire les Plugins de la boutique parmi tous ceux qu'on n'a pas, selon leur rareté. */
export function rollOffers(rng, ownedPluginIds) {
  return drawPlugins(rng, ownedPluginIds, RULES.shop.plugins).map((id) => offer(OfferKind.PLUGIN, id, PLUGINS[id].price));
}

/** Les emplacements de paquets de l'arrivage : chacun tire son type au hasard (un type peut sortir deux fois). */
export function rollPackSlots(rng) {
  return Array.from({ length: RULES.shop.packSlots }, () => ({
    packId: rng.weightedSample(PACK_IDS, (id) => RULES.shop.packWeights[id], 1)[0],
    sold: false,
  }));
}

/** Prix pour retirer un module du parc. */
export const removalPrice = (pluginIds, currentPrice) =>
  (pluginIds.some((id) => PLUGINS[id].freeRemoval) ? 0 : currentPrice);
