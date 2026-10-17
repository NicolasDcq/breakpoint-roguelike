// Éditions des modules (Optimisée, Bêta, Machine Learning…).

export const EDITIONS = {
  opt: {
    id: "opt",
    name: "Optimisée",
    tag: "OPT",
    text: "+50 % de production.",
    extraCost: 2,
    weight: 35,
    producerOnly: true,
  },
  free: {
    id: "free",
    name: "Freemium",
    tag: "+1 $",
    text: "+1 $ à chaque activation, réactivations et modules de soutien compris.",
    extraCost: 2,
    weight: 30,
    producerOnly: false,
  },
  ctr: {
    id: "ctr",
    name: "Conteneurisé",
    tag: "CTR",
    text: "Voisin de tous les modules de sa rangée.",
    extraCost: 3,
    weight: 15,
    producerOnly: false,
  },
  beta: {
    id: "beta",
    name: "Bêta instable",
    tag: "BÊTA",
    text: "Production ×3, mais plante 1 déploiement sur 4 (annoncé à l’avance).",
    extraCost: 3,
    weight: 15,
    producerOnly: true,
  },
  ml: {
    id: "ml",
    name: "Machine Learning",
    tag: "ML",
    text: "+10 % de production définitif à chaque déploiement.",
    extraCost: 4,
    weight: 6,
    producerOnly: true,
  },
};

export const EDITION_IDS = Object.keys(EDITIONS);

export const EDITION_CHANCE = 0.15;

export const ML_GROWTH = 0.1;

export function editionMultiplier(module) {
  return module.edition === "opt"
    ? 1.5
    : module.edition === "beta"
      ? 3
      : module.edition === "ml" ? 1 + ML_GROWTH * (module.learn ?? 0) : 1;
}

export function betaCrashes(module, contractId, deployIndex) {
  if (module.edition !== "beta") {
    return false;
  }
  let key = `${module.uid}|${contractId}|${deployIndex}`;
  let hash = 2166136261;
  for (let n = 0; n < key.length; n++) {
    hash = Math.imul(hash ^ key.charCodeAt(n), 16777619);
  }
  return (hash >>> 0) % 4 === 0;
}
