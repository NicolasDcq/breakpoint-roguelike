// Catalogue des Plugins : des effets permanents, comme les Jokers.
// Un Plugin choisit les moments où il agit (ses « crochets ») :
// - multiplier(card, ctx) : multiplie la production d'un producteur ;
// - afterActivation(card, ctx) : après l'activation d'un module ;
// - onRetrigger(ctx) : à chaque réactivation ;
// - atEnd(result, env) : à la fin du déploiement ;
// - contractInterest(money) : $ en plus quand un contrat est livré ;
// - commandDiscount : les commandes du Terminal en boutique coûtent ce nombre de $ de moins.
// atEnd reçoit l'environnement { parcSize, pluginIds, contractsWon, maxPlaced, discardsUsed,
// deploysPlayed, deploysThisContract, isLastDeploy, isLastPlugin }.
// `scaleTimes: true` : le Plugin multiplie Scale (l'animation affiche le facteur).
// Les Plugins de fin agissent de gauche à droite : ceux qui ajoutent d'abord, ceux qui multiplient ensuite.

import { familyOf } from "./modules.js";
import { GRID_SIZE, neighborCells } from "../board/grid.js";
import { RULES } from "./rules.js";
import { detectArchitecture } from "./architectures.js";

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

/**
 * Les « mains » que les Plugins d'architecture reconnaissent (comme les Jokers de Balatro pour la paire ou le brelan).
 * Elles regardent les modules posés : une Haute dispo contient donc un Cluster et une Redondance.
 */
const identicalSizes = (cards) => [...countModule(cards).values()].sort((a, b) => b - a);
const largestFamily = (cards) => Math.max(0, ...["calcul", "stockage", "reseau", "business", "ops"].map((family) => countFamily(cards, family)));
export const HANDS = Object.freeze({
  pair: (cards) => identicalSizes(cards)[0] >= 2,
  twoPairs: (cards) => identicalSizes(cards)[0] >= 2 && identicalSizes(cards)[1] >= 2,
  triple: (cards) => identicalSizes(cards)[0] >= 3,
  allFamilies: (cards) => familiesOf(cards).size >= 5,
  sameFamily: (cards) => largestFamily(cards) >= 5,
  monolith: (cards) => cards.length > 0 && detectArchitecture(cards, familyOf).id === "monolithe",
  smallHand: (cards) => cards.length >= 1 && cards.length <= 3,
  oneFamily: (cards) => cards.length >= 1 && familiesOf(cards).size === 1,
});
/** Plugins « petite main » : combien de modules Calcul (les seuls producteurs de Compute) sont posés. */
export const calculCount = (cards) => countFamily(cards, "calcul");
/** Un Plugin d'architecture : ajoute Scale ou Compute, ou multiplie Scale, quand la main visée est posée. */
const whenHand = (hand, effect) => {
  const atEnd = (result) => {
    if (!HANDS[hand](result.placed)) return false;
    effect(result);
    return true;
  };
  atEnd.hand = hand; // la main visée (le bot s'en sert pour choisir ses Plugins)
  return atEnd;
};
const scaleBonus = (hand, amount) => whenHand(hand, (result) => { result.scale += amount; });
const computeBonus = (hand, amount) => whenHand(hand, (result) => { result.compute += amount; });
const scaleFactor = (hand, factor) => whenHand(hand, (result) => { result.scale *= factor; });
/** Plugin « moins de producteurs, plus de production » : les modules Calcul produisent ×factor si `max` Calcul ou moins sont posés. */
const fewProducers = (max, factor) => (card, ctx) => (familyOf(card.moduleId) === "calcul" && calculCount(ctx.placedCards()) <= max ? factor : 1);

const DEFINITIONS = {
  intern: {
    name: "Le Stagiaire", rarity: "common", text: "+10 Compute par module posé.",
    atEnd: (result) => { result.compute += 10 * result.count; return true; },
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
    name: "Ingé Réseau", rarity: "uncommon", text: "+2 Scale par module Réseau posé.",
    atEnd: (result) => {
      const count = countFamily(result.placed, "reseau");
      result.scale += 2 * count;
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
    name: "La SRE", rarity: "uncommon", text: "Chaque réactivation ajoute +2 Scale.",
    onRetrigger: (ctx) => ctx.bonusScale(2),
  },
  accountant: {
    name: "Le Comptable", rarity: "common", text: "Fin de contrat : +1 $ par tranche de 5 $ en caisse (max +5).",
    contractInterest: (money) => Math.min(5, Math.floor(money / 5)),
  },
  hoarder: {
    name: "La Collectionneuse", rarity: "uncommon", text: "+1 Compute par module de ton parc, à chaque déploiement.",
    atEnd: (result, env) => { result.compute += env.parcSize; return true; },
  },
  caffeine: {
    name: "Codeur sous Caféine", rarity: "common", text: "Le premier module posé (plus petit numéro) produit ×3.",
    multiplier: (card, ctx) => (ctx.isFirstPlaced() ? 3 : 1),
  },
  janitor: {
    name: "Le Concierge", rarity: "common", text: "Les commandes du Terminal coûtent 1 $ de moins en boutique.",
    commandDiscount: 1,
  },
  // ---------- Vague 2 ----------
  veteran: {
    name: "Le Vétéran", rarity: "common", text: "+10 Compute par contrat déjà livré dans la partie.",
    atEnd: (result, env) => { if (!env.contractsWon) return false; result.compute += 10 * env.contractsWon; return true; },
  },
  mentor: {
    name: "La Mentor", rarity: "common", text: "+20 Compute par Plugin gris que tu possèdes.",
    atEnd: (result, env) => {
      const commons = env.pluginIds.filter((id) => PLUGIN_RARITY[id] === "common").length;
      result.compute += 20 * commons;
      return commons > 0;
    },
  },
  scrum: {
    name: "Le Scrum Master", rarity: "common", text: "Si 4 modules ou plus sont posés : +4 Scale.",
    atEnd: (result) => { if (result.count < 4) return false; result.scale += 4; return true; },
  },
  secuchief: {
    name: "Le Responsable Sécu", rarity: "common", text: "Fin de contrat : +2 $.",
    contractInterest: () => 2,
  },
  productchief: {
    name: "Chef de produit", rarity: "uncommon", text: "+2 Scale par module Business posé.",
    atEnd: (result) => {
      const count = countFamily(result.placed, "business");
      result.scale += 2 * count;
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
    name: "La Monétique", rarity: "uncommon", text: "Si 2 modules Business ou plus sont posés : +60 Compute.",
    atEnd: (result) => { if (countFamily(result.placed, "business") < 2) return false; result.compute += 60; return true; },
  },
  symmetric: {
    name: "Le Symétrique", rarity: "rare", text: "Un module posé sur la case miroir (gauche-droite) d'un autre module : les deux produisent ×2.",
    multiplier: (card, ctx) => {
      const mirror = mirrorCell(ctx.cell());
      return mirror !== ctx.cell() && ctx.cards[mirror] ? 2 : 1;
    },
  },
  tandem: {
    name: "Le Tandem", rarity: "rare", text: "+40 Compute par ligne qui a 2 modules de la même famille ou plus.",
    atEnd: (result) => {
      let rows = 0;
      for (let row = 0; row < GRID_SIZE; row++) {
        const line = result.cards.slice(row * GRID_SIZE, (row + 1) * GRID_SIZE).filter(Boolean);
        if (familiesOf(line).size < line.length) rows++;
      }
      result.compute += 40 * rows;
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
    name: "Le Clean Code", rarity: "epic", text: "Si tu n'as pas défaussé pendant ce contrat : +80 Compute et Scale ×1,5.",
    atEnd: (result, env) => {
      if (env.discardsUsed > 0) return false;
      result.compute += 80;
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
    name: "Le Testeur", rarity: "common", text: "+40 Compute si un module Ops est posé.",
    atEnd: (result) => {
      if (countFamily(result.placed, "ops") === 0) return false;
      result.compute += 40;
      return true;
    },
  },
  corner: {
    name: "Le Coin Café", rarity: "common", text: "+25 Compute par module posé dans un coin.",
    atEnd: (result) => {
      const count = CORNERS.filter((cell) => result.cards[cell]).length;
      result.compute += 25 * count;
      return count > 0;
    },
  },
  proofreader: {
    name: "Le Relecteur", rarity: "common", text: "+2 Scale par module de niveau 2 ou plus posé.",
    atEnd: (result) => {
      const count = result.placed.filter((card) => card.level >= 2).length;
      result.scale += 2 * count;
      return count > 0;
    },
  },
  alternate: {
    name: "L'Alternante", rarity: "uncommon", text: "+30 Compute par famille différente posée.",
    atEnd: (result) => {
      const count = familiesOf(result.placed).size;
      result.compute += 30 * count;
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
    name: "Le Pool de connexions", rarity: "rare", text: "+3 Scale par ligne du plateau sans module.",
    atEnd: (result) => {
      let empty = 0;
      for (let row = 0; row < GRID_SIZE; row++) {
        if (!result.cards.slice(row * GRID_SIZE, (row + 1) * GRID_SIZE).some(Boolean)) empty++;
      }
      result.scale += 3 * empty;
      return empty > 0;
    },
  },
  // ---------- Vague 4 (Plugins qui multiplient Scale et qui grandissent) ----------
  ticketjira: {
    name: "Le Ticket Jira", rarity: "common", text: "+0,5 Scale par déploiement joué depuis le début de la partie.",
    atEnd: (result, env) => { result.scale += 0.5 * env.deploysPlayed; return env.deploysPlayed > 0; },
  },
  sprint: {
    name: "Le Sprint", rarity: "common", text: "+20 Compute par déploiement déjà joué dans ce contrat.",
    atEnd: (result, env) => { result.compute += 20 * env.deploysThisContract; return env.deploysThisContract > 0; },
  },
  hotfix: {
    name: "Le Hotfix", rarity: "common", text: "+6 Scale au dernier déploiement du contrat.",
    atEnd: (result, env) => { if (!env.isLastDeploy) return false; result.scale += 6; return true; },
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

  // Vague 5 : Plugins d'architecture (comme les Jokers de paire, double paire, brelan, suite et couleur de Balatro).
  doublon: { name: "Le Doublon", rarity: "common", text: "+4 Scale si 2 modules identiques ou plus sont posés.", atEnd: scaleBonus("pair", 4) },
  failover: { name: "Le Failover", rarity: "common", text: "+50 Compute si 2 modules identiques ou plus sont posés.", atEnd: computeBonus("pair", 50) },
  duo: { name: "Le Duo de prod", rarity: "rare", scaleTimes: true, text: "Scale ×2 si 2 modules identiques ou plus sont posés.", atEnd: scaleFactor("pair", 2) },
  binome: { name: "Le Binôme", rarity: "common", text: "+6 Scale avec 2 paires de modules identiques.", atEnd: scaleBonus("twoPairs", 6) },
  planreprise: { name: "Le Plan de reprise", rarity: "common", text: "+70 Compute avec 2 paires de modules identiques.", atEnd: computeBonus("twoPairs", 70) },
  quatuor: { name: "Le Quatuor", rarity: "rare", scaleTimes: true, text: "Scale ×2,5 avec 2 paires de modules identiques.", atEnd: scaleFactor("twoPairs", 2.5) },
  triplet: { name: "Le Triplet", rarity: "common", text: "+8 Scale si 3 modules identiques ou plus sont posés.", atEnd: scaleBonus("triple", 8) },
  testcharge: { name: "Le Test de charge", rarity: "common", text: "+90 Compute si 3 modules identiques ou plus sont posés.", atEnd: computeBonus("triple", 90) },
  trio: { name: "Le Trio", rarity: "rare", scaleTimes: true, text: "Scale ×3 si 3 modules identiques ou plus sont posés.", atEnd: scaleFactor("triple", 3) },
  pilecomplete: { name: "La Pile complète", rarity: "common", text: "+8 Scale si les 5 familles sont posées.", atEnd: scaleBonus("allFamilies", 8) },
  devfullstack: { name: "Le Dev full-stack", rarity: "common", text: "+90 Compute si les 5 familles sont posées.", atEnd: computeBonus("allFamilies", 90) },
  ordre: { name: "L'Ordre", rarity: "rare", scaleTimes: true, text: "Scale ×3 si les 5 familles sont posées.", atEnd: scaleFactor("allFamilies", 3) },
  specialiste: { name: "La Spécialiste", rarity: "common", text: "+6 Scale si 5 modules de la même famille sont posés.", atEnd: scaleBonus("sameFamily", 6) },
  monotechno: { name: "La Mono-techno", rarity: "common", text: "+70 Compute si 5 modules de la même famille sont posés.", atEnd: computeBonus("sameFamily", 70) },
  tribu: { name: "La Tribu", rarity: "rare", scaleTimes: true, text: "Scale ×2 si 5 modules de la même famille sont posés.", atEnd: scaleFactor("sameFamily", 2) },
  // Vague 5 : petites mains (Monolithe, peu de modules, une seule famille).
  dettetech: { name: "La Dette technique", rarity: "common", text: "Monolithe : +6 Scale et +40 Compute.", atEnd: whenHand("monolith", (result) => { result.scale += 6; result.compute += 40; }) },
  monolitheassume: { name: "Le Monolithe assumé", rarity: "uncommon", scaleTimes: true, text: "Monolithe : Scale ×3.", atEnd: scaleFactor("monolith", 3) },
  modedegrade: { name: "Le Mode dégradé", rarity: "uncommon", scaleTimes: true, text: "3 modules posés ou moins : Scale ×1,5.", atEnd: scaleFactor("smallHand", 1.5) },
  monometier: { name: "Le Mono-métier", rarity: "rare", text: "Une seule famille posée : Compute ×2.", atEnd: whenHand("oneFamily", (result) => { result.compute *= 2; }) },
  // Vague 5 : moins de modules producteurs (Calcul), plus de production pour chacun.
  refactoring: { name: "Le Refactoring", rarity: "uncommon", text: "3 modules Calcul posés ou moins : ils produisent ×1,5.", multiplier: fewProducers(3, 1.5) },
  sobriete: { name: "La Sobriété", rarity: "rare", text: "2 modules Calcul posés ou moins : ils produisent ×2.", multiplier: fewProducers(2, 2) },
  zerodep: { name: "Le Zéro dépendance", rarity: "epic", text: "Un seul module Calcul posé : il produit ×4.", multiplier: fewProducers(1, 4) },
};

export const PLUGINS = Object.freeze(
  Object.fromEntries(Object.entries(DEFINITIONS).map(([id, def]) => [id, Object.freeze({ id, ...def, price: RULES.pluginPrice[def.rarity], hand: def.atEnd?.hand ?? null })])),
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
