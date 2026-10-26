// Habillage visuel : couleurs, icônes, libellés. Rien ici ne change les règles.

import { FAMILIES, MODULES } from "../domain/index.js";
import { fmt, fmtDec } from "./format.js";

export const FAMILY_ACCENT = { calcul: "cyan", stockage: "violet", reseau: "pink", business: "amber", ops: "green" };
/** Couleur CSS de chaque famille. */
export const FAMILY_COLOR = { calcul: "var(--cyan)", stockage: "var(--violet)", reseau: "var(--rose)", business: "var(--amber)", ops: "var(--green)" };
export const FAMILY_GLYPHS = { calcul: "⚡", stockage: "◆", reseau: "⇄", business: "$", ops: "⚙" };
export const familyName = (familyId) => FAMILIES[familyId].name;

/** Classes d'une tuile de module, comme dans le reste du jeu. */
export function tileClasses(card) {
  const module = MODULES[card.moduleId];
  return `tile accent-${FAMILY_ACCENT[module.family]} famtile-${module.family} kind-${module.producer ? "producer" : "utility"}`;
}

/** Pastille des lignes d'effet. */
export const LINE_CLASS = { compute: "el-c", scale: "el-s", data: "el-d", money: "el-b", retrigger: "el-r", boost: "el-x" };

export const RARITY_LABELS = { common: "Commun", uncommon: "Peu commun", rare: "Rare", epic: "Épique", legendary: "Légendaire" };


/** Résumé court d'un module pour sa tuile. */
export const moduleSummary = (card) => MODULES[card.moduleId].lines(card.level).map((line) => line.value).join(" · ");

/** Lignes de la bulle qui monte d'une case activée. */
export function popupLines(event) {
  if (event.failure) return [{ tone: "fail", text: event.failure }];
  const { compute, scale, data, money } = event.output;
  const lines = [
    compute && { tone: "compute", text: `+${fmt(compute)} ⚡` },
    scale && { tone: "scale", text: `+${fmtDec(scale)} ×` },
    data && { tone: "data", text: `+${fmt(data)} ◆` },
    money && { tone: "budget", text: `+${fmt(money)} $` },
    event.multiplier > 1 && { tone: "mult", text: `×${fmtDec(event.multiplier)}` },
  ].filter(Boolean);
  return lines.length ? lines : [{ tone: "boost", text: event.isRetrigger ? "↺" : "✓" }];
}

/** Couleur des plans d'architecture, de la plus simple à la plus forte. */
export const ARCHITECTURE_ACCENT = {
  monolithe: "var(--green)", redondance: "var(--cyan)", double: "var(--cyan)",
  cluster: "var(--violet)", fullstack: "var(--violet)", stack: "var(--violet)",
  hautedispo: "var(--rose)", ferme: "var(--rose)", datacenter: "var(--amber)", cinqneufs: "var(--amber)",
};
