// Génération des contrats, objectifs, contraintes des clients et boss.

import {
  hasDoubleConstraints,
  hasHardBoss,
  payPenalty,
  targetMultiplier,
} from "./difficulty.js";
import { MODULES } from "./modules.js";

export const VERSIONS = 8;

export const CONTRACTS_PER_VERSION = 3;

export const TOTAL_CONTRACTS = VERSIONS * CONTRACTS_PER_VERSION;

export const STEPS = ["A", "B", "C"];

export const versionOf = (e) => Math.floor(e / CONTRACTS_PER_VERSION) + 1;

export function growthFactor(e) {
  return e <= 4 ? 1.4 : e <= 6 ? 1.6 : e <= VERSIONS ? 2 : 2.5;
}

export const MAJOR_TARGET_BONUS = 1.15;

export const roundTarget = (e) => {
  if (e < 1e3) {
    return Math.round(e / 10) * 10;
  }
  let t = 10 ** (Math.floor(Math.log10(e)) - 1);
  return Math.round(e / t) * t;
};

export function rawTarget(e) {
  let t = 40;
  for (let o = 1; o <= e; o++) {
    t *= growthFactor(versionOf(o));
  }
  return t;
}

export function baseTarget(e) {
  return roundTarget(rawTarget(e) * (e % 3 === 2 ? MAJOR_TARGET_BONUS : 1));
}

export const BASE_TARGETS = Array.from({ length: TOTAL_CONTRACTS }, (e, t) => baseTarget(t));

export const EARLY_CONTRACTS = [
  {
    name: "Landing Page",
    client: "Startup du coin",
    flavor: "Une page. Un bouton. « Ça devrait prendre 5 minutes, non ? »",
  },
  {
    name: "Blog Corporate",
    client: "Direction Communication",
    flavor: "Il faut pouvoir publier le mot du PDG. Une fois par an.",
  },
  {
    name: "Site de la Mairie",
    client: "Ville de Saint-Clic",
    flavor: "Le formulaire doit marcher sur l’ordinateur de l’accueil. Il date de 2007.",
  },
  {
    name: "Logiciel de Caisse",
    client: "Boulangerie Dupain",
    flavor: "Il doit imprimer les tickets. Et si possible faire le café.",
  },
  {
    name: "Portfolio",
    client: "Une graphiste très exigeante",
    flavor: "Le logo doit être « plus gros, mais plus discret ».",
  },
];

export const CONTRACT_POOL = [
  {
    name: "Appli de Livraison",
    client: "FoodRush",
    flavor: "Ils veulent « exploiter la donnée ». Laquelle ? Toute.",
  },
  {
    name: "Black Friday",
    client: "MégaShop",
    flavor: "Le site doit tenir 48 heures. Après, on verra.",
  },
  {
    name: "API Bancaire",
    client: "Banque Prudente & Fils",
    flavor: "Tout doit être validé en triple exemplaire.",
  },
  {
    name: "Réseau Social",
    client: "Chirp",
    flavor: "Il faut que ça scale. Pour quoi faire ? Personne ne sait.",
  },
  {
    name: "IA Générative",
    client: "PromptCorp",
    flavor: "Ils veulent de l’IA. Dans le grille-pain aussi.",
  },
  {
    name: "Appli de Rencontres",
    client: "Swipr",
    flavor: "L’algorithme doit « comprendre l’amour ». Pour jeudi.",
  },
  {
    name: "Plateforme de Streaming",
    client: "Flixo",
    flavor: "Le soir de la finale, tout le monde se connecte en même temps.",
  },
  {
    name: "Jeu Mobile",
    client: "Kawaii Studio",
    flavor: "Gratuit. Avec seulement 400 achats intégrés.",
  },
  {
    name: "Intranet RH",
    client: "GroupeCorp",
    flavor: "Le module congés doit refuser les demandes plus vite.",
  },
  {
    name: "Plateforme Crypto",
    client: "MoonBank",
    flavor: "Le cours monte. Le site doit monter aussi.",
  },
  {
    name: "Frigo Connecté",
    client: "SmartFrigo",
    flavor: "Le frigo envoie des notifications. Beaucoup de notifications.",
  },
  {
    name: "Billetterie de Concert",
    client: "TicketRush",
    flavor: "Ouverture des ventes à 10 h. Tout le monde arrive à 10 h.",
  },
  {
    name: "Application Météo",
    client: "Nuages & Cie",
    flavor: "Elle doit prévoir la pluie. Et l’humeur du PDG.",
  },
  {
    name: "Site de E-sport",
    client: "Team Lagless",
    flavor: "0 ms de latence. Ou la communauté se fâche.",
  },
  {
    name: "Logiciel Hospitalier",
    client: "CHU de Saint-Bug",
    flavor: "Zéro panne autorisée. Le cahier des charges fait 900 pages.",
  },
  {
    name: "Marketplace de Seconde Main",
    client: "Revendo",
    flavor: "Tout le monde vend, personne n’achète, tout le monde négocie.",
  },
  {
    name: "Vote en Ligne",
    client: "Comité des Fêtes",
    flavor: "Il faut que ce soit sûr. Et que ça marche sur un Minitel.",
  },
  {
    name: "Appli de Covoiturage",
    client: "RouleMa Poule",
    flavor: "Le conducteur annule toujours 5 minutes avant.",
  },
  {
    name: "Plateforme de Cours",
    client: "Académie Ctrl+Z",
    flavor: "10 000 étudiants, un examen, la même seconde.",
  },
  {
    name: "Assistant Vocal",
    client: "Hey Bidule",
    flavor: "Il doit tout comprendre. Surtout ce qu’on n’a pas dit.",
  },
  {
    name: "Site Gouvernemental",
    client: "Ministère des Formulaires",
    flavor: "Il faut un compte pour créer un compte.",
  },
];

export const BOSSES = [
  {
    name: "Migration du Monolithe",
    client: "Administration Centrale",
    flavor: "Un code de 2003 que personne n’ose toucher. Ton Plugin le plus à gauche est réquisitionné pour le comprendre.",
    rules: [{ kind: "disableLeftPlugin" }],
    deploys: 3,
    targetFactor: 1,
  },
  {
    name: "Audit de Sécurité",
    client: "Cabinet Paranoïa & Associés",
    flavor: "Toute exécution en boucle est suspecte. Les auditeurs bloquent les réactivations.",
    rules: [{ kind: "noRetrigger" }],
    deploys: 3,
    targetFactor: 0.3,
  },
  {
    name: "Hackathon de 24 h",
    client: "Incubateur Rocket",
    flavor: "Une seule démo devant le jury. Pas de deuxième chance.",
    rules: [{ kind: "rush" }],
    deploys: 1,
    targetFactor: 0.6,
  },
];

export const CONSTRAINTS = ["minDataProduced", "rush", "shopClosed", "hole", "deployCost", "bannedModule", "dataCost"];

export const EARLY_CONSTRAINTS = ["minDataProduced", "hole"];

export const BANNABLE_MODULES = ["api", "micro", "cache", "worker", "cdn", "saas"];

export const BAN_FROM_VERSION = 3;

export function makeRule(kind, version, rng) {
  switch (kind) {
    case "minDataProduced":
      return { kind, amount: 3 + 2 * version };
    case "hole":
      return { kind };
    case "deployCost":
      return { kind, amount: 2 + Math.ceil(version / 2) };
    case "bannedModule":
      return { kind, module: rng.pick(BANNABLE_MODULES) };
    case "dataCost":
      return { kind, amount: 2 };
    default:
      return { kind };
  }
}

export function generateContracts(rng, level = 1) {
  let early = rng.shuffle(EARLY_CONTRACTS);
  let pool = rng.shuffle(CONTRACT_POOL);
  let contracts = [];
  let poolIndex = 0;
  let lastRule = null;
  let pickRule = (c, p) => {
    let m = (c === 1 ? EARLY_CONSTRAINTS : CONSTRAINTS).filter((y) => !p.includes(y) && (y !== "bannedModule" || c >= BAN_FROM_VERSION));
    return rng.pick(m);
  };
  for (let c = 0; c < TOTAL_CONTRACTS - 1; c++) {
    let p = versionOf(c);
    let m = c % CONTRACTS_PER_VERSION;
    let y = p === 1 && m < 2 ? early[m] : pool[poolIndex++ % pool.length];
    let v = [];
    if (m === 2 || m === 1 && p >= 2) {
      let w = pickRule(p, lastRule ? [lastRule] : []);
      v.push(makeRule(w, p, rng));
      lastRule = w;
    }
    if (v.length && m > 0 && p >= 4 && hasDoubleConstraints(level)) {
      let w = pickRule(p, [v[0].kind, "bannedModule"]);
      v.push(makeRule(w, p, rng));
    }
    contracts.push({
      id: `c${c + 1}`,
      ...y,
      version: p,
      step: STEPS[m],
      major: m === 2,
      target: roundTarget(BASE_TARGETS[c] * targetMultiplier(level, p)),
      deploys: v.some((w) => w.kind === "rush") ? 2 : 3,
      rules: v,
    });
  }
  let boss = rng.pick(BOSSES);
  let bossRules = [...boss.rules];
  if (hasHardBoss(level)) {
    let c = ["hole", "deployCost", "dataCost", "minDataProduced"].filter((p) => !bossRules.some((m) => m.kind === p));
    bossRules.push(makeRule(rng.pick(c), VERSIONS, rng));
  }
  contracts.push({
    id: "boss",
    name: boss.name,
    client: boss.client,
    flavor: boss.flavor,
    version: VERSIONS,
    step: "C",
    major: true,
    target: roundTarget(
      BASE_TARGETS[TOTAL_CONTRACTS - 1] * boss.targetFactor * targetMultiplier(level, VERSIONS) * (hasHardBoss(level) ? 1.5 : 1),
    ),
    deploys: boss.deploys,
    rules: bossRules,
    boss: true,
  });
  return contracts;
}

export function generateEndlessVersion(rng, level, version, startIndex) {
  let contracts = [];
  let constraints = CONSTRAINTS.filter((l) => l !== "bannedModule");
  for (let l = 0; l < CONTRACTS_PER_VERSION; l++) {
    let d = startIndex + l;
    let u = baseTarget(d) * targetMultiplier(level, version);
    if (l === 2) {
      let p = rng.pick(BOSSES);
      let m = [...p.rules];
      let y = ["hole", "deployCost", "dataCost", "minDataProduced"].filter((v) => !m.some((w) => w.kind === v));
      m.push(makeRule(rng.pick(y), version, rng));
      contracts.push({
        id: `e${d + 1}`,
        name: p.name,
        client: p.client,
        flavor: p.flavor,
        version,
        step: "C",
        major: true,
        target: roundTarget(u * p.targetFactor),
        deploys: p.deploys,
        rules: m,
        boss: true,
      });
      continue;
    }
    let i = rng.pick(CONTRACT_POOL);
    let c = l === 1 ? [makeRule(rng.pick(constraints), version, rng)] : [];
    contracts.push({
      id: `e${d + 1}`,
      ...i,
      version,
      step: STEPS[l],
      major: false,
      target: roundTarget(u),
      deploys: c.some((p) => p.kind === "rush") ? 2 : 3,
      rules: c,
    });
  }
  return contracts;
}

export function ruleText(rule, deploys = 2) {
  switch (rule.kind) {
    case "minDataProduced":
      return `Produire aussi au moins ${rule.amount} Data pendant ce contrat.`;
    case "shopClosed":
      return "Boutique fermée pendant ce contrat.";
    case "hole":
      return "Un emplacement ouvert tombe en panne au début du contrat : son module part au tiroir (détruit si le tiroir est plein).";
    case "deployCost":
      return `Facture cloud : chaque déploiement coûte ${rule.amount} $, même à découvert.`;
    case "disableLeftPlugin":
      return "Le Plugin le plus à gauche est désactivé.";
    case "rush":
      return deploys === 1 ? "Un seul déploiement." : `Seulement ${deploys} déploiements.`;
    case "bannedModule":
      return `Interdit par le client : les modules ${MODULES[rule.module].name} ne s’activent pas.`;
    case "dataCost":
      return `Chaque déploiement retire ${rule.amount} Data de ton stock (s’il en reste).`;
    case "noRetrigger":
      return "Les réactivations sont bloquées (Worker, Load Balancer…).";
  }
}

export function ruleShortText(rule) {
  switch (rule.kind) {
    case "minDataProduced":
      return `Produire ${rule.amount} Data`;
    case "shopClosed":
      return "Boutique fermée";
    case "hole":
      return "Trou";
    case "deployCost":
      return `Déploiement ${rule.amount} $`;
    case "disableLeftPlugin":
      return "1er Plugin désactivé";
    case "rush":
      return "Moins de déploiements";
    case "bannedModule":
      return `${MODULES[rule.module].name} interdit`;
    case "dataCost":
      return `Déploiement ${rule.amount} ◆`;
    case "noRetrigger":
      return "Réactivations bloquées";
  }
}

export function findRule(contract, kind) {
  return contract.rules.find((o) => o.kind === kind);
}

export function contractPay(index, level = 1) {
  let step = index % CONTRACTS_PER_VERSION;
  return Math.max(1, 3 + step + Math.floor(versionOf(index) / 3) - payPenalty(level));
}

export const PAY_PER_UNUSED_DEPLOY = 1;
