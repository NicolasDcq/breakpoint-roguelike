// La valeur du moment d'un Plugin, affichée sur sa puce : ce qu'il apporte à cet instant.
// Elle suit la partie (contrats livrés, parc, Plugins, caisse) et le plateau en cours de pose.
// Un Plugin sans valeur qui change n'a pas de badge ; son texte suffit.
//
// valueOf(ctx) rend { kind, amount, mode } :
//   kind : "compute" | "scale" | "retry" | "money" | "data" | "mult" (multiplicateur de production)
//   mode : "add" (+N) ou "times" (×N)
// ctx : { cards (16 cases), placed (cartes posées), contractsWon, parcSize, pluginIds, money,
//         deploysPlayed, deploysThisContract, isLastDeploy, isLastPlugin }

import { familyOf } from "./modules.js";
import { GRID_SIZE, neighborCells } from "../board/grid.js";
import { RARITY_OF } from "./plugins.js";
import { detectArchitecture } from "./architectures.js";

const count = (cards, family) => cards.filter((card) => familyOf(card.moduleId) === family).length;
const corners = [0, GRID_SIZE - 1, GRID_SIZE * (GRID_SIZE - 1), GRID_SIZE * GRID_SIZE - 1];
const add = (kind, amount) => ({ kind, amount, mode: "add" });
const times = (kind, amount) => ({ kind, amount, mode: "times" });

export const PLUGIN_VALUES = Object.freeze({
  veteran: (ctx) => add("compute", 3 * ctx.contractsWon),
  hoarder: (ctx) => add("compute", Math.floor(ctx.parcSize / 2)),
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
  // Vague 4 : ce qui ajoute à Scale ou à Compute, et ce qui le multiplie (la valeur d'un × est 1 quand il ne joue pas).
  ticketjira: (ctx) => add("scale", 0.1 * ctx.deploysPlayed),
  sprint: (ctx) => add("compute", 4 * ctx.deploysThisContract),
  hotfix: (ctx) => add("scale", ctx.isLastDeploy ? 1 : 0),
  loadbalancer: (ctx) => times("scale", [...ctx.placed.reduce((m, card) => m.set(card.moduleId, (m.get(card.moduleId) ?? 0) + 1), new Map()).values()].some((n) => n >= 2) ? 1.3 : 1),
  certification: (ctx) => times("scale", ctx.placed.length && detectArchitecture(ctx.placed, familyOf).id !== "monolithe" ? 1.25 : 1),
  monitoring: (ctx) => times("scale", 1.15 ** count(ctx.placed, "ops")),
  conteneur: (ctx) => times("scale", ctx.placed.length >= 2 && ctx.cards.every((card, cell) => !card || neighborCells(cell).some((other) => ctx.cards[other])) ? 1.3 : 1),
  hyperscaler: (ctx) => times("scale", 1 + 0.1 * ctx.contractsWon),
  autoscaling: (ctx) => times("scale", ctx.isLastDeploy ? 2 : 1.5),
  featureflag: () => times("scale", 1.2),
  montee: (ctx) => times("scale", 1.15 ** ctx.deploysThisContract),
  deploiementfinal: (ctx) => times("scale", ctx.isLastPlugin ? 3 : 1),
  rachat: (ctx) => times("scale", 1 + 0.5 * ctx.pluginIds.filter((id) => ["epic", "legendary"].includes(RARITY_OF(id))).length),
  pivot: (ctx) => times("scale", 1 + 0.25 * new Set(ctx.placed.map((card) => familyOf(card.moduleId))).size),
  monorepo: (ctx) => times("scale", ctx.placed.length >= 3 && new Set(ctx.placed.map((card) => card.moduleId)).size === ctx.placed.length ? 2.5 : 1),
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
  for (const [index, id] of pluginIds.entries()) {
    const value = PLUGIN_VALUES[id]?.({ ...ctx, pluginIds, isLastPlugin: index === pluginIds.length - 1 });
    if (value) values[id] = { ...value, amount: Math.round(value.amount * 100) / 100 };
  }
  return values;
}
