// Les 8 entreprises (équivalent des decks) et leurs effets.

export const COMPANIES = {
  startup: {
    id: "startup",
    name: "Start-up",
    color: "#2bd96b",
    tagline: "Deux serveurs et une base dans un garage.",
    start: ["database", "server", "server"],
    plus: "La partie de base, sans surprise.",
    minus: "Aucune.",
    effects: {},
  },
  banque: {
    id: "banque",
    name: "Banque",
    color: "#ffcf4a",
    tagline: "Le Budget dort, mais il rapporte.",
    start: ["database", "server", "server"],
    plus: "+1 $ d’intérêt par tranche de 5 $ gardés à la paie (max +5).",
    minus: "Tout coûte 1 $ de plus en boutique.",
    effects: { interest: true, shopBonus: 1 },
  },
  labo: {
    id: "labo",
    name: "Labo IA",
    color: "#9b6bff",
    tagline: "Les GPU chauffent, les éditions pleuvent.",
    start: ["database", "server", "server"],
    plus: "Éditions 2× plus fréquentes en boutique.",
    minus: "Un emplacement de Plugin en moins.",
    effects: { editionMult: 2, jokerSlots: -1 },
  },
  agence: {
    id: "agence",
    name: "Agence web",
    color: "#ff7cc6",
    tagline: "Tout passe par le réseau.",
    start: ["database", "balancer", "server"],
    plus: "Les réactivations vont jusqu’au 3e niveau.",
    minus: "Paie de contrat −1 $.",
    effects: { maxChain: 3, payBonus: -1 },
  },
  scaleup: {
    id: "scaleup",
    name: "Scale-up",
    color: "#13b6e0",
    tagline: "Lever, recruter, livrer. Vite.",
    start: ["database", "server", "micro"],
    plus: "+1 déploiement sur chaque contrat.",
    minus: "Objectifs +25 %.",
    effects: { extraDeploys: 1, targetFactor: 1.25 },
  },
  admin: {
    id: "admin",
    name: "Administration",
    color: "#eef2ff",
    tagline: "Lente, mais rien ne la surprend.",
    start: ["database", "server", "worker"],
    plus: "Une contrainte de moins par contrat (hors boss).",
    minus: "Pas de relance en boutique.",
    effects: { fewerConstraints: true, noReroll: true },
  },
  esn: {
    id: "esn",
    name: "ESN",
    color: "#ff8a1f",
    tagline: "Les consultants, c’est elle.",
    start: ["database", "server", "server"],
    plus: "Plugins 1 $ moins chers, +1 emplacement de Plugin.",
    minus: "2 modules seulement en boutique.",
    effects: { jokerDiscount: 1, jokerSlots: 1, shopModules: -1 },
  },
  cloud: {
    id: "cloud",
    name: "Cloud provider",
    color: "#5fe0ff",
    tagline: "Des racks à perte de vue.",
    start: ["database", "server", "lambda"],
    plus: "7 emplacements ouverts au départ au lieu de 6.",
    minus: "Ouvrir un emplacement coûte 2× plus.",
    effects: { openSlots: 7, unlockCostMult: 2 },
  },
};

export const COMPANY_IDS = Object.keys(COMPANIES);

export function getCompany(e) {
  return COMPANIES[e ?? "startup"] ?? COMPANIES.startup;
}

export function companyEffects(e) {
  return getCompany(e).effects;
}

export function applyCompanyToContracts(e, t) {
  let o = companyEffects(t);
  return !o.targetFactor && !o.fewerConstraints
    ? e
    : e.map((a) => ({
      ...a,
      target: o.targetFactor ? Math.round(a.target * o.targetFactor) : a.target,
      rules: o.fewerConstraints && !a.boss && a.rules.length ? a.rules.slice(1) : a.rules,
    }));
}

export function companyInterest(e, t) {
  return companyEffects(e).interest ? Math.min(5, Math.floor(Math.max(0, t) / 5)) : 0;
}
