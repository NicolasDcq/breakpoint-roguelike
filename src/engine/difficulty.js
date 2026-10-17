// Les 8 niveaux de difficulté et leurs effets.

export const DIFFICULTIES = [
  { level: 1, name: "Dev", rule: "La partie de base." },
  { level: 2, name: "Recette", rule: "Objectifs +8 % par version (×1,56 en version 8)." },
  { level: 3, name: "Préprod", rule: "Tout coûte 1 $ de plus en boutique." },
  { level: 4, name: "Staging", rule: "Un emplacement de Plugin en moins (4 au lieu de 5)." },
  { level: 5, name: "Prod", rule: "La paie de fin de contrat baisse de 2 $." },
  {
    level: 6,
    name: "Prod critique",
    rule: "Objectifs +18 % par version au total (×2,26 en version 8).",
  },
  {
    level: 7,
    name: "Astreinte",
    rule: "Deux contraintes sur les contrats B et C à partir de la version 4.",
  },
  { level: 8, name: "Incident majeur", rule: "Boss : objectif ×1.5 et une contrainte de plus." },
];

export const MAX_DIFFICULTY = DIFFICULTIES.length;

export function difficultyInfo(e) {
  return DIFFICULTIES[Math.min(Math.max(e, 1), MAX_DIFFICULTY) - 1];
}

export function targetMultiplier(e, t) {
  return 1 + (e >= 6 ? 0.18 : e >= 2 ? 0.08 : 0) * Math.max(0, t - 1);
}

export function shopSurcharge(e) {
  return e >= 3 ? 1 : 0;
}

export function pluginSlotsFor(e) {
  return e >= 4 ? 4 : 5;
}

export function payPenalty(e) {
  return e >= 5 ? 2 : 0;
}

export const hasDoubleConstraints = (e) => e >= 7;

export const hasHardBoss = (e) => e >= 8;
