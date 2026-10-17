// Goodies (équivalent des vouchers) et leurs effets.

import { PATCH_COSTS, UPGRADE_COSTS } from "./moduleView.js";
import { Rng } from "./rng.js";

export const GOODIES = {
  hoodie: {
    name: "Hoodie de la boîte",
    text: "+1 déploiement sur chaque contrat.",
    tier: 1,
    icon: "hoodie",
    color: "#3d7bff",
  },
  polaire: {
    name: "Polaire brodée",
    text: "Encore +1 déploiement sur chaque contrat.",
    tier: 2,
    requires: "hoodie",
    icon: "hoodie",
    color: "#3d7bff",
  },
  tote: {
    name: "Tote bag",
    text: "+1 emplacement de Plugin.",
    tier: 1,
    icon: "tote",
    color: "#2fb37a",
  },
  sacados: {
    name: "Sac à dos",
    text: "Encore +1 emplacement de Plugin.",
    tier: 2,
    requires: "tote",
    icon: "tote",
    color: "#2fb37a",
  },
  clavier: {
    name: "Clavier mécanique",
    text: "+1 module proposé dans chaque boutique.",
    tier: 1,
    icon: "clavier",
    color: "#8b5cf6",
  },
  split: {
    name: "Clavier split",
    text: "Encore +1 module proposé dans chaque boutique.",
    tier: 2,
    requires: "clavier",
    icon: "clavier",
    color: "#8b5cf6",
  },
  stickers: {
    name: "Stickers laptop",
    text: "La première relance de chaque boutique est gratuite.",
    tier: 1,
    icon: "stickers",
    color: "#ff4fb4",
  },
  planche: {
    name: "Planche de stickers",
    text: "Après la relance gratuite, les relances restent à 1 $ : leur prix ne monte plus.",
    tier: 2,
    requires: "stickers",
    icon: "stickers",
    color: "#ff4fb4",
  },
  badge: {
    name: "Badge de conférence",
    text: "Les éditions sortent 2 fois plus souvent en boutique.",
    tier: 1,
    icon: "badge",
    color: "#ffb020",
  },
  vip: {
    name: "Badge VIP",
    text: "Les éditions sortent 4 fois plus souvent en boutique.",
    tier: 2,
    requires: "badge",
    icon: "badge",
    color: "#ffb020",
  },
  gourde: {
    name: "Gourde",
    text: "+2 $ à chaque paie de contrat.",
    tier: 1,
    icon: "gourde",
    color: "#13b6e0",
  },
  thermos: {
    name: "Thermos",
    text: "+4 $ à chaque paie de contrat (au lieu de +2).",
    tier: 2,
    requires: "gourde",
    icon: "gourde",
    color: "#13b6e0",
  },
  casque: {
    name: "Casque antibruit",
    text: "Améliorer un module coûte 40 % de Data en moins.",
    tier: 1,
    icon: "casque",
    color: "#f07a2a",
  },
  anc: {
    name: "Réduction de bruit active",
    text: "La première amélioration de chaque contrat est gratuite (les autres restent à −40 %).",
    tier: 2,
    requires: "casque",
    icon: "casque",
    color: "#f07a2a",
  },
};

export const GOODIE_IDS = Object.keys(GOODIES);

export const hasGoodie = (e, t) => !!e && e.includes(t);

export function availableGoodies(e = []) {
  return GOODIE_IDS.filter((t) => !e.includes(t) && (!GOODIES[t].requires || e.includes(GOODIES[t].requires)));
}

export function goodieOfferFor(e, t, o = []) {
  let a = availableGoodies(o);
  return a.length
    ? new Rng((e ^ Math.imul(t + 1, 2654435761)) >>> 0).weighted(a, (n) => GOODIES[n].tier === 2 ? 2 : 3)
    : null;
}

export const GOODIE_PRICES = { 1: 12, 2: 18 };

export function goodiePrice(e, t = 0) {
  return GOODIE_PRICES[GOODIES[e].tier] + t;
}

export function extraDeploys(e) {
  return (hasGoodie(e, "hoodie") ? 1 : 0) + (hasGoodie(e, "polaire") ? 1 : 0);
}

export function extraPluginSlots(e) {
  return (hasGoodie(e, "tote") ? 1 : 0) + (hasGoodie(e, "sacados") ? 1 : 0);
}

export function extraShopModules(e) {
  return (hasGoodie(e, "clavier") ? 1 : 0) + (hasGoodie(e, "split") ? 1 : 0);
}

export function hasFreeRerolls(e) {
  return hasGoodie(e, "stickers");
}

export function hasCheapRerolls(e) {
  return hasGoodie(e, "planche");
}

export function editionChanceBonus(e) {
  return hasGoodie(e, "vip") ? 4 : hasGoodie(e, "badge") ? 2 : 1;
}

export function goodieIncome(e) {
  return hasGoodie(e, "thermos") ? 4 : hasGoodie(e, "gourde") ? 2 : 0;
}

export function upgradeCostFactor(e) {
  return hasGoodie(e, "casque") ? 0.6 : 1;
}

export function hasFreeUpgrade(e) {
  return hasGoodie(e, "anc");
}

export function upgradeCost(e, t) {
  let o = UPGRADE_COSTS[e];
  return o === null ? null : Math.ceil(o * upgradeCostFactor(t));
}

export function patchCost(e, t) {
  return Math.ceil(PATCH_COSTS[e] * upgradeCostFactor(t));
}
