// Catalogue des Plugins : des effets permanents, comme les Jokers.
// Un Plugin choisit les moments où il agit (ses « crochets ») :
// - multiplier(card, ctx) : multiplie la production d'un producteur ;
// - afterActivation(card, ctx) : après l'activation d'un module ;
// - onRetrigger(ctx) : à chaque réactivation ;
// - atEnd(result, env) : à la fin du déploiement ;
// - contractInterest(money) : $ en plus quand un contrat est livré ;
// - freeRemoval : retirer un module du parc ne coûte rien.
// atEnd reçoit l'environnement { parcSize, pluginIds, contractsWon, maxPlaced, discardsUsed }.

import { familyOf } from "./modules.js";
import { GRID_SIZE } from "../board/grid.js";
import { RULES } from "./rules.js";

const countFamily = (cards, family) => cards.filter((card) => familyOf(card.moduleId) === family).length;
const familiesOf = (cards) => new Set(cards.map((card) => familyOf(card.moduleId)));
const rowOf = (cell) => Math.floor(cell / GRID_SIZE);
const columnOf = (cell) => cell % GRID_SIZE;
const isFullColumn = (cards, column) => Array.from({ length: GRID_SIZE }, (_, row) => cards[row * GRID_SIZE + column]).every(Boolean);
const mirrorCell = (cell) => Math.floor(cell / GRID_SIZE) * GRID_SIZE + (GRID_SIZE - 1 - (cell % GRID_SIZE));
const onDiagonal = (cell) => rowOf(cell) === columnOf(cell) || rowOf(cell) + columnOf(cell) === GRID_SIZE - 1;

const DEFINITIONS = {
  intern: {
    name: "Le Stagiaire", rarity: "common", price: 4, text: "+3 Compute par module posé.",
    atEnd: (result) => { result.compute += 3 * result.count; return true; },
  },
  cloudarch: {
    name: "L'Architecte Cloud", rarity: "uncommon", price: 6, text: "Les modules Calcul produisent ×1,5.",
    multiplier: (card) => (familyOf(card.moduleId) === "calcul" ? 1.5 : 1),
  },
  pairprog: {
    name: "Pair Programming", rarity: "uncommon", price: 5, text: "Un module qui a un voisin du même type produit ×2.",
    multiplier: (card, ctx) => (ctx.neighbors().some((other) => other.moduleId === card.moduleId) ? 2 : 1),
  },
  dba: {
    name: "La DBA", rarity: "common", price: 4, text: "Chaque module Stockage activé ajoute +1 ◆.",
    afterActivation: (card, ctx) => { if (familyOf(card.moduleId) === "stockage") ctx.bonusData(1); },
  },
  netops: {
    name: "Ingé Réseau", rarity: "uncommon", price: 5, text: "+0,4 Scale par module Réseau posé.",
    atEnd: (result) => {
      const count = countFamily(result.placed, "reseau");
      result.scale += 0.4 * count;
      return count > 0;
    },
  },
  growth: {
    name: "Growth Hacker", rarity: "rare", price: 6, text: "Scale ×1,5 si au moins 3 familles sont posées.",
    atEnd: (result) => {
      if (new Set(result.placed.map((card) => familyOf(card.moduleId))).size < 3) return false;
      result.scale *= 1.5;
      return true;
    },
  },
  minimal: {
    name: "Le Minimaliste", rarity: "uncommon", price: 5, text: "Si 3 modules ou moins sont posés : Compute ×2.",
    atEnd: (result) => {
      if (result.count > 3) return false;
      result.compute *= 2;
      return true;
    },
  },
  sre: {
    name: "La SRE", rarity: "uncommon", price: 5, text: "Chaque réactivation ajoute +0,3 Scale.",
    onRetrigger: (ctx) => ctx.bonusScale(0.3),
  },
  accountant: {
    name: "Le Comptable", rarity: "common", price: 4, text: "Fin de contrat : +1 $ par tranche de 5 $ en caisse (max +5).",
    contractInterest: (money) => Math.min(5, Math.floor(money / 5)),
  },
  hoarder: {
    name: "La Collectionneuse", rarity: "uncommon", price: 5, text: "+1 Compute par module de ton parc, à chaque déploiement.",
    atEnd: (result, env) => { result.compute += env.parcSize; return true; },
  },
  caffeine: {
    name: "Codeur sous Caféine", rarity: "common", price: 4, text: "Le premier module posé (plus petit numéro) produit ×3.",
    multiplier: (card, ctx) => (ctx.isFirstPlaced() ? 3 : 1),
  },
  janitor: {
    name: "Le Concierge", rarity: "common", price: 3, text: "Retirer un module du parc coûte 0 $.",
    freeRemoval: true,
  },
  // ---------- Vague 2 ----------
  veteran: {
    name: "Le Vétéran", rarity: "common", price: 4, text: "+3 Compute par contrat déjà livré dans la partie.",
    atEnd: (result, env) => { if (!env.contractsWon) return false; result.compute += 3 * env.contractsWon; return true; },
  },
  mentor: {
    name: "La Mentor", rarity: "common", price: 4, text: "+5 Compute par Plugin commun que tu possèdes.",
    atEnd: (result, env) => {
      const commons = env.pluginIds.filter((id) => PLUGIN_RARITY[id] === "common").length;
      result.compute += 5 * commons;
      return commons > 0;
    },
  },
  scrum: {
    name: "Le Scrum Master", rarity: "common", price: 4, text: "Si 4 modules ou plus sont posés : +0,5 Scale.",
    atEnd: (result) => { if (result.count < 4) return false; result.scale += 0.5; return true; },
  },
  secuchief: {
    name: "Le Responsable Sécu", rarity: "common", price: 4, text: "Fin de contrat : +2 $.",
    contractInterest: () => 2,
  },
  productchief: {
    name: "Chef de produit", rarity: "uncommon", price: 5, text: "+0,3 Scale par module Business posé.",
    atEnd: (result) => {
      const count = countFamily(result.placed, "business");
      result.scale += 0.3 * count;
      return count > 0;
    },
  },
  pipeline: {
    name: "La Pipeline", rarity: "uncommon", price: 5, text: "Chaque module Ops activé réactive le module posé juste après lui.",
    afterActivation: (card, ctx) => {
      if (familyOf(card.moduleId) !== "ops" || ctx.isRetrigger()) return false;
      const next = ctx.nextFilledCell();
      if (next < 0) return false;
      ctx.retrigger([next], 1);
      return true;
    },
  },
  monetique: {
    name: "La Monétique", rarity: "uncommon", price: 5, text: "Si 2 modules Business ou plus sont posés : +15 Compute.",
    atEnd: (result) => { if (countFamily(result.placed, "business") < 2) return false; result.compute += 15; return true; },
  },
  symmetric: {
    name: "Le Symétrique", rarity: "uncommon", price: 5, text: "Un module posé sur la case miroir (gauche-droite) d'un autre module : les deux produisent ×2.",
    multiplier: (card, ctx) => {
      const mirror = mirrorCell(ctx.cell());
      return mirror !== ctx.cell() && ctx.cards[mirror] ? 2 : 1;
    },
  },
  tandem: {
    name: "Le Tandem", rarity: "uncommon", price: 5, text: "+10 Compute par ligne qui a 2 modules de la même famille ou plus.",
    atEnd: (result) => {
      let rows = 0;
      for (let row = 0; row < GRID_SIZE; row++) {
        const line = result.cards.slice(row * GRID_SIZE, (row + 1) * GRID_SIZE).filter(Boolean);
        if (familiesOf(line).size < line.length) rows++;
      }
      result.compute += 10 * rows;
      return rows > 0;
    },
  },
  investor: {
    name: "L'Investisseuse", rarity: "uncommon", price: 6, text: "Scale ×(1 + 0,25 par Plugin possédé) : ×2 avec 4 Plugins.",
    atEnd: (result, env) => { result.scale *= 1 + 0.25 * env.pluginIds.length; return true; },
  },
  vc: {
    name: "Le Capital-risqueur", rarity: "rare", price: 6, text: "Fin de contrat : il double ta caisse (+8 $ au plus).",
    contractInterest: (money) => Math.min(8, money),
  },
  genai: {
    name: "L'IA Générative", rarity: "rare", price: 7, text: "Le dernier module posé (plus grand numéro) produit ×4.",
    multiplier: (card, ctx) => (ctx.isLastPlaced() ? 4 : 1),
  },
  monopoly: {
    name: "Le Monopole", rarity: "rare", price: 7, text: "Si 3 modules ou plus sont posés, tous de la même famille : Compute ×3 et Scale ×2.",
    atEnd: (result) => {
      if (result.count < 3 || familiesOf(result.placed).size !== 1) return false;
      result.compute *= 3;
      result.scale *= 2;
      return true;
    },
  },
  overclock: {
    name: "L'Overclocker", rarity: "rare", price: 6, text: "Plateau plein (autant de modules que le maximum autorisé) : Scale ×2.",
    atEnd: (result, env) => { if (result.count < env.maxPlaced) return false; result.scale *= 2; return true; },
  },
  cleancode: {
    name: "Le Clean Code", rarity: "rare", price: 7, text: "Si tu n'as pas défaussé pendant ce contrat : +20 Compute et Scale ×1,5.",
    atEnd: (result, env) => {
      if (env.discardsUsed > 0) return false;
      result.compute += 20;
      result.scale *= 1.5;
      return true;
    },
  },
  diagonal: {
    name: "La Diagonale", rarity: "rare", price: 6, text: "Les modules posés sur une grande diagonale (cases 1-6-11-16 ou 4-7-10-13) produisent ×2.",
    multiplier: (card, ctx) => (onDiagonal(ctx.cell()) ? 2 : 1),
  },
};

export const PLUGINS = Object.freeze(
  Object.fromEntries(Object.entries(DEFINITIONS).map(([id, def]) => [id, Object.freeze({ id, ...def })])),
);
export const PLUGIN_IDS = Object.keys(PLUGINS);
const PLUGIN_RARITY = Object.fromEntries(Object.entries(DEFINITIONS).map(([id, def]) => [id, def.rarity]));

/** Tire des Plugins que le joueur n'a pas, selon leur rareté (boutique et pack de Plugins). */
export const drawPlugins = (rng, ownedPluginIds, count) =>
  rng.weightedSample(PLUGIN_IDS.filter((id) => !ownedPluginIds.includes(id)), (id) => RULES.rarityWeights[PLUGINS[id].rarity], count);

/** Ce que rapporte un Plugin revendu : la moitié de son prix, au moins 1 $. */
export const pluginSellPrice = (pluginId) => Math.max(1, Math.floor(PLUGINS[pluginId].price / 2));
