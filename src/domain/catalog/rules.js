// Règles chiffrées d'une partie. Un seul endroit pour les régler.

export const RULES = Object.freeze({
  /** Graine de la partie du tutoriel : une main avec deux paires de Calcul (Serveur et API), donc une vraie Redondance. */
  tutorialSeed: 28,
  handSize: 7,
  maxPlaced: 5,
  deploysPerContract: 4,
  discardsPerContract: 3,
  startMoney: 4,
  startData: 0,
  minParcSize: 16,
  maxPlugins: 5,
  /** Relance de la boutique (comme Balatro : 5 $, puis +1 $ à chaque relance, remise à zéro à chaque boutique). */
  rerollStartPrice: 5,
  /**
   * La boutique : Plugins en vente directe (tirés selon leur rareté) et emplacements de paquets.
   * Chaque emplacement tire son type de paquet au hasard, selon ces poids (comme Balatro : les paquets de Plugins sont rares).
   * La première boutique de la partie a toujours un Pack de Plugins (comme le Buffoon Pack garanti de Balatro).
   */
  shop: { plugins: 2, packSlots: 2, packWeights: { colis: 4, booster: 4, terminal: 4, plugins: 1.5, gros: 0.3 }, commandChance: 0.25 },
  /**
   * Le Terminal : des commandes à usage unique (voir catalog/commands.js).
   * Toutes les commandes coûtent le même prix ; le Pack Terminal (paquet au hasard) coûte un peu moins.
   */
  terminal: { slots: 2, price: 3, handSize: 8, removeMax: 2, moneyDoubleMax: 20, dataDoubleMax: 10, copyKeepsLevel: false },
  /** Chance de tirer chaque rareté en boutique et dans les Plugins de paquet (le légendaire ne sort que de certains paquets). */
  rarityWeights: { common: 62, uncommon: 26, rare: 9, epic: 3, legendary: 0 },
  /** Prix d'un Plugin selon sa rareté (la revente en rend la moitié). */
  pluginPrice: { common: 4, uncommon: 5, rare: 7, epic: 10, legendary: 15 },
  /** Coût en ◆ pour passer du niveau N au niveau N+1. */
  cardUpgradeCost: { 1: 3, 2: 6 },
  maxCardLevel: 3,
  /** Taille du parc de départ (le parc standard de starters.js, le même à chaque partie). */
  startParcSize: 37,
  /** Paiement d'un contrat livré, selon sa lettre. */
  contractPay: { A: 4, B: 5, C: 7 },
});

export const upgradeCost = (level) => RULES.cardUpgradeCost[level] ?? null;
