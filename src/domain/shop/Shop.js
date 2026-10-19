// La boutique entre deux contrats : des modules, des Plugins et des mises à jour
// d'architecture. Service du domaine : il tire les offres et donne les prix.

import { MODULES, MODULE_IDS } from "../catalog/modules.js";
import { PLUGINS, PLUGIN_IDS } from "../catalog/plugins.js";
import { ARCHITECTURE_IDS } from "../catalog/architectures.js";
import { RULES } from "../catalog/rules.js";

export const OfferKind = Object.freeze({ MODULE: "module", PLUGIN: "plugin", ARCHITECTURE: "architecture" });

const offer = (kind, id, price) => ({ kind, id, price, sold: false });

/** Tire les offres de la boutique. Les Plugins déjà possédés ne reviennent pas. */
export function rollOffers(rng, ownedPluginIds) {
  const { modules, plugins, architectureUpdates } = RULES.shop;
  const freePlugins = PLUGIN_IDS.filter((id) => !ownedPluginIds.includes(id));
  return [
    ...rng.sample(MODULE_IDS, modules).map((id) => offer(OfferKind.MODULE, id, MODULES[id].price)),
    ...rng.sample(freePlugins, plugins).map((id) => offer(OfferKind.PLUGIN, id, PLUGINS[id].price)),
    ...rng.sample(ARCHITECTURE_IDS, architectureUpdates).map((id) => offer(OfferKind.ARCHITECTURE, id, RULES.architectureUpdatePrice)),
  ];
}

/** Prix pour retirer un module du parc. */
export const removalPrice = (pluginIds, currentPrice) =>
  (pluginIds.some((id) => PLUGINS[id].freeRemoval) ? 0 : currentPrice);
