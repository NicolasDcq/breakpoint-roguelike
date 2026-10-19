// Habillage visuel : couleurs, icônes et libellés. Rien ici ne change les règles.

import { FAMILIES, MODULES, frNumber } from "../domain/index.js";

export const familyColor = (familyId) => `var(--${familyId})`;
export const moduleColor = (moduleId) => familyColor(MODULES[moduleId].family);
export const familyTag = (familyId) => FAMILIES[familyId].name.slice(0, 4).toUpperCase();

/** Classe de pastille selon le genre d'effet. */
export const PILL_CLASS = { compute: "c", scale: "s", data: "d", money: "b", retrigger: "r", boost: "x" };

export const PLUGIN_ICONS = {
  intern: "🎒", cloudarch: "☁️", pairprog: "👥", dba: "🗄️", netops: "📡", growth: "📈",
  minimal: "🧘", sre: "🧯", accountant: "🧮", hoarder: "🗃️", caffeine: "☕", janitor: "🧹",
};

/** Résumé court d'un module, pour les tuiles. */
export const moduleSummary = (moduleId, level) => MODULES[moduleId].lines(level).map((line) => line.value).join(" · ");

/** Texte court de ce qu'une activation a produit. */
export function outputText(event) {
  if (event.failure) return event.failure;
  const { compute, scale, data, money } = event.output;
  const parts = [
    compute && `+${compute}⚡`,
    scale && `+${frNumber(scale)}×`,
    data && `+${data}◆`,
    money && `+${money}$`,
  ].filter(Boolean);
  return (event.isRetrigger ? "↺ " : "") + (parts.join(" ") || "✓") + (event.multiplier > 1 ? ` (×${frNumber(event.multiplier)})` : "");
}

export function outputColor(event) {
  if (event.failure) return "var(--red)";
  const { compute, scale, data, money } = event.output;
  if (compute) return "var(--calcul)";
  if (scale) return "var(--red)";
  if (data) return "var(--stockage)";
  if (money) return "var(--amber)";
  return "var(--calcul)";
}
