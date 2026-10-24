// La valeur du moment d'un Plugin, affichée sur sa puce : ce qu'il apporte à cet instant.
// Elle suit la partie (contrats livrés, parc, Plugins, caisse) et le plateau en cours de pose.
// Un Plugin sans valeur qui change n'a pas de badge ; son texte suffit.
//
// valueOf(ctx) rend { kind, amount, mode } :
//   kind : "compute" | "scale" | "retry" | "money" | "data" | "mult" (multiplicateur de production)
//   mode : "add" (+N) ou "times" (×N)
// ctx : { cards (16 cases), placed (cartes posées), contractsWon, parcSize, pluginIds, money }

import { familyOf } from "./modules.js";
import { GRID_SIZE } from "../board/grid.js";
import { RARITY_OF } from "./plugins.js";

const count = (cards, family) => cards.filter((card) => familyOf(card.moduleId) === family).length;
const corners = [0, GRID_SIZE - 1, GRID_SIZE * (GRID_SIZE - 1), GRID_SIZE * GRID_SIZE - 1];
const add = (kind, amount) => ({ kind, amount, mode: "add" });
const times = (kind, amount) => ({ kind, amount, mode: "times" });

export const PLUGIN_VALUES = Object.freeze({
  veteran: (ctx) => add("compute", 3 * ctx.contractsWon),
  hoarder: (ctx) => add("compute", ctx.parcSize),
  mentor: (ctx) => add("compute", 5 * ctx.pluginIds.filter((id) => RARITY_OF(id) === "common").length),
  investor: (ctx) => times("scale", 1 + 0.25 * ctx.pluginIds.length),
  intern: (ctx) => add("compute", 3 * ctx.placed.length),
  accountant: (ctx) => add("money", Math.min(5, Math.floor(ctx.money / 5))),
  vc: (ctx) => add("money", Math.min(8, ctx.money)),
  dba: (ctx) => add("data", count(ctx.placed, "stockage")),
  netops: (ctx) => add("scale", 0.4 * count(ctx.placed, "reseau")),
  productchief: (ctx) => add("scale", 0.3 * count(ctx.placed, "business")),
  monetique: (ctx) => add("compute", count(ctx.placed, "business") >= 2 ? 15 : 0),
  scrum: (ctx) => add("scale", ctx.placed.length >= 4 ? 0.5 : 0),
  tester: (ctx) => add("compute", count(ctx.placed, "ops") ? 6 : 0),
  corner: (ctx) => add("compute", 5 * corners.filter((cell) => ctx.cards[cell]).length),
  proofreader: (ctx) => add("scale", 0.2 * ctx.placed.filter((card) => card.level >= 2).length),
  alternate: (ctx) => add("compute", 8 * new Set(ctx.placed.map((card) => familyOf(card.moduleId))).size),
  pool: (ctx) => add("scale", 0.3 * Array.from({ length: GRID_SIZE }, (_, row) => ctx.cards.slice(row * GRID_SIZE, (row + 1) * GRID_SIZE)).filter((line) => !line.some(Boolean)).length),
  // Multiplicateurs purs de production : le chiffre ne change pas, mais il se voit.
  cloudarch: () => times("mult", 1.5),
  codereview: () => times("mult", 1.3),
  pillar: () => times("mult", 1.5),
  cache: () => times("mult", 1.5),
  pairprog: () => times("mult", 2),
  caffeine: () => times("mult", 3),
  genai: () => times("mult", 4),
  diagonal: () => times("mult", 2),
  symmetric: () => times("mult", 2),
});

/** Les valeurs du moment des Plugins possédés : { pluginId: { kind, amount, mode } }. */
export function pluginValuesFor(pluginIds, ctx) {
  const values = {};
  for (const id of pluginIds) {
    const value = PLUGIN_VALUES[id]?.({ ...ctx, pluginIds });
    if (value) values[id] = { ...value, amount: Math.round(value.amount * 100) / 100 };
  }
  return values;
}
