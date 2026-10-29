// La boutique entre deux contrats : des Plugins (tirés selon leur rareté), l'arrivage de
// paquets (voir catalog/packs.js) et des services. Service du domaine : tirages et prix.

import { PLUGINS, drawPlugins } from "../catalog/plugins.js";
import { PACK_IDS } from "../catalog/packs.js";
import { RULES } from "../catalog/rules.js";
import { COMMAND_IDS } from "../catalog/commands.js";

export const OfferKind = Object.freeze({ PLUGIN: "plugin", COMMAND: "command" });

const offer = (kind, id, price) => ({ kind, id, price, sold: false });

/**
 * Tire les offres de la boutique : des Plugins (selon leur rareté), mais une offre peut
 * devenir une commande du Terminal (RULES.shop.commandChance). Toutes les commandes coûtent le même prix.
 */
export function rollOffers(rng, ownedPluginIds) {
  return drawPlugins(rng, ownedPluginIds, RULES.shop.plugins).map((id) =>
    (rng.next() < RULES.shop.commandChance
      ? offer(OfferKind.COMMAND, rng.sample(COMMAND_IDS, 1)[0], RULES.terminal.price)
      : offer(OfferKind.PLUGIN, id, PLUGINS[id].price)));
}

/** Les emplacements de paquets de l'arrivage : chacun tire son type au hasard (un type peut sortir deux fois). */
export function rollPackSlots(rng, { firstShop = false } = {}) {
  const slots = Array.from({ length: RULES.shop.packSlots }, () => ({
    packId: rng.weightedSample(PACK_IDS, (id) => RULES.shop.packWeights[id], 1)[0],
    sold: false,
  }));
  // Première boutique : un Pack de Plugins garanti (le tirage est fait quand même, pour ne pas décaler le hasard).
  if (firstShop && !slots.some((slot) => slot.packId === "plugins")) slots[0] = { ...slots[0], packId: "plugins" };
  return slots;
}
