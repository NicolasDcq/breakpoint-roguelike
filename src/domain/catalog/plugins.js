// Catalogue des Plugins : des effets permanents, comme les Jokers.
// Un Plugin choisit les moments où il agit (ses « crochets ») :
// - multiplier(card, ctx) : multiplie la production d'un producteur ;
// - afterActivation(card, ctx) : après l'activation d'un module ;
// - onRetrigger(ctx) : à chaque réactivation ;
// - atEnd(result, env) : à la fin du déploiement ;
// - contractInterest(money) : $ en plus quand un contrat est livré ;
// - freeRemoval : retirer un module du parc ne coûte rien.

import { familyOf } from "./modules.js";

const countFamily = (cards, family) => cards.filter((card) => familyOf(card.moduleId) === family).length;

const DEFINITIONS = {
  intern: {
    name: "Le Stagiaire", rarity: "common", price: 4, text: "+3 Compute par module posé.",
    atEnd: (result) => { result.compute += 3 * result.count; return true; },
  },
  cloudarch: {
    name: "L'Architecte Cloud", rarity: "uncommon", price: 6, text: "Les modules Calcul produisent ×1,5.",
    multiplier: (card) => (familyOf(card.moduleId) === "calcul" ? 1.5 : 1),
  },
  pairprog: {
    name: "Pair Programming", rarity: "uncommon", price: 5, text: "Un module qui a un voisin du même type produit ×2.",
    multiplier: (card, ctx) => (ctx.neighbors().some((other) => other.moduleId === card.moduleId) ? 2 : 1),
  },
  dba: {
    name: "La DBA", rarity: "common", price: 4, text: "Chaque module Stockage activé ajoute +1 ◆.",
    afterActivation: (card, ctx) => { if (familyOf(card.moduleId) === "stockage") ctx.bonusData(1); },
  },
  netops: {
    name: "Ingé Réseau", rarity: "uncommon", price: 5, text: "+0,4 Scale par module Réseau posé.",
    atEnd: (result) => {
      const count = countFamily(result.placed, "reseau");
      result.scale += 0.4 * count;
      return count > 0;
    },
  },
  growth: {
    name: "Growth Hacker", rarity: "rare", price: 6, text: "Scale ×1,5 si au moins 3 familles sont posées.",
    atEnd: (result) => {
      if (new Set(result.placed.map((card) => familyOf(card.moduleId))).size < 3) return false;
      result.scale *= 1.5;
      return true;
    },
  },
  minimal: {
    name: "Le Minimaliste", rarity: "uncommon", price: 5, text: "Si 3 modules ou moins sont posés : Compute ×2.",
    atEnd: (result) => {
      if (result.count > 3) return false;
      result.compute *= 2;
      return true;
    },
  },
  sre: {
    name: "La SRE", rarity: "uncommon", price: 5, text: "Chaque réactivation ajoute +0,3 Scale.",
    onRetrigger: (ctx) => ctx.bonusScale(0.3),
  },
  accountant: {
    name: "Le Comptable", rarity: "common", price: 4, text: "Fin de contrat : +1 $ par tranche de 5 $ en caisse (max +5).",
    contractInterest: (money) => Math.min(5, Math.floor(money / 5)),
  },
  hoarder: {
    name: "La Collectionneuse", rarity: "uncommon", price: 5, text: "+1 Compute par module de ton parc, à chaque déploiement.",
    atEnd: (result, env) => { result.compute += env.parcSize; return true; },
  },
  caffeine: {
    name: "Codeur sous Caféine", rarity: "common", price: 4, text: "Le premier module posé (plus petit numéro) produit ×3.",
    multiplier: (card, ctx) => (ctx.isFirstPlaced() ? 3 : 1),
  },
  janitor: {
    name: "Le Concierge", rarity: "common", price: 3, text: "Retirer un module du parc coûte 0 $.",
    freeRemoval: true,
  },
};

export const PLUGINS = Object.freeze(
  Object.fromEntries(Object.entries(DEFINITIONS).map(([id, def]) => [id, Object.freeze({ id, ...def })])),
);
export const PLUGIN_IDS = Object.keys(PLUGINS);

/** Ce que rapporte un Plugin revendu : la moitié de son prix, au moins 1 $. */
export const pluginSellPrice = (pluginId) => Math.max(1, Math.floor(PLUGINS[pluginId].price / 2));
