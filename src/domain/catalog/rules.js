// Règles chiffrées d'une partie. Un seul endroit pour les régler.

export const RULES = Object.freeze({
  /** Graine de la partie du tutoriel : une main avec deux paires (Server et Lambda), donc une vraie Redondance. */
  tutorialSeed: 27,
  handSize: 7,
  maxPlaced: 5,
  deploysPerContract: 4,
  discardsPerContract: 3,
  startMoney: 4,
  startData: 0,
  minParcSize: 16,
  maxPlugins: 5,
  removeStartPrice: 2,
  rerollStartPrice: 1,
  /**
   * La boutique : Plugins en vente directe (tirés selon leur rareté) et emplacements de paquets.
   * Chaque emplacement tire son type de paquet au hasard, selon ces poids (1 partout : chances égales).
   */
  shop: { plugins: 2, packSlots: 2, packWeights: { colis: 1, booster: 1, plugins: 1, gros: 1 } },
  /** Chance de tirer chaque rareté en boutique et dans les Plugins de paquet (le légendaire ne sort que de certains paquets). */
  rarityWeights: { common: 62, uncommon: 26, rare: 9, epic: 3, legendary: 0 },
  /** Prix d'un Plugin selon sa rareté (la revente en rend la moitié). */
  pluginPrice: { common: 4, uncommon: 5, rare: 7, epic: 10, legendary: 15 },
  /** Coût en ◆ pour passer du niveau N au niveau N+1. */
  cardUpgradeCost: { 1: 3, 2: 6 },
  maxCardLevel: 3,
  /** Taille du parc de départ (voir les profils dans starters.js). */
  startParcSize: 40,
  /** Paiement d'un contrat livré, selon sa lettre. */
  contractPay: { A: 4, B: 5, C: 7 },
});

export const upgradeCost = (level) => RULES.cardUpgradeCost[level] ?? null;
