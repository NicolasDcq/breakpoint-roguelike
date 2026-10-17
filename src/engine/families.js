// Les 5 familles de modules et leurs niveaux (paquets de mises à jour).

import { Rng } from "./rng.js";
import { frDecimal, round2 } from "./util.js";

export const FAMILY_LABELS = { calcul: "Calcul", stockage: "Stockage", reseau: "Réseau", business: "Business", ops: "Ops" };

export const FAMILIES = ["calcul", "stockage", "reseau", "business", "ops"];

export const FAMILY_BONUS = 0.1;

export const NETWORK_SCALE_PER_MODULE = 0.05;

export const OPS_SCALE_PER_LEVEL = 0.03;

export const PACK_CHOICES = 3;

export const PACK_PRICE = 5;

export function familyLevel(levels, family) {
  return Math.max(1, Math.floor(levels?.[family] ?? 1));
}

export function familyMultiplier(e) {
  return round2(1 + FAMILY_BONUS * (Math.max(1, e) - 1));
}

export function networkScaleBonus(e, t) {
  return round2(NETWORK_SCALE_PER_MODULE * (Math.max(1, e) - 1) * t);
}

export function opsRetriggerScale(e) {
  return round2(OPS_SCALE_PER_LEVEL * (Math.max(1, e) - 1));
}

export function drawPackFamilies(seed, salt, count = PACK_CHOICES) {
  let rng = new Rng((seed ^ Math.imul(salt + 7, 2246822507)) >>> 0);
  rng.next();
  return rng.shuffle(FAMILIES).slice(0, count);
}

export function familyBonusText(e) {
  switch (e) {
    case "calcul":
      return `+${FAMILY_BONUS * 100} % de Compute`;
    case "stockage":
      return `+${FAMILY_BONUS * 100} % de Data`;
    case "reseau":
      return `+${frDecimal(NETWORK_SCALE_PER_MODULE)} de Scale par module Réseau`;
    case "business":
      return `+${FAMILY_BONUS * 100} % de $`;
    case "ops":
      return `Réactivations : +${frDecimal(OPS_SCALE_PER_LEVEL)} de Scale par niveau`;
  }
}

export function familyTargetText(e) {
  return {
    calcul: "Tous les modules Calcul",
    stockage: "Tous les modules Stockage",
    reseau: "Tous les modules Réseau",
    business: "Tous les modules Business",
    ops: "Tous les modules Ops",
  }[e];
}
