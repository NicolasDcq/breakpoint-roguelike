// Catalogue des modules. Chaque module décrit :
// - sa famille, son prix, s'il produit (producteur) ou s'il aide (soutien) ;
// - ses lignes d'effet, pour l'affichage ;
// - son effet, joué à chaque activation via le contexte d'activation.
// Ajouter un module = ajouter une entrée ici, sans toucher au moteur.

import { atLevel, frNumber } from "../shared/levels.js";

/** Une ligne d'effet affichée sur la carte. kind : compute | scale | data | money | retrigger | boost. */
export const line = (kind, value, text, condition = null) => ({ kind, value, text, condition });

const perLevel = (values) => (level) => atLevel(values, level);
const countFamily = (cards, family) => cards.filter((card) => MODULES[card.moduleId].family === family).length;

const simpleCompute = (values) => {
  const at = perLevel(values);
  return {
    lines: (level) => [line("compute", `+${at(level)} ⚡`, `Produit +${at(level)} Compute.`)],
    effect: (ctx, level) => ctx.addCompute(at(level)),
  };
};

const costlyCompute = (values, resource, cost, label) => {
  const at = perLevel(values);
  const spend = resource === "data" ? "spendData" : "spendMoney";
  const symbol = resource === "data" ? "◆ du stock" : "$ de ta caisse";
  return {
    lines: (level) => [line("compute", `+${at(level)} ⚡`, `Produit +${at(level)} Compute.`, `Coûte ${cost} ${symbol}. Sans ${resource === "data" ? "◆" : "$"}, ${label} ne produit pas.`)],
    effect: (ctx, level) => (ctx[spend](cost) ? ctx.addCompute(at(level)) : ctx.fail(resource === "data" ? "Pas de ◆" : "Pas de $")),
  };
};

const scalePerFamily = (values, family, familyLabel, self) => {
  const at = perLevel(values);
  return {
    lines: (level) => [line("scale", `+${frNumber(at(level))} ×`, `+${frNumber(at(level))} Scale par module ${familyLabel} posé, ${self}.`)],
    effect: (ctx, level) => ctx.addScale(at(level) * countFamily(ctx.placedCards(), family)),
  };
};

const DEFINITIONS = {
  server: { name: "Serveur", family: "calcul", price: 3, producer: true, ...simpleCompute([8, 13, 19]) },
  micro: {
    name: "Microservice", shortName: "Micro­service", family: "calcul", price: 2, producer: true,
    lines: (level) => [
      line("compute", `+${atLevel([5, 8, 11], level)} ⚡`, `Produit +${atLevel([5, 8, 11], level)} Compute.`),
      line("compute", `+${atLevel([3, 4, 5], level)} ⚡`, `+${atLevel([3, 4, 5], level)} Compute par Microservice voisin.`),
    ],
    effect: (ctx, level) => {
      const twins = ctx.neighbors().filter((card) => card.moduleId === "micro").length;
      ctx.addCompute(atLevel([5, 8, 11], level) + atLevel([3, 4, 5], level) * twins);
    },
  },
  api: { name: "API", family: "calcul", price: 4, producer: true, ...costlyCompute([10, 16, 23], "data", 1, "l'API") },
  gpu: { name: "GPU", family: "calcul", price: 6, producer: true, ...costlyCompute([17, 27, 39], "money", 1, "le GPU") },
  lambda: {
    name: "Serverless", family: "calcul", price: 3, producer: true,
    lines: (level) => [
      line("compute", `+${atLevel([5, 7, 9], level)} ⚡`, `Produit +${atLevel([5, 7, 9], level)} Compute.`),
      line("compute", `+${atLevel([3, 4, 6], level)} ⚡`, `+${atLevel([3, 4, 6], level)} Compute par case vide du plateau.`),
    ],
    effect: (ctx, level) => ctx.addCompute(atLevel([5, 7, 9], level) + atLevel([3, 4, 6], level) * ctx.emptyCellCount()),
  },
  database: {
    name: "Base de données", shortName: "Base", family: "stockage", price: 3, producer: true,
    lines: (level) => [line("data", `+${atLevel([2, 3, 4], level)} ◆`, `Ajoute +${atLevel([2, 3, 4], level)} Data au stock.`, "La Data reste d'un déploiement à l'autre.")],
    effect: (ctx, level) => ctx.addData(atLevel([2, 3, 4], level)),
  },
  analytics: {
    name: "Analytics", family: "stockage", price: 4, producer: true,
    lines: (level) => [line("scale", `+${frNumber(atLevel([1, 1.5, 2], level))} ×`, `Ajoute +${frNumber(atLevel([1, 1.5, 2], level))} Scale.`, "Coûte 2 ◆ du stock. Sans ◆, ne produit pas.")],
    effect: (ctx, level) => (ctx.spendData(2) ? ctx.addScale(atLevel([1, 1.5, 2], level)) : ctx.fail("Pas de ◆")),
  },
  search: {
    name: "Index de Recherche", shortName: "Index", family: "stockage", price: 4, producer: true,
    lines: (level) => [line("compute", `+${frNumber(atLevel([1, 1.5, 2], level))} ⚡`, `+${frNumber(atLevel([1, 1.5, 2], level))} Compute par ◆ en stock.`, "Ne consomme pas la Data.")],
    effect: (ctx, level) => ctx.addCompute(Math.round(atLevel([1, 1.5, 2], level) * ctx.dataStock())),
  },
  cdn: {
    name: "CDN", family: "reseau", price: 4, producer: true,
    lines: (level) => [line("scale", `+${frNumber(atLevel([0.4, 0.6, 0.8], level))} ×`, `+${frNumber(atLevel([0.4, 0.6, 0.8], level))} Scale par voisin.`)],
    effect: (ctx, level) => ctx.addScale(atLevel([0.4, 0.6, 0.8], level) * ctx.neighbors().length),
  },
  firewall: { name: "Pare-feu", family: "reseau", price: 4, producer: true, ...scalePerFamily([0.4, 0.6, 0.8], "reseau", "Réseau", "celui-ci compris") },
  dns: {
    name: "DNS", family: "reseau", price: 4, producer: false,
    lines: (level) => [line("retrigger", level === 3 ? "↺ ×2" : "↺", level === 1 ? "Réactive la case juste en dessous." : `Réactive${level === 3 ? " 2 fois" : ""} les cases juste au-dessus et juste en dessous.`)],
    effect: (ctx, level) => {
      const targets = [ctx.cellOffset(+3)];
      if (level > 1) targets.push(ctx.cellOffset(-3));
      ctx.retrigger(targets.filter((cell) => cell >= 0), level === 3 ? 2 : 1);
    },
  },
  saas: {
    name: "Abonnement SaaS", shortName: "SaaS", family: "business", price: 3, producer: true,
    lines: (level) => [line("money", `+${atLevel([1, 2, 3], level)} $`, `Rapporte +${atLevel([1, 2, 3], level)} $.`, "Les $ servent en boutique.")],
    effect: (ctx, level) => ctx.addMoney(atLevel([1, 2, 3], level)),
  },
  marketplace: { name: "Marketplace", family: "business", price: 5, producer: true, ...scalePerFamily([0.5, 0.75, 1], "business", "Business", "celle-ci comprise") },
  adserver: {
    name: "Régie Pub", family: "business", price: 4, producer: true,
    lines: (level) => [
      line("money", `+${atLevel([1, 1, 2], level)} $`, `+${atLevel([1, 1, 2], level)} $ par voisin.`),
      ...(atLevel([0, 3, 5], level) ? [line("compute", `+${atLevel([0, 3, 5], level)} ⚡`, `+${atLevel([0, 3, 5], level)} Compute par voisin.`)] : []),
    ],
    effect: (ctx, level) => {
      const around = ctx.neighbors().length;
      ctx.addMoney(atLevel([1, 1, 2], level) * around);
      ctx.addCompute(atLevel([0, 3, 5], level) * around);
    },
  },
  cache: {
    name: "Cache", family: "ops", price: 5, producer: false,
    lines: (level) => [line("boost", `×${frNumber(atLevel([2, 2.5, 3], level))}`, `Le prochain producteur activé produit ×${frNumber(atLevel([2, 2.5, 3], level))}.`, "Sans producteur ensuite, le boost est perdu.")],
    effect: (ctx, level) => ctx.boostNext(atLevel([2, 2.5, 3], level)),
  },
  worker: {
    name: "Worker", family: "ops", price: 5, producer: false,
    lines: (level) => {
      const times = atLevel([1, 2, 3], level);
      return [line("retrigger", `↺ ×${times}`, `Réactive ${times === 1 ? "une fois" : `${times} fois`} la case remplie juste avant (numéro plus petit).`)];
    },
    effect: (ctx, level) => ctx.retrigger([ctx.previousFilledCell()].filter((cell) => cell >= 0), atLevel([1, 2, 3], level)),
  },
  queue: {
    name: "File de Messages", shortName: "File", family: "ops", price: 4, producer: false,
    lines: (level) => {
      const count = atLevel([1, 2, 3], level);
      return [line("retrigger", "↺", count === 1 ? "Le prochain producteur activé est réactivé une fois." : `Les ${count} prochains producteurs activés sont réactivés une fois.`)];
    },
    effect: (ctx, level) => ctx.queueRetriggers(atLevel([1, 2, 3], level)),
  },
};

/** Les modules, avec leur identifiant et un nom court pour les tuiles. */
export const MODULES = Object.freeze(
  Object.fromEntries(Object.entries(DEFINITIONS).map(([id, def]) => [id, Object.freeze({ id, shortName: def.name, ...def })])),
);
export const MODULE_IDS = Object.keys(MODULES);
export const familyOf = (moduleId) => MODULES[moduleId].family;
