// Astuces affichées selon le contrat.

const CONTRACT_HINTS = {
  0: "Il faut 40 de Performance en 3 déploiements. Lance un premier déploiement pour voir ce que produit ton plateau, puis renforce-le avec la boutique : une API placée après une Base transforme sa Data en Compute, un Cache booste le module suivant.",
  1: "Sélectionne un module pour l’améliorer avec ta Data. Un module amélioré produit beaucoup plus, mais la Data dépensée ne nourrit plus tes API.",
};

const RULE_HINTS = {
  minDataProduced: "Ce client veut aussi de la Data : une Base de plus, une Base améliorée, ou un Cache placé devant une Base.",
  rush: "Moins de déploiements que d’habitude. Chaque déploiement que tu n’utilises pas rapporte quand même 2 $.",
  shopClosed: "Boutique fermée : impossible d’acheter. Déplacer, améliorer, fusionner et vendre restent permis.",
  hole: "Un trou : un emplacement ouvert tombe en panne, son module part au tiroir.",
  deployCost: "Chaque déploiement coûte du Budget, même si tu passes à découvert. Avec un Budget négatif, plus aucun achat possible.",
  bannedModule: "Un type de module est interdit : il ne s’activera pas. Vends-le ou laisse-le dormir pour ce contrat.",
  dataCost: "Chaque déploiement retire de la Data avant de démarrer : tes API et Analytics en auront moins.",
  disableLeftPlugin: "Dernier contrat : ton Plugin le plus à gauche est désactivé. Mets en premier celui dont tu peux te passer.",
  noRetrigger: "Dernier contrat : les réactivations sont bloquées. Les Workers et Load Balancers ne servent plus à rien ici.",
};

export function contractHint(e, t) {
  if (CONTRACT_HINTS[e]) {
    return CONTRACT_HINTS[e];
  }
  let o = t.rules[0];
  return t.boss && o?.kind === "rush"
    ? "Dernier contrat : un seul déploiement pour tout donner. Prépare ton plateau avant de cliquer."
    : o ? RULE_HINTS[o.kind] ?? null : null;
}
