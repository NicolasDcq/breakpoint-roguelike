// Règles chiffrées d'une partie. Un seul endroit pour les régler.

export const RULES = Object.freeze({
  handSize: 7,
  maxPlaced: 5,
  deploysPerContract: 4,
  discardsPerContract: 3,
  startMoney: 4,
  startData: 0,
  minParcSize: 8,
  maxPlugins: 4,
  removeStartPrice: 2,
  rerollStartPrice: 1,
  /** Plugins proposés en boutique, tirés selon leur rareté. */
  shop: { plugins: 2 },
  rarityWeights: { common: 60, uncommon: 30, rare: 10 },
  /** Coût en ◆ pour passer du niveau N au niveau N+1. */
  cardUpgradeCost: { 1: 3, 2: 6 },
  maxCardLevel: 3,
  /** Taille du parc de départ (voir les profils dans starters.js). */
  startParcSize: 20,
  /** Paiement d'un contrat livré, selon sa lettre. */
  contractPay: { A: 4, B: 5, C: 7 },
});

export const upgradeCost = (level) => RULES.cardUpgradeCost[level] ?? null;
