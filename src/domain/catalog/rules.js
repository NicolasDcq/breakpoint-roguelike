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
  architectureUpdatePrice: 3,
  shop: { modules: 4, plugins: 2, architectureUpdates: 2 },
  /** Coût en ◆ pour passer du niveau N au niveau N+1. */
  cardUpgradeCost: { 1: 3, 2: 6 },
  maxCardLevel: 3,
  /** Paiement d'un contrat livré, selon sa lettre. */
  contractPay: { A: 4, B: 5, C: 7 },
  startParc: [
    "server", "server", "server", "server",
    "database", "database", "database",
    "micro", "micro", "micro",
    "cdn", "cdn", "saas", "saas",
    "firewall", "analytics", "cache", "cache", "worker", "queue",
  ],
});

export const upgradeCost = (level) => RULES.cardUpgradeCost[level] ?? null;
