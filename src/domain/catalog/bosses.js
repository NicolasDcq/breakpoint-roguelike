// Contraintes des contrats C (les boss). Chaque partie en tire 4 différentes.
// Une contrainte peut :
// - changer le nombre de déploiements, de défausses, de cartes en main ou de modules posés ;
// - empêcher une case, un module ou une famille de s'activer (avec un mot pour l'expliquer) ;
// - couper les Plugins.
// targetFactor ajuste l'objectif : une contrainte plus dure demande un peu moins de Performance.

const DEFINITIONS = {
  fewDeploys: { name: "Client pressé", rule: "3 déploiements seulement.", deploys: 3, targetFactor: 1 },
  broken: { name: "Panne", rule: "la case 6 ne s'active pas.", blockedCell: 5, blockedLabel: "Panne", targetFactor: 1.05 },
  noServer: { name: "Panne de courant", rule: "les Serveurs ne produisent rien.", blockedModule: "server", blockedLabel: "Coupure", targetFactor: 1 },
  fewModules: { name: "Budget serré", rule: "3 modules posés au maximum.", maxPlaced: 3, targetFactor: 0.85 },
  noNetwork: { name: "Réseau saturé", rule: "les modules Réseau ne produisent rien.", blockedFamily: "reseau", blockedLabel: "Saturé", targetFactor: 1.05 },
  smallHand: { name: "Équipe réduite", rule: "5 cartes en main au lieu de 7.", handSize: 5, targetFactor: 0.95 },
  noDiscard: { name: "Gel des changements", rule: "aucune défausse.", discards: 0, targetFactor: 1 },
  noPlugins: { name: "Audit de sécurité", rule: "les Plugins sont coupés.", disablesPlugins: true, targetFactor: 0.9 },
};

export const BOSSES = Object.freeze(Object.fromEntries(Object.entries(DEFINITIONS).map(([id, boss]) => [id, Object.freeze({ id, ...boss, text: `${boss.name} : ${boss.rule}` })])));
export const BOSS_IDS = Object.keys(BOSSES);

/** Ce que la contrainte change, avec les valeurs normales par défaut. */
export function bossLimits(bossId, defaults) {
  const boss = BOSSES[bossId];
  return {
    deploys: boss?.deploys ?? defaults.deploys,
    maxPlaced: boss?.maxPlaced ?? defaults.maxPlaced,
    handSize: boss?.handSize ?? defaults.handSize,
    discards: boss?.discards ?? defaults.discards,
    pluginsActive: !boss?.disablesPlugins,
  };
}

/** Raison pour laquelle cette case ou ce module ne s'active pas, ou null. */
export function blockedBy(bossId, cell, card, familyOf) {
  const boss = BOSSES[bossId];
  if (!boss) return null;
  if (boss.blockedCell === cell) return boss.blockedLabel;
  if (boss.blockedModule && boss.blockedModule === card.moduleId) return boss.blockedLabel;
  if (boss.blockedFamily && boss.blockedFamily === familyOf(card.moduleId)) return boss.blockedLabel;
  return null;
}
