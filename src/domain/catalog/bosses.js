// Contraintes des contrats C (les boss). Chaque contrainte peut :
// - changer le nombre de déploiements ou de modules posés ;
// - empêcher une case ou un module de s'activer (avec un mot pour l'expliquer).

const DEFINITIONS = {
  fewDeploys: { rule: "Client pressé : 3 déploiements seulement.", deploys: 3 },
  broken: { rule: "Panne : la case 5 ne s'active pas.", blockedCell: 4, blockedLabel: "Panne" },
  noServer: { rule: "Panne de courant : les Serveurs ne produisent rien.", blockedModule: "server", blockedLabel: "Coupure" },
  fewModules: { rule: "Budget serré : 3 modules posés au maximum.", maxPlaced: 3 },
};

export const BOSSES = Object.freeze(DEFINITIONS);

/** Ce que la contrainte change, avec les valeurs normales par défaut. */
export function bossLimits(bossId, defaults) {
  const boss = BOSSES[bossId];
  return {
    deploys: boss?.deploys ?? defaults.deploys,
    maxPlaced: boss?.maxPlaced ?? defaults.maxPlaced,
  };
}

/** Raison pour laquelle cette case ou ce module ne s'active pas, ou null. */
export function blockedBy(bossId, cell, card) {
  const boss = BOSSES[bossId];
  if (!boss) return null;
  if (boss.blockedCell === cell) return boss.blockedLabel;
  if (boss.blockedModule && boss.blockedModule === card.moduleId) return boss.blockedLabel;
  return null;
}
