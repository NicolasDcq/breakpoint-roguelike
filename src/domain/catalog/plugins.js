// Catalogue des Plugins : des effets permanents, comme les Jokers.
// Un Plugin choisit les moments où il agit (ses « crochets ») :
// - multiplier(card, ctx) : multiplie la production d'un producteur ;
// - afterActivation(card, ctx) : après l'activation d'un module ;
// - onRetrigger(ctx) : à chaque réactivation ;
// - atEnd(result, env) : à la fin du déploiement ;
// - contractInterest(money) : $ en plus quand un contrat est livré ;
// - freeRemoval : retirer un module du parc ne coûte rien.
// atEnd reçoit l'environnement { parcSize, pluginIds, contractsWon, maxPlaced, discardsUsed,
// deploysPlayed, deploysThisContract, isLastDeploy, isLastPlugin }.
// `scaleTimes: true` : le Plugin multiplie Scale (l'animation affiche le facteur).
// Les Plugins de fin agissent de gauche à droite : ceux qui ajoutent d'abord, ceux qui multiplient ensuite.

import { familyOf } from "./modules.js";
import { GRID_SIZE, neighborCells } from "../board/grid.js";
import { RULES } from "./rules.js";

const countFamily = (cards, family) => cards.filter((card) => familyOf(card.moduleId) === family).length;
const familiesOf = (cards) => new Set(cards.map((card) => familyOf(card.moduleId)));
const rowOf = (cell) => Math.floor(cell / GRID_SIZE);
const columnOf = (cell) => cell % GRID_SIZE;
const isFullColumn = (cards, column) => Array.from({ length: GRID_SIZE }, (_, row) => cards[row * GRID_SIZE + column]).every(Boolean);
const mirrorCell = (cell) => Math.floor(cell / GRID_SIZE) * GRID_SIZE + (GRID_SIZE - 1 - (cell % GRID_SIZE));
const CORNERS = [0, GRID_SIZE - 1, GRID_SIZE * (GRID_SIZE - 1), GRID_SIZE * GRID_SIZE - 1];
const isCenter = (cell) => rowOf(cell) > 0 && rowOf(cell) < GRID_SIZE - 1 && columnOf(cell) > 0 && columnOf(cell) < GRID_SIZE - 1;
const countModule = (cards) => {
  const counts = new Map();
  cards.forEach((card) => counts.set(card.moduleId, (counts.get(card.moduleId) ?? 0) + 1));
  return counts;
};
const hasNeighbor = (cards, cell) => neighborCells(cell).some((other) => cards[other]);
const epicCount = (pluginIds) => pluginIds.filter((id) => ["epic", "legendary"].includes(PLUGIN_RARITY[id])).length;
const onDiagonal = (cell) => rowOf(cell) === columnOf(cell) || rowOf(cell) + columnOf(cell) === GRID_SIZE - 1;

const DEFINITIONS = {
  intern: {
    name: "Le Stagiaire", rarity: "common", text: "+3 Compute par module posé.",
    atEnd: (result) => { result.compute += 3 * result.count; return true; },
  },
  cloudarch: {
    name: "L'Architecte Cloud", rarity: "rare", text: "Les modules Calcul produisent ×1,5.",
    multiplier: (card) => (familyOf(card.moduleId) === "calcul" ? 1.5 : 1),
  },
  pairprog: {
    name: "Pair Programming", rarity: "rare", text: "Un module qui a un voisin du même type produit ×2.",
    multiplier: (card, ctx) => (ctx.neighbors().some((other) => other.moduleId === card.moduleId) ? 2 : 1),
  },
  dba: {
    name: "La DBA", rarity: "common", text: "Chaque module Stockage activé ajoute +1 ◆.",
    afterActivation: (card, ctx) => { if (familyOf(card.moduleId) === "stockage") ctx.bonusData(1); },
  },
  netops: {
    name: "Ingé Réseau", rarity: "uncommon", text: "+0,4 Scale par module Réseau posé.",
    atEnd: (result) => {
      const count = countFamily(result.placed, "reseau");
      result.scale += 0.4 * count;
      return count > 0;
    },
  },
  growth: {
    name: "Growth Hacker", rarity: "epic", scaleTimes: true, text: "Scale ×1,5 si au moins 3 familles sont posées.",
    atEnd: (result) => {
      if (new Set(result.placed.map((card) => familyOf(card.moduleId))).size < 3) return false;
      result.scale *= 1.5;
      return true;
    },
  },
  minimal: {
    name: "Le Minimaliste", rarity: "uncommon", text: "Si 3 modules ou moins sont posés : Compute ×2.",
    atEnd: (result) => {
      if (result.count > 3) return false;
      result.compute *= 2;
      return true;
    },
  },
  sre: {
    name: "La SRE", rarity: "uncommon", text: "Chaque réactivation ajoute +0,3 Scale.",
    onRetrigger: (ctx) => ctx.bonusScale(0.3),
  },
  accountant: {
    name: "Le Comptable", rarity: "common", text: "Fin de contrat : +1 $ par tranche de 5 $ en caisse (max +5).",
    contractInterest: (money) => Math.min(5, Math.floor(money / 5)),
  },
  hoarder: {
    name: "La Collectionneuse", rarity: "uncommon", text: "+1 Compute par tranche de 2 modules de ton parc, à chaque déploiement.",
    atEnd: (result, env) => { result.compute += Math.floor(env.parcSize / 2); return true; },
  },
  caffeine: {
    name: "Codeur sous Caféine", rarity: "common", text: "Le premier module posé (plus petit numéro) produit ×3.",
    multiplier: (card, ctx) => (ctx.isFirstPlaced() ? 3 : 1),
  },
  janitor: {
    name: "Le Concierge", rarity: "common", text: "Retirer un module du parc coûte 0 $.",
    freeRemoval: true,
  },
  // ---------- Vague 2 ----------
  veteran: {
    name: "Le Vétéran", rarity: "common", text: "+3 Compute par contrat déjà livré dans la partie.",
    atEnd: (result, env) => { if (!env.contractsWon) return false; result.compute += 3 * env.contractsWon; return true; },
  },
  mentor: {
    name: "La Mentor", rarity: "common", text: "+5 Compute par Plugin gris que tu possèdes.",
    atEnd: (result, env) => {
      const commons = env.pluginIds.filter((id) => PLUGIN_RARITY[id] === "common").length;
      result.compute += 5 * commons;
      return commons > 0;
    },
  },
  scrum: {
    name: "Le Scrum Master", rarity: "common", text: "Si 4 modules ou plus sont posés : +0,5 Scale.",
    atEnd: (result) => { if (result.count < 4) return false; result.scale += 0.5; return true; },
  },
  secuchief: {
    name: "Le Responsable Sécu", rarity: "common", text: "Fin de contrat : +2 $.",
    contractInterest: () => 2,
  },
  productchief: {
    name: "Chef de produit", rarity: "uncommon", text: "+0,3 Scale par module Business posé.",
    atEnd: (result) => {
      const count = countFamily(result.placed, "business");
      result.scale += 0.3 * count;
      return count > 0;
    },
  },
  pipeline: {
    name: "La Pipeline", rarity: "rare", text: "Chaque module Ops activé réactive le module posé juste après lui.",
    afterActivation: (card, ctx) => {
      if (familyOf(card.moduleId) !== "ops" || ctx.isRetrigger()) return false;
      const next = ctx.nextFilledCell();
      if (next < 0) return false;
      ctx.retrigger([next], 1);
      return true;
    },
  },
  monetique: {
    name: "La Monétique", rarity: "uncommon", text: "Si 2 modules Business ou plus sont posés : +15 Compute.",
    atEnd: (result) => { if (countFamily(result.placed, "business") < 2) return false; result.compute += 15; return true; },
  },
  symmetric: {
    name: "Le Symétrique", rarity: "rare", text: "Un module posé sur la case miroir (gauche-droite) d'un autre module : les deux produisent ×2.",
    multiplier: (card, ctx) => {
      const mirror = mirrorCell(ctx.cell());
      return mirror !== ctx.cell() && ctx.cards[mirror] ? 2 : 1;
    },
  },
  tandem: {
    name: "Le Tandem", rarity: "rare", text: "+10 Compute par ligne qui a 2 modules de la même famille ou plus.",
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
    name: "L'Investisseuse", rarity: "epic", scaleTimes: true, text: "Scale ×(1 + 0,25 par Plugin possédé) : ×2,25 avec 5 Plugins.",
    atEnd: (result, env) => { result.scale *= 1 + 0.25 * env.pluginIds.length; return true; },
  },
  vc: {
    name: "Le Capital-risqueur", rarity: "epic", text: "Fin de contrat : il double ta caisse (+8 $ au plus).",
    contractInterest: (money) => Math.min(8, money),
  },
  genai: {
    name: "L'IA Générative", rarity: "epic", text: "Le dernier module posé (plus grand numéro) produit ×4.",
    multiplier: (card, ctx) => (ctx.isLastPlaced() ? 4 : 1),
  },
  monopoly: {
    name: "Le Monopole", rarity: "epic", text: "Si 3 modules ou plus sont posés, tous de la même famille : Compute ×3 et Scale ×2.",
    atEnd: (result) => {
      if (result.count < 3 || familiesOf(result.placed).size !== 1) return false;
      result.compute *= 3;
      result.scale *= 2;
      return true;
    },
  },
  overclock: {
    name: "L'Overclocker", rarity: "epic", scaleTimes: true, text: "Plateau plein (autant de modules que le maximum autorisé) : Scale ×2.",
    atEnd: (result, env) => { if (result.count < env.maxPlaced) return false; result.scale *= 2; return true; },
  },
  cleancode: {
    name: "Le Clean Code", rarity: "epic", text: "Si tu n'as pas défaussé pendant ce contrat : +20 Compute et Scale ×1,5.",
    atEnd: (result, env) => {
      if (env.discardsUsed > 0) return false;
      result.compute += 20;
      result.scale *= 1.5;
      return true;
    },
  },
  diagonal: {
    name: "La Diagonale", rarity: "rare", text: "Les modules posés sur une grande diagonale (cases 1-6-11-16 ou 4-7-10-13) produisent ×2.",
    multiplier: (card, ctx) => (onDiagonal(ctx.cell()) ? 2 : 1),
  },
  // ---------- Vague 3 (raretés façon Balatro) ----------
  tester: {
    name: "Le Testeur", rarity: "common", text: "+6 Compute si un module Ops est posé.",
    atEnd: (result) => {
      if (countFamily(result.placed, "ops") === 0) return false;
      result.compute += 6;
      return true;
    },
  },
  corner: {
    name: "Le Coin Café", rarity: "common", text: "+5 Compute par module posé dans un coin.",
    atEnd: (result) => {
      const count = CORNERS.filter((cell) => result.cards[cell]).length;
      result.compute += 5 * count;
      return count > 0;
    },
  },
  proofreader: {
    name: "Le Relecteur", rarity: "common", text: "+0,2 Scale par module de niveau 2 ou plus posé.",
    atEnd: (result) => {
      const count = result.placed.filter((card) => card.level >= 2).length;
      result.scale += 0.2 * count;
      return count > 0;
    },
  },
  alternate: {
    name: "L'Alternante", rarity: "uncommon", text: "+8 Compute par famille différente posée.",
    atEnd: (result) => {
      const count = familiesOf(result.placed).size;
      result.compute += 8 * count;
      return count > 0;
    },
  },
  codereview: {
    name: "La Revue de code", rarity: "uncommon", text: "Les modules de niveau 2 ou plus produisent ×1,3.",
    multiplier: (card) => (card.level >= 2 ? 1.3 : 1),
  },
  pillar: {
    name: "Le Pilier", rarity: "uncommon", text: "Les 4 cases du centre produisent ×1,5.",
    multiplier: (card, ctx) => (isCenter(ctx.cell()) ? 1.5 : 1),
  },
  cache: {
    name: "Le Cache", rarity: "rare", text: "Un module réactivé produit ×1,5.",
    multiplier: (card, ctx) => (ctx.isRetrigger() ? 1.5 : 1),
  },
  pool: {
    name: "Le Pool de connexions", rarity: "rare", text: "+0,3 Scale par ligne du plateau sans module.",
    atEnd: (result) => {
      let empty = 0;
      for (let row = 0; row < GRID_SIZE; row++) {
        if (!result.cards.slice(row * GRID_SIZE, (row + 1) * GRID_SIZE).some(Boolean)) empty++;
      }
      result.scale += 0.3 * empty;
      return empty > 0;
    },
  },
  // ---------- Vague 4 (Plugins qui multiplient Scale et qui grandissent) ----------
  ticketjira: {
    name: "Le Ticket Jira", rarity: "common", text: "+0,1 Scale par déploiement joué depuis le début de la partie.",
    atEnd: (result, env) => { result.scale += 0.1 * env.deploysPlayed; return env.deploysPlayed > 0; },
  },
  sprint: {
    name: "Le Sprint", rarity: "common", text: "+4 Compute par déploiement déjà joué dans ce contrat.",
    atEnd: (result, env) => { result.compute += 4 * env.deploysThisContract; return env.deploysThisContract > 0; },
  },
  hotfix: {
    name: "Le Hotfix", rarity: "common", text: "+1 Scale au dernier déploiement du contrat.",
    atEnd: (result, env) => { if (!env.isLastDeploy) return false; result.scale += 1; return true; },
  },
  loadbalancer: {
    name: "Le Load Balancer", rarity: "uncommon", scaleTimes: true, text: "Scale ×1,3 si 2 modules identiques ou plus sont posés.",
    atEnd: (result) => {
      if (![...countModule(result.placed).values()].some((n) => n >= 2)) return false;
      result.scale *= 1.3;
      return true;
    },
  },
  certification: {
    name: "La Certification", rarity: "uncommon", scaleTimes: true, text: "Scale ×1,25 si l'architecture n'est pas un Monolithe.",
    atEnd: (result) => {
      if (!result.count || result.architecture.id === "monolithe") return false;
      result.scale *= 1.25;
      return true;
    },
  },
  monitoring: {
    name: "Le Monitoring", rarity: "uncommon", scaleTimes: true, text: "Scale ×1,15 par module Ops posé.",
    atEnd: (result) => {
      const count = countFamily(result.placed, "ops");
      result.scale *= 1.15 ** count;
      return count > 0;
    },
  },
  conteneur: {
    name: "Le Conteneur", rarity: "uncommon", scaleTimes: true, text: "Scale ×1,3 si aucun module posé n'est isolé (chacun touche un autre module).",
    atEnd: (result) => {
      if (result.count < 2 || result.cards.some((card, cell) => card && !hasNeighbor(result.cards, cell))) return false;
      result.scale *= 1.3;
      return true;
    },
  },
  hyperscaler: {
    name: "L'Hyperscaler", rarity: "rare", scaleTimes: true, text: "Scale ×(1 + 0,1 par contrat livré) : ×3,3 au contrat 23.",
    atEnd: (result, env) => { result.scale *= 1 + 0.1 * env.contractsWon; return env.contractsWon > 0; },
  },
  autoscaling: {
    name: "L'Autoscaling", rarity: "rare", scaleTimes: true, text: "Scale ×1,5, ou ×2 au dernier déploiement du contrat.",
    atEnd: (result, env) => { result.scale *= env.isLastDeploy ? 2 : 1.5; return true; },
  },
  featureflag: {
    name: "Le Feature Flag", rarity: "rare", scaleTimes: true, text: "Chaque réactivation d'un module : Scale ×1,2.",
    onRetrigger: (ctx) => ctx.multiplyScale(1.2),
  },
  montee: {
    name: "La Montée en charge", rarity: "rare", scaleTimes: true, text: "Scale ×1,15 par déploiement déjà joué dans ce contrat.",
    atEnd: (result, env) => { result.scale *= 1.15 ** env.deploysThisContract; return env.deploysThisContract > 0; },
  },
  deploiementfinal: {
    name: "Le Déploiement final", rarity: "epic", scaleTimes: true, text: "Scale ×3 s'il est le dernier Plugin à droite de la rangée.",
    atEnd: (result, env) => { if (!env.isLastPlugin) return false; result.scale *= 3; return true; },
  },
  rachat: {
    name: "Le Rachat de start-up", rarity: "epic", scaleTimes: true, text: "Scale ×(1 + 0,5 par Plugin épique ou légendaire possédé).",
    atEnd: (result, env) => { result.scale *= 1 + 0.5 * epicCount(env.pluginIds); return true; },
  },
  pivot: {
    name: "Le Pivot", rarity: "epic", scaleTimes: true, text: "Scale ×(1 + 0,25 par famille différente posée) : ×2,25 avec 5 familles.",
    atEnd: (result) => {
      const count = familiesOf(result.placed).size;
      result.scale *= 1 + 0.25 * count;
      return count > 0;
    },
  },
  monorepo: {
    name: "Le Monorepo", rarity: "epic", scaleTimes: true, text: "Scale ×2,5 si 3 modules ou plus sont posés, tous différents.",
    atEnd: (result) => {
      if (result.count < 3 || [...countModule(result.placed).values()].some((n) => n > 1)) return false;
      result.scale *= 2.5;
      return true;
    },
  },
};

export const PLUGINS = Object.freeze(
  Object.fromEntries(Object.entries(DEFINITIONS).map(([id, def]) => [id, Object.freeze({ id, ...def, price: RULES.pluginPrice[def.rarity] })])),
);
/** Les raretés, de la plus courante à la plus rare. */
export const RARITIES = Object.freeze(["common", "uncommon", "rare", "epic", "legendary"]);
export const PLUGIN_IDS = Object.keys(PLUGINS);
const PLUGIN_RARITY = Object.fromEntries(Object.entries(DEFINITIONS).map(([id, def]) => [id, def.rarity]));
export const RARITY_OF = (pluginId) => PLUGIN_RARITY[pluginId];

/** Tire des Plugins que le joueur n'a pas : la rareté d'abord (RULES.rarityWeights), puis un Plugin de cette rareté. */
export const drawPlugins = (rng, ownedPluginIds, count, allowed = RARITIES) => {
  const left = PLUGIN_IDS.filter((id) => !ownedPluginIds.includes(id));
  const picked = [];
  while (picked.length < count) {
    const tiers = allowed.filter((tier) => RULES.rarityWeights[tier] > 0 && left.some((id) => PLUGIN_RARITY[id] === tier));
    if (!tiers.length) break;
    const [tier] = rng.weightedSample(tiers, (name) => RULES.rarityWeights[name], 1);
    const pool = left.filter((id) => PLUGIN_RARITY[id] === tier);
    const id = pool[rng.int(pool.length)];
    picked.push(id);
    left.splice(left.indexOf(id), 1);
  }
  return picked;
};

/**
 * Les Plugins d'un paquet : tirés comme en boutique, avec en plus
 * - `guaranteeRare` : au moins un Plugin rare ou mieux ;
 * - `legendaryChance` : une petite chance de remplacer l'un d'eux par un légendaire.
 */
export const drawPluginPack = (rng, ownedPluginIds, count, { guaranteeRare = false, legendaryChance = 0 } = {}) => {
  const picks = drawPlugins(rng, ownedPluginIds, count);
  if (guaranteeRare && picks.length && !picks.some((id) => RARITIES.indexOf(PLUGIN_RARITY[id]) >= RARITIES.indexOf("rare"))) {
    const [better] = drawPlugins(rng, [...ownedPluginIds, ...picks], 1, ["rare", "epic"]);
    if (better) picks[picks.length - 1] = better;
  }
  const lucky = rng.next() < legendaryChance;
  const legends = PLUGIN_IDS.filter((id) => PLUGIN_RARITY[id] === "legendary" && !ownedPluginIds.includes(id) && !picks.includes(id));
  if (lucky && legends.length && picks.length) picks[rng.int(picks.length)] = legends[rng.int(legends.length)];
  return picks;
};

/** Ce que rapporte un Plugin revendu : la moitié de son prix, au moins 1 $. */
export const pluginSellPrice = (pluginId) => Math.max(1, Math.floor(PLUGINS[pluginId].price / 2));
