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
import { HANDS, RARITY_OF, calculCount } from "./plugins.js";
import { detectArchitecture } from "./architectures.js";

const count = (cards, family) => cards.filter((card) => familyOf(card.moduleId) === family).length;
const corners = [0, GRID_SIZE - 1, GRID_SIZE * (GRID_SIZE - 1), GRID_SIZE * GRID_SIZE - 1];
const add = (kind, amount) => ({ kind, amount, mode: "add" });
const times = (kind, amount) => ({ kind, amount, mode: "times" });

export const PLUGIN_VALUES = Object.freeze({
  veteran: (ctx) => add("compute", 10 * ctx.contractsWon),
  hoarder: (ctx) => add("compute", ctx.parcSize),
  mentor: (ctx) => add("compute", 20 * ctx.pluginIds.filter((id) => RARITY_OF(id) === "common").length),
  investor: (ctx) => times("scale", 1 + 0.25 * ctx.pluginIds.length),
  intern: (ctx) => add("compute", 10 * ctx.placed.length),
  accountant: (ctx) => add("money", Math.min(5, Math.floor(ctx.money / 5))),
  vc: (ctx) => add("money", Math.min(8, ctx.money)),
  dba: (ctx) => add("data", count(ctx.placed, "stockage")),
  netops: (ctx) => add("scale", 2 * count(ctx.placed, "reseau")),
  productchief: (ctx) => add("scale", 2 * count(ctx.placed, "business")),
  monetique: (ctx) => add("compute", count(ctx.placed, "business") >= 2 ? 60 : 0),
  scrum: (ctx) => add("scale", ctx.placed.length >= 4 ? 4 : 0),
  tester: (ctx) => add("compute", count(ctx.placed, "ops") ? 40 : 0),
  corner: (ctx) => add("compute", 25 * corners.filter((cell) => ctx.cards[cell]).length),
  proofreader: (ctx) => add("scale", 2 * ctx.placed.filter((card) => card.level >= 2).length),
  alternate: (ctx) => add("compute", 30 * new Set(ctx.placed.map((card) => familyOf(card.moduleId))).size),
  pool: (ctx) => add("scale", 3 * Array.from({ length: GRID_SIZE }, (_, row) => ctx.cards.slice(row * GRID_SIZE, (row + 1) * GRID_SIZE)).filter((line) => !line.some(Boolean)).length),
  // Vague 4 : ce qui ajoute à Scale ou à Compute, et ce qui le multiplie (la valeur d'un × est 1 quand il ne joue pas).
  ticketjira: (ctx) => add("scale", 0.5 * ctx.deploysPlayed),
  sprint: (ctx) => add("compute", 20 * ctx.deploysThisContract),
  hotfix: (ctx) => add("scale", ctx.isLastDeploy ? 6 : 0),
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

  // Vague 5 : Plugins d'architecture et de petite main (la valeur est 0 ou 1 quand la main visée n'est pas posée).
  doublon: (ctx) => add("scale", HANDS.pair(ctx.placed) ? 4 : 0),
  failover: (ctx) => add("compute", HANDS.pair(ctx.placed) ? 50 : 0),
  duo: (ctx) => times("scale", HANDS.pair(ctx.placed) ? 2 : 1),
  binome: (ctx) => add("scale", HANDS.twoPairs(ctx.placed) ? 6 : 0),
  planreprise: (ctx) => add("compute", HANDS.twoPairs(ctx.placed) ? 70 : 0),
  quatuor: (ctx) => times("scale", HANDS.twoPairs(ctx.placed) ? 2.5 : 1),
  triplet: (ctx) => add("scale", HANDS.triple(ctx.placed) ? 8 : 0),
  testcharge: (ctx) => add("compute", HANDS.triple(ctx.placed) ? 90 : 0),
  trio: (ctx) => times("scale", HANDS.triple(ctx.placed) ? 3 : 1),
  pilecomplete: (ctx) => add("scale", HANDS.allFamilies(ctx.placed) ? 8 : 0),
  devfullstack: (ctx) => add("compute", HANDS.allFamilies(ctx.placed) ? 90 : 0),
  ordre: (ctx) => times("scale", HANDS.allFamilies(ctx.placed) ? 3 : 1),
  specialiste: (ctx) => add("scale", HANDS.sameFamily(ctx.placed) ? 6 : 0),
  monotechno: (ctx) => add("compute", HANDS.sameFamily(ctx.placed) ? 70 : 0),
  tribu: (ctx) => times("scale", HANDS.sameFamily(ctx.placed) ? 2 : 1),
  dettetech: (ctx) => add("scale", HANDS.monolith(ctx.placed) ? 6 : 0),
  monolitheassume: (ctx) => times("scale", HANDS.monolith(ctx.placed) ? 3 : 1),
  modedegrade: (ctx) => times("scale", HANDS.smallHand(ctx.placed) ? 1.5 : 1),
  monometier: (ctx) => times("mult", HANDS.oneFamily(ctx.placed) ? 2 : 1),
  refactoring: (ctx) => times("mult", calculCount(ctx.placed) <= 3 ? 1.5 : 1),
  sobriete: (ctx) => times("mult", calculCount(ctx.placed) <= 2 ? 2 : 1),
  zerodep: (ctx) => times("mult", calculCount(ctx.placed) === 1 ? 4 : 1),
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
