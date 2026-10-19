// Habillage visuel : couleurs, icônes, libellés. Rien ici ne change les règles.

import { FAMILIES, MODULES } from "../domain/index.js";
import { fmt, fmtDec } from "./format.js";

export const FAMILY_ACCENT = { calcul: "cyan", stockage: "violet", reseau: "pink", business: "amber", ops: "green" };
export const FAMILY_GLYPHS = { calcul: "⚡", stockage: "◆", reseau: "⇄", business: "$", ops: "⚙" };
export const familyName = (familyId) => FAMILIES[familyId].name;

/** Classes d'une tuile de module, comme dans le reste du jeu. */
export function tileClasses(card) {
  const module = MODULES[card.moduleId];
  return `tile accent-${FAMILY_ACCENT[module.family]} famtile-${module.family} kind-${module.producer ? "producer" : "utility"}`;
}

/** Pastille des lignes d'effet. */
export const LINE_CLASS = { compute: "el-c", scale: "el-s", data: "el-d", money: "el-b", retrigger: "el-r", boost: "el-x" };

export const RARITY_LABELS = { common: "Commun", uncommon: "Peu commun", rare: "Rare" };

/** Allure de chaque Plugin : icône et couleurs du dessin. */
export const PLUGIN_LOOK = {
  intern: { emoji: "🎒", hue: ["#1d3f6b", "#3f7fd0"] },
  cloudarch: { emoji: "☁️", hue: ["#1d1f4f", "#5a4bb5"] },
  pairprog: { emoji: "👥", hue: ["#3d1f5a", "#8a4fc4"] },
  dba: { emoji: "🗄️", hue: ["#14513f", "#2fa37c"] },
  netops: { emoji: "📡", hue: ["#5a1840", "#c43f8a"] },
  growth: { emoji: "📈", hue: ["#123a5a", "#2f9ad0"] },
  minimal: { emoji: "🧘", hue: ["#5b4410", "#d6a334"] },
  sre: { emoji: "🧯", hue: ["#5a1818", "#d04a3f"] },
  accountant: { emoji: "🧮", hue: ["#6b5a12", "#e2c234"] },
  hoarder: { emoji: "🗃️", hue: ["#5a3418", "#b8742a"] },
  caffeine: { emoji: "☕", hue: ["#4a2a18", "#a0602a"] },
  janitor: { emoji: "🧹", hue: ["#1f4a3a", "#3fa080"] },
};

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
