// Effets des modules écrits en lignes, pour les fiches et l'atelier de fusion.
// Une ligne = un effet, dans l'ordre où il se déclenche :
//   kind  : c Compute, s Scale, d Data, b $, r réactivation, x boost, g autre
//   value : la pastille (« +26 ⚡ », « ↺ ×3 »…)
//   text  : une phrase courte
//   cond  : la condition ou le coût, en petit
//   here  : (ctx) => texte « Ici : … » calculé sur le plateau, ou null
// Règles d'écriture : jamais « rien » ni « lui », chiffres à la française.

import { aboveBelow, columnMates, diagonals, linkedNeighbors, previousFilledSlot } from "./grid.js";
import { isHybrid, isModuleType, isProducerModule, moduleFamilies } from "./hybrids.js";
import {
  ADSERVER_BUDGET,
  ADSERVER_COMPUTE,
  ANALYTICS_VALUES,
  API_COMPUTE,
  BACKUP_VALUES,
  CACHE_BOOST,
  CDN_VALUES,
  DATABASE_DATA,
  FIREWALL_VALUES,
  GPU_VALUES,
  LAMBDA_VALUES,
  MARKETPLACE_SCALE,
  MICRO_BASE,
  MICRO_PER_NEIGHBOR,
  MODULES,
  MONITORING_SCALE,
  QUEUE_COUNT,
  SAAS_BUDGET,
  SEARCH_VALUES,
  SERVER_COMPUTE,
  WORKER_TIMES,
} from "./modules.js";
import { byLevel, frDecimal, round2 } from "./util.js";

const n = (value) => frDecimal(round2(value));
const PLURALS = {
  "◆": "◆",
  "module Business": "modules Business",
  "module Réseau": "modules Réseau",
  "module Stockage": "modules Stockage",
  "case vide": "cases vides",
  "voisin Calcul": "voisins Calcul",
};
const plural = (count, word) => `${count} ${count > 1 ? PLURALS[word] ?? `${word}s` : word}`;

// Contexte « ici » : le plateau vu depuis une case.
export function hereContext(state, slot) {
  let board = state.board;
  let onBoard = slot >= 0 && slot < 25;
  return {
    board,
    slot,
    onBoard,
    neighbors: () => (onBoard ? linkedNeighbors(board, slot) : []),
    diagonals: () => (onBoard ? diagonals(slot).filter((i) => board[i]) : []),
    dataStock: state.data ?? 0,
    budget: state.budget ?? 0,
    emptyOpen: (state.unlocked ?? []).filter((open, i) => open && !board[i]).length,
    moduleCount: board.filter(Boolean).length,
    familyCount: (family) => board.filter((m) => m && moduleFamilies(m).includes(family)).length,
  };
}

export const caseName = (board, slot) => {
  let module = board[slot];
  return module ? `${MODULES[module.defId].name}${module.partnerId ? ` + ${MODULES[module.partnerId].name}` : ""} (case ${slot + 1})` : `case ${slot + 1}`;
};

const names = (board, slots) => (slots.length ? slots.map((slot) => caseName(board, slot)).join(", ") : "personne pour l’instant");

// Comptes « par voisin », « par module Réseau »… avec le total réel.
const perCount = (unit, per, label, count) => (h) => {
  if (!h.onBoard) {
    return null;
  }
  let total = count(h);
  return `Ici : ${plural(total, label)} → ${per * total >= 0 ? "+" : ""}${n(per * total)} ${unit}.`;
};
const perNeighbor = (unit, per, filter = () => true, label = "voisin") => perCount(unit, per, label, (h) => h.neighbors().filter((i) => filter(h.board[i])).length);
const perFamily = (unit, per, family, label) => perCount(unit, per, label, (h) => h.familyCount(family));

const line = (kind, value, text, cond, here) => ({ kind, value, text, ...cond ? { cond } : {}, ...here ? { here } : {} });

const spendData = (amount) => `Coûte ${amount} ◆ du stock. Sans ◆, cette ligne ne produit pas.`;
const spendBudget = (amount) => `Coûte ${amount} $ du Budget. Sans $, cette ligne ne produit pas.`;
const stockHere = (h) => (h.onBoard ? `Ici : ${h.dataStock} ◆ en stock.` : null);
const budgetHere = (h) => (h.onBoard ? `Ici : ${h.budget} $ en caisse.` : null);

// Prochain producteur activé après une case (ordre des numéros).
const nextProducers = (h, count) => {
  let found = [];
  for (let i = h.slot + 1; i < 25 && found.length < count; i++) {
    if (isProducerModule(h.board[i])) {
      found.push(i);
    }
  }
  return found;
};
const previousSlots = (h, count) => {
  let found = [];
  for (let i = h.slot - 1; i >= 0 && found.length < count; i--) {
    if (h.board[i]) {
      found.push(i);
    }
  }
  return found.reverse();
};

// Lignes d'un module selon son niveau, sa spécialisation ou sa version 2.0.
const LINES = {
  server: {
    level: (l) => [line("c", `+${byLevel(SERVER_COMPUTE, l)} ⚡`, `Produit +${byLevel(SERVER_COMPUTE, l)} Compute.`)],
    A: () => [line("c", "+20 ⚡", "Produit +20 Compute.")],
    B: () => [line("c", "+14 ⚡", "Produit +14 Compute."), line("b", "+2 $", "Rapporte +2 $.")],
    fused: () => [
      line("c", "+25 ⚡", "Produit +25 Compute."),
      line("c", "+5 ⚡", "+5 Compute par Serveur voisin, diagonales comprises.", null, perCount("Compute", 5, "Serveur", (h) => [...h.neighbors(), ...h.diagonals()].filter((i) => isModuleType(h.board[i], "server")).length)),
    ],
  },
  micro: {
    level: (l) => [
      line("c", `+${byLevel(MICRO_BASE, l)} ⚡`, `Produit +${byLevel(MICRO_BASE, l)} Compute.`),
      line("c", `+${byLevel(MICRO_PER_NEIGHBOR, l)} ⚡`, `+${byLevel(MICRO_PER_NEIGHBOR, l)} Compute par Microservice voisin.`, null, perNeighbor("Compute", byLevel(MICRO_PER_NEIGHBOR, l), (m) => isModuleType(m, "micro"), "Microservice")),
    ],
    A: () => [line("c", "+4 ⚡", "Produit +4 Compute."), line("c", "+8 ⚡", "+8 Compute par Microservice voisin.", null, perNeighbor("Compute", 8, (m) => isModuleType(m, "micro"), "Microservice"))],
    B: () => [line("c", "+4 ⚡", "Produit +4 Compute."), line("c", "+5 ⚡", "+5 Compute par voisin, de n’importe quel type.", null, perNeighbor("Compute", 5))],
    fused: () => [line("c", "+8 ⚡", "Produit +8 Compute."), line("c", "+8 ⚡", "+8 Compute par voisin, de n’importe quel type.", null, perNeighbor("Compute", 8))],
  },
  api: {
    level: (l) => [line("c", `+${byLevel(API_COMPUTE, l)} ⚡`, `Produit +${byLevel(API_COMPUTE, l)} Compute.`, spendData(1), stockHere)],
    A: () => [line("c", "+26 ⚡", "Produit +26 Compute.", spendData(1), stockHere)],
    B: () => [line("c", "+20 ⚡", "Produit +20 Compute, sans dépenser de Data.", "Seulement si une Base de données est voisine.", (h) => (h.onBoard ? `Ici : ${h.neighbors().some((i) => isModuleType(h.board[i], "database")) ? "une Base est voisine, ça marche." : "aucune Base voisine, la ligne ne produit pas."}` : null))],
    fused: () => [line("c", "+28 ⚡", "Produit +28 Compute.", "Coûte 1 ◆ du stock. Sans ◆ : +8 Compute seulement.", stockHere)],
  },
  gpu: {
    level: (l) => [line("c", `+${byLevel(GPU_VALUES, l)} ⚡`, `Produit +${byLevel(GPU_VALUES, l)} Compute.`, spendBudget(1), budgetHere)],
    A: () => [line("c", "+70 ⚡", "Produit +70 Compute.", spendBudget(2), budgetHere)],
    B: () => [line("c", "+20 ⚡", "Produit +20 Compute.", "Gratuit : ne dépense pas de $.")],
    fused: () => [line("c", "+75 ⚡", "Produit +75 Compute.", "Coûte 2 $ du Budget. Sans $ : +12 Compute seulement.", budgetHere)],
  },
  lambda: {
    level: (l) => [line("c", "+2 ⚡", "Produit +2 Compute."), line("c", `+${byLevel(LAMBDA_VALUES, l)} ⚡`, `+${byLevel(LAMBDA_VALUES, l)} Compute par case ouverte vide.`, null, perCount("Compute", byLevel(LAMBDA_VALUES, l), "case vide", (h) => h.emptyOpen))],
    A: () => [line("c", "+2 ⚡", "Produit +2 Compute."), line("c", "+6 ⚡", "+6 Compute par case ouverte vide.", null, perCount("Compute", 6, "case vide", (h) => h.emptyOpen))],
    B: () => [line("c", "+5 ⚡", "Produit +5 Compute.", "Quand il est réactivé : +25 Compute au lieu de 5.")],
    fused: () => [line("c", "+6 ⚡", "Produit +6 Compute."), line("c", "+7 ⚡", "+7 Compute par case ouverte vide.", null, perCount("Compute", 7, "case vide", (h) => h.emptyOpen))],
  },
  database: {
    level: (l) => [line("d", `+${byLevel(DATABASE_DATA, l)} ◆`, `Ajoute +${byLevel(DATABASE_DATA, l)} Data au stock.`)],
    A: () => [line("d", "+7 ◆", "Ajoute +7 Data au stock.")],
    B: () => [line("d", "+4 ◆", "Ajoute +4 Data au stock."), line("c", "+4 ⚡", "+4 Compute par voisin Calcul.", null, perNeighbor("Compute", 4, (m) => moduleFamilies(m).includes("calcul"), "voisin Calcul"))],
    fused: () => [line("d", "+8 ◆", "Ajoute +8 Data au stock."), line("s", "+0,5 ×", "+0,5 Scale par tranche de 10 ◆ en stock.", "Le stock compte les 8 ◆ qu’il vient d’ajouter.", stockHere)],
  },
  analytics: {
    level: (l) => [line("s", `+${n(byLevel(ANALYTICS_VALUES, l))} ×`, `Ajoute +${n(byLevel(ANALYTICS_VALUES, l))} Scale.`, spendData(2), stockHere)],
    A: () => [line("s", "+5 ×", "Ajoute +5 Scale.", spendData(4), stockHere)],
    B: () => [line("s", "+2,5 ×", "Ajoute +2,5 Scale.", spendData(1), stockHere)],
    fused: () => [line("s", "+3,5 ×", "Ajoute +3,5 Scale.", "Coûte 2 ◆ du stock. Sans ◆ : +1 Scale seulement.", stockHere)],
  },
  search: {
    level: (l) => [line("c", `+${n(byLevel(SEARCH_VALUES, l))} ⚡`, `+${n(byLevel(SEARCH_VALUES, l))} Compute par ◆ en stock.`, "Ne consomme pas la Data.", perCount("Compute", byLevel(SEARCH_VALUES, l), "◆", (h) => h.dataStock))],
    A: () => [line("c", "+3 ⚡", "+3 Compute par ◆ en stock.", "Ne consomme pas la Data.", perCount("Compute", 3, "◆", (h) => h.dataStock))],
    B: () => [line("s", "+1 ×", "+1 Scale par tranche de 10 ◆ en stock.", "Ne consomme pas la Data.", stockHere)],
    fused: () => [line("c", "+3 ⚡", "+3 Compute par ◆ en stock.", "Ne consomme pas la Data.", perCount("Compute", 3, "◆", (h) => h.dataStock))],
  },
  backup: {
    level: (l) => [line("d", `+${n(byLevel(BACKUP_VALUES, l))} ◆`, `+${n(byLevel(BACKUP_VALUES, l))} Data par module Stockage du plateau, celui-ci compris.`, null, perFamily("Data", byLevel(BACKUP_VALUES, l), "stockage", "module Stockage"))],
    A: () => [line("d", "+3 ◆", "+3 Data par module Stockage du plateau, celui-ci compris.", null, perFamily("Data", 3, "stockage", "module Stockage"))],
    B: () => [line("d", "+1 ◆", "+1 Data par module du plateau, toutes familles.", null, perCount("Data", 1, "module", (h) => h.moduleCount))],
    fused: () => [line("d", "+3 ◆", "+3 Data par module Stockage du plateau.", null, perFamily("Data", 3, "stockage", "module Stockage")), line("s", "+0,5 ×", "+0,5 Scale par module Stockage du plateau.", null, perFamily("Scale", 0.5, "stockage", "module Stockage"))],
  },
  cdn: {
    level: (l) => [line("s", `+${n(byLevel(CDN_VALUES, l))} ×`, `+${n(byLevel(CDN_VALUES, l))} Scale par voisin.`, null, perNeighbor("Scale", byLevel(CDN_VALUES, l)))],
    A: () => [line("s", "+1,2 ×", "+1,2 Scale par voisin.", null, perNeighbor("Scale", 1.2))],
    B: () => [line("s", "+0,8 ×", "+0,8 Scale par voisin.", null, perNeighbor("Scale", 0.8)), line("x", "×1,5", "Ses voisins Business produisent ×1,5.", null, (h) => (h.onBoard ? `Ici : ${names(h.board, h.neighbors().filter((i) => moduleFamilies(h.board[i]).includes("business")))}.` : null))],
    fused: () => [line("s", "+1 ×", "+1 Scale par voisin, diagonales comprises.", null, perCount("Scale", 1, "voisin", (h) => h.neighbors().length + h.diagonals().length))],
  },
  firewall: {
    level: (l) => [line("s", `+${n(byLevel(FIREWALL_VALUES, l))} ×`, `+${n(byLevel(FIREWALL_VALUES, l))} Scale par module Réseau du plateau, celui-ci compris.`, null, perFamily("Scale", byLevel(FIREWALL_VALUES, l), "reseau", "module Réseau"))],
    A: () => [line("s", "+1,2 ×", "+1,2 Scale par module Réseau du plateau, celui-ci compris.", null, perFamily("Scale", 1.2, "reseau", "module Réseau"))],
    B: () => [line("s", "+0,8 ×", "+0,8 Scale par module Réseau du plateau, celui-ci compris.", null, perFamily("Scale", 0.8, "reseau", "module Réseau")), line("g", "🛡", "Ses voisins ignorent les pannes et les interdictions du client.")],
    fused: () => [line("s", "+1,5 ×", "+1,5 Scale par module Réseau du plateau.", null, perFamily("Scale", 1.5, "reseau", "module Réseau"))],
  },
  balancer: {
    level: (l) => {
      let filter = l === 1 ? (m) => isModuleType(m, "server") : l === 2 ? (m) => isModuleType(m, "server") || isModuleType(m, "api") : isProducerModule;
      let what = l === 1 ? "chaque Serveur voisin" : l === 2 ? "chaque Serveur et chaque API voisins" : "chaque producteur voisin";
      return [line("r", "↺", `Réactive ${what}.`, null, (h) => (h.onBoard ? `Ici : ${names(h.board, h.neighbors().filter((i) => filter(h.board[i])))}.` : null))];
    },
    A: () => [line("r", "↺ ×3", "Réactive 3 fois son meilleur voisin producteur.", "Le plus haut niveau, puis le plus petit numéro.", (h) => {
      if (!h.onBoard) {
        return null;
      }
      let rank = (m) => (m.fused ? 4 : m.level);
      let best = h.neighbors().filter((i) => isProducerModule(h.board[i])).sort((a, b) => rank(h.board[b]) - rank(h.board[a]) || a - b)[0];
      return `Ici : ${best === undefined ? "aucun voisin producteur" : caseName(h.board, best)}.`;
    })],
    B: () => [line("r", "↺", "Réactive chaque producteur voisin, diagonales comprises.", null, (h) => (h.onBoard ? `Ici : ${names(h.board, [...h.neighbors(), ...h.diagonals()].sort((a, b) => a - b).filter((i) => isProducerModule(h.board[i])))}.` : null))],
    fused: () => [line("r", "↺ ×2", "Réactive 2 fois chaque producteur voisin, diagonales comprises.", null, (h) => (h.onBoard ? `Ici : ${names(h.board, [...h.neighbors(), ...h.diagonals()].sort((a, b) => a - b).filter((i) => isProducerModule(h.board[i])))}.` : null))],
  },
  dns: {
    level: (l) => {
      let targets = (h) => {
        let { above, below } = aboveBelow(h.board, h.slot);
        return (l === 1 ? [below] : [above, below]).filter((i) => i >= 0);
      };
      return [line("r", l === 3 ? "↺ ×2" : "↺", l === 1 ? "Réactive la case juste en dessous." : `Réactive${l === 3 ? " 2 fois" : ""} les cases juste au-dessus et juste en dessous.`, null, (h) => (h.onBoard ? `Ici : ${names(h.board, targets(h))}.` : null))];
    },
    A: () => [line("r", "↺ ×3", "Réactive 3 fois les cases juste au-dessus et juste en dessous.", null, (h) => {
      if (!h.onBoard) {
        return null;
      }
      let { above, below } = aboveBelow(h.board, h.slot);
      return `Ici : ${names(h.board, [above, below].filter((i) => i >= 0))}.`;
    })],
    B: () => [
      line("r", "↺ ×2", "Réactive 2 fois les cases juste au-dessus et juste en dessous."),
      line("r", "↺", "Réactive une fois le reste de sa colonne.", null, (h) => (h.onBoard ? `Ici : ${plural(columnMates(h.board, h.slot).length, "module")} dans la colonne.` : null)),
    ],
    fused: () => [line("r", "↺ ×2", "Réactive 2 fois tous les autres modules de sa colonne.", null, (h) => (h.onBoard ? `Ici : ${names(h.board, columnMates(h.board, h.slot))}.` : null))],
  },
  saas: {
    level: (l) => [line("b", `+${byLevel(SAAS_BUDGET, l)} $`, `Rapporte +${byLevel(SAAS_BUDGET, l)} $.`)],
    A: () => [line("b", "+5 $", "Rapporte +5 $.")],
    B: () => [line("b", "+1 $", "Rapporte +1 $."), line("s", "+0,5 ×", "+0,5 Scale par module Business du plateau.", null, perFamily("Scale", 0.5, "business", "module Business"))],
    fused: () => [line("b", "+4 $", "Rapporte +4 $."), line("s", "+1 ×", "+1 Scale par tranche de 10 $ en caisse.", null, budgetHere)],
  },
  adserver: {
    level: (l) => [
      line("b", `+${byLevel(ADSERVER_BUDGET, l)} $`, `+${byLevel(ADSERVER_BUDGET, l)} $ par voisin.`, null, perNeighbor("$", byLevel(ADSERVER_BUDGET, l))),
      ...byLevel(ADSERVER_COMPUTE, l) ? [line("c", `+${byLevel(ADSERVER_COMPUTE, l)} ⚡`, `+${byLevel(ADSERVER_COMPUTE, l)} Compute par voisin.`, null, perNeighbor("Compute", byLevel(ADSERVER_COMPUTE, l)))] : [],
    ],
    A: () => [line("b", "+3 $", "+3 $ par voisin.", null, perNeighbor("$", 3))],
    B: () => [line("c", "+10 ⚡", "+10 Compute par voisin.", "Cette Régie ne rapporte pas de $.", perNeighbor("Compute", 10))],
    fused: () => [line("b", "+2 $", "+2 $ par voisin, diagonales comprises.", null, perCount("$", 2, "voisin", (h) => h.neighbors().length + h.diagonals().length)), line("c", "+6 ⚡", "+6 Compute par voisin, diagonales comprises.", null, perCount("Compute", 6, "voisin", (h) => h.neighbors().length + h.diagonals().length))],
  },
  marketplace: {
    level: (l) => [line("s", `+${n(byLevel(MARKETPLACE_SCALE, l))} ×`, `+${n(byLevel(MARKETPLACE_SCALE, l))} Scale par module Business du plateau, celui-ci compris.`, null, perFamily("Scale", byLevel(MARKETPLACE_SCALE, l), "business", "module Business"))],
    A: () => [line("s", "+1,5 ×", "+1,5 Scale par module Business du plateau, celui-ci compris.", null, perFamily("Scale", 1.5, "business", "module Business"))],
    B: () => [line("s", "+0,5 ×", "+0,5 Scale par module du plateau, toutes familles.", null, perCount("Scale", 0.5, "module", (h) => h.moduleCount))],
    fused: () => [line("s", "+1,5 ×", "+1,5 Scale par module Business du plateau.", null, perFamily("Scale", 1.5, "business", "module Business")), line("b", "+1 $", "+1 $ par module Business du plateau.", null, perFamily("$", 1, "business", "module Business"))],
  },
  cache: {
    level: (l) => [line("x", `×${n(byLevel(CACHE_BOOST, l))}`, `Le prochain producteur activé produit ×${n(byLevel(CACHE_BOOST, l))}.`, "Sans producteur ensuite, le boost est perdu. Deux Caches s’additionnent : ×2 et ×2 donnent ×3.", (h) => (h.onBoard ? `Ici : ${names(h.board, nextProducers(h, 1))}.` : null))],
    A: () => [line("x", "×4", "Le prochain producteur activé produit ×4.", "Sans producteur ensuite, le boost est perdu.", (h) => (h.onBoard ? `Ici : ${names(h.board, nextProducers(h, 1))}.` : null))],
    B: () => [line("x", "×2,5", "Les 2 prochains producteurs activés produisent ×2,5.", null, (h) => (h.onBoard ? `Ici : ${names(h.board, nextProducers(h, 2))}.` : null))],
    fused: () => [line("x", "×3", "Les 2 prochains producteurs activés produisent ×3.", "S’additionne avec les autres Caches.", (h) => (h.onBoard ? `Ici : ${names(h.board, nextProducers(h, 2))}.` : null))],
  },
  worker: {
    level: (l) => [line("r", `↺ ×${byLevel(WORKER_TIMES, l)}`, `Réactive ${byLevel(WORKER_TIMES, l) === 1 ? "une fois" : `${byLevel(WORKER_TIMES, l)} fois`} la case juste avant (numéro plus petit).`, null, (h) => (h.onBoard ? `Ici : ${names(h.board, [previousFilledSlot(h.board, h.slot)].filter((i) => i >= 0))}.` : null))],
    A: () => [line("r", "↺ ×4", "Réactive 4 fois la case juste avant (numéro plus petit).", null, (h) => (h.onBoard ? `Ici : ${names(h.board, [previousFilledSlot(h.board, h.slot)].filter((i) => i >= 0))}.` : null))],
    B: () => [line("r", "↺", "Réactive une fois les 3 cases d’avant.", null, (h) => (h.onBoard ? `Ici : ${names(h.board, previousSlots(h, 3))}.` : null))],
    fused: () => [line("r", "↺ ×2", "Réactive 2 fois les 2 cases d’avant.", null, (h) => (h.onBoard ? `Ici : ${names(h.board, previousSlots(h, 2))}.` : null))],
  },
  queue: {
    level: (l) => [line("r", "↺", byLevel(QUEUE_COUNT, l) === 1 ? "Le prochain producteur activé est réactivé une fois." : `Les ${byLevel(QUEUE_COUNT, l)} prochains producteurs activés sont réactivés une fois.`, null, (h) => (h.onBoard ? `Ici : ${names(h.board, nextProducers(h, byLevel(QUEUE_COUNT, l)))}.` : null))],
    A: () => [line("r", "↺", "Les 5 prochains producteurs activés sont réactivés une fois.", null, (h) => (h.onBoard ? `Ici : ${names(h.board, nextProducers(h, 5))}.` : null))],
    B: () => [line("r", "↺ ×2", "Les 2 prochains producteurs activés sont réactivés 2 fois.", null, (h) => (h.onBoard ? `Ici : ${names(h.board, nextProducers(h, 2))}.` : null))],
    fused: () => [line("r", "↺ ×2", "Les 4 prochains producteurs activés sont réactivés 2 fois.", null, (h) => (h.onBoard ? `Ici : ${names(h.board, nextProducers(h, 4))}.` : null))],
  },
  monitoring: {
    level: (l) => [line("s", `+${n(byLevel(MONITORING_SCALE, l))} ×`, `+${n(byLevel(MONITORING_SCALE, l))} Scale par activation déjà faite pendant ce déploiement.`, "Placé tard, il compte plus d’activations.")],
    A: () => [line("s", "+0,3 ×", "+0,3 Scale par activation déjà faite pendant ce déploiement.", "Placé tard, il compte plus d’activations.")],
    B: () => [line("s", "+0,6 ×", "+0,6 Scale par réactivation déjà faite pendant ce déploiement.")],
    fused: () => [line("s", "+0,3 ×", "+0,3 Scale par activation déjà faite pendant ce déploiement.", "Placé tard, il compte plus d’activations.")],
  },
};

// Lignes d'un parent de niveau 3 (avec ou sans spécialisation).
function partLines(defId, branch) {
  return branch ? LINES[defId][branch]() : LINES[defId].level(3);
}

// Ce qu'une partie dépense pour produire, et ce qu'elle fournit.
const SPENDS = (defId, branch) => (defId === "analytics" || (defId === "api" && branch !== "B") ? "data" : defId === "gpu" && branch !== "B" ? "budget" : null);

// Les lignes d'un module, prêtes à afficher.
export function effectLines(module) {
  if (!isHybrid(module)) {
    let entry = LINES[module.defId];
    return module.fused ? entry.fused() : module.level === 3 && module.branch ? entry[module.branch]() : entry.level(module.level);
  }
  let parts = [
    { defId: module.defId, branch: module.branch },
    { defId: module.partnerId, branch: module.partnerBranch },
  ].map((part) => ({
    ...part,
    kind: MODULES[part.defId].kind,
    spends: SPENDS(part.defId, part.branch),
    lines: partLines(part.defId, part.branch),
  }));
  let fed = (key) => parts.some((part) => part.lines.some((l) => l.kind === (key === "data" ? "d" : "b")));
  // Ordre du moteur : producteurs (ceux qui dépensent en dernier), puis soutiens.
  let order = [...parts].sort((a, b) => (a.kind === "utility") - (b.kind === "utility") || (a.spends ? 1 : 0) - (b.spends ? 1 : 0));
  let out = [];
  for (let part of order) {
    let other = parts.find((p) => p !== part);
    for (let l of part.lines) {
      let copy = { ...l, source: { defId: part.defId, branch: part.branch } };
      if (part.spends && fed(part.spends) && (l.cond ?? "").startsWith("Coûte")) {
        let what = part.spends === "data" ? "◆" : "$";
        copy.cond = `${l.cond.split(".")[0].replace(" du stock", "").replace(" du Budget", "")} : pris d’abord dans les ${what} produits par l’autre moitié du module (${MODULES[other.defId].name}), puis ${part.spends === "data" ? "dans le stock" : "dans la caisse"}.`;
      }
      if (part.defId === "api" && part.branch === "B" && other.defId === "database") {
        copy.cond = "La Base de ce module compte comme voisine : toujours actif.";
        delete copy.here;
      }
      out.push(copy);
    }
  }
  return out;
}

// Texte simple (infobulles, journal) : les lignes mises bout à bout.
export const linesText = (lines) => lines.map((l) => l.text).join(" ");
