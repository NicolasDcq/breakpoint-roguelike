// Les 20 modules de base : coût, famille, production par niveau.

import { aboveBelow } from "./grid.js";
import { isModuleType, isProducerModule } from "./hybrids.js";
import { byLevel, fmtNum, round2 } from "./util.js";

export const SERVER_COMPUTE = [5, 8, 12];

export const DATABASE_DATA = [2, 3, 4];

export const API_COMPUTE = [7, 11, 16];

export const ANALYTICS_VALUES = [1, 1.5, 2];

export const CDN_VALUES = [0.4, 0.6, 0.8];

export const MICRO_BASE = [2, 3, 4];

export const MICRO_PER_NEIGHBOR = [3, 4, 5];

export const SAAS_BUDGET = [1, 2, 3];

export const CACHE_BOOST = [2, 2.5, 3];

export const WORKER_TIMES = [1, 2, 3];

export const GPU_VALUES = [14, 22, 32];

export const LAMBDA_VALUES = [2, 3, 4];

export const SEARCH_VALUES = [1, 1.5, 2];

export const BACKUP_VALUES = [1, 1.5, 2];

export const FIREWALL_VALUES = [0.4, 0.6, 0.8];

export const ADSERVER_BUDGET = [1, 1, 2];

export const ADSERVER_COMPUTE = [0, 3, 5];

export const MARKETPLACE_SCALE = [0.5, 0.75, 1];

export const QUEUE_COUNT = [1, 2, 3];

export const MONITORING_SCALE = [0.1, 0.15, 0.2];

export const MODULES = {
  server: {
    id: "server",
    name: "Serveur",
    family: "calcul",
    flavor: "Il ronronne. Personne ne sait où il est physiquement.",
    cost: 3,
    kind: "producer",
    accent: "cyan",
    usesNeighbors: false,
    describe: (e) => `Produit +${byLevel(SERVER_COMPUTE, e)} Compute.`,
    preview: (e) => `+${byLevel(SERVER_COMPUTE, e)} ⚡`,
    produce: (e) => ({ compute: byLevel(SERVER_COMPUTE, e.level) }),
  },
  micro: {
    id: "micro",
    name: "Microservice",
    family: "calcul",
    flavor: "Un monolithe, mais en 40 morceaux.",
    cost: 2,
    kind: "producer",
    accent: "cyan",
    usesNeighbors: true,
    describe: (e) => `Produit +${byLevel(MICRO_BASE, e)} Compute, et +${byLevel(MICRO_PER_NEIGHBOR, e)} de plus pour chaque Microservice voisin.`,
    preview: (e) => `+${byLevel(MICRO_BASE, e)} ⚡ (+${byLevel(MICRO_PER_NEIGHBOR, e)}/voisin)`,
    produce: (e) => {
      let t = e.hasPlugin("microarch");
      let o = e.neighbors().filter((a) => t || isModuleType(e.board[a], "micro")).length;
      return { compute: byLevel(MICRO_BASE, e.level) + byLevel(MICRO_PER_NEIGHBOR, e.level) * o };
    },
  },
  api: {
    id: "api",
    name: "API",
    family: "calcul",
    flavor: "Documentation : à venir.",
    cost: 4,
    kind: "producer",
    accent: "cyan",
    usesNeighbors: false,
    describe: (e) => `Consomme 1 Data pour produire +${byLevel(API_COMPUTE, e)} Compute. Sans Data : rien.`,
    preview: (e) => `1◆ → +${byLevel(API_COMPUTE, e)} ⚡`,
    produce: (e) => e.consumeData(1) ? { compute: byLevel(API_COMPUTE, e.level) } : null,
  },
  gpu: {
    id: "gpu",
    name: "GPU",
    family: "calcul",
    flavor: "Il chauffe la pièce. Et la facture.",
    cost: 7,
    kind: "producer",
    accent: "cyan",
    usesNeighbors: false,
    describe: (e) => `Dépense 1 $ de Budget pour produire +${byLevel(GPU_VALUES, e)} Compute. Sans Budget : rien.`,
    preview: (e) => `1$ → +${byLevel(GPU_VALUES, e)} ⚡`,
    produce: (e) => e.consumeBudget(1) ? { compute: byLevel(GPU_VALUES, e.level) } : null,
  },
  lambda: {
    id: "lambda",
    name: "Fonction Serverless",
    family: "calcul",
    flavor: "Il n’y a pas de serveur. Enfin, si. Mais pas le tien.",
    cost: 3,
    kind: "producer",
    accent: "cyan",
    usesNeighbors: false,
    describe: (e) => `Produit +2 Compute, et +${byLevel(LAMBDA_VALUES, e)} de plus par emplacement ouvert vide.`,
    preview: (e) => `+2 ⚡ (+${byLevel(LAMBDA_VALUES, e)}/vide)`,
    produce: (e) => ({ compute: 2 + byLevel(LAMBDA_VALUES, e.level) * e.emptyOpenSlots() }),
  },
  database: {
    id: "database",
    name: "Base de données",
    family: "stockage",
    flavor: "SELECT * FROM problèmes;",
    cost: 3,
    kind: "producer",
    accent: "violet",
    usesNeighbors: false,
    describe: (e) => `Ajoute +${byLevel(DATABASE_DATA, e)} Data à ton stock.`,
    preview: (e) => `+${byLevel(DATABASE_DATA, e)} ◆`,
    produce: (e) => ({ data: byLevel(DATABASE_DATA, e.level) }),
  },
  analytics: {
    id: "analytics",
    name: "Analytics",
    family: "stockage",
    flavor: "Un graphique qui monte. Personne ne sait ce qu’il mesure.",
    cost: 5,
    kind: "producer",
    accent: "pink",
    usesNeighbors: false,
    describe: (e) => `Consomme 2 Data pour ajouter +${fmtNum(byLevel(ANALYTICS_VALUES, e))} Scale. Sans Data : rien.`,
    preview: (e) => `2◆ → +${fmtNum(byLevel(ANALYTICS_VALUES, e))} ×`,
    produce: (e) => e.consumeData(2) ? { scale: byLevel(ANALYTICS_VALUES, e.level) } : null,
  },
  search: {
    id: "search",
    name: "Index de Recherche",
    family: "stockage",
    flavor: "Trouve tout. Sauf ce que tu cherches.",
    cost: 4,
    kind: "producer",
    accent: "violet",
    usesNeighbors: false,
    describe: (e) => `Produit +${fmtNum(byLevel(SEARCH_VALUES, e))} Compute par Data en stock, sans la consommer.`,
    preview: (e) => `+${fmtNum(byLevel(SEARCH_VALUES, e))} ⚡ /◆ stock`,
    produce: (e) => ({ compute: Math.round(byLevel(SEARCH_VALUES, e.level) * Math.max(0, e.dataStock())) }),
  },
  backup: {
    id: "backup",
    name: "Sauvegarde",
    family: "stockage",
    flavor: "Testée pour la dernière fois : jamais.",
    cost: 3,
    kind: "producer",
    accent: "violet",
    usesNeighbors: false,
    describe: (e) => `Ajoute +${fmtNum(byLevel(BACKUP_VALUES, e))} Data par module Stockage sur le plateau (elle comprise).`,
    preview: (e) => `+${fmtNum(byLevel(BACKUP_VALUES, e))} ◆ /Stockage`,
    produce: (e) => ({ data: Math.round(byLevel(BACKUP_VALUES, e.level) * e.familyCount("stockage")) }),
  },
  cdn: {
    id: "cdn",
    name: "CDN",
    family: "reseau",
    flavor: "Ton site, partout, tout le temps. Même là où personne ne le lit.",
    cost: 4,
    kind: "producer",
    accent: "pink",
    usesNeighbors: true,
    describe: (e) => `Ajoute +${fmtNum(byLevel(CDN_VALUES, e))} Scale pour chaque module voisin.`,
    preview: (e) => `+${fmtNum(byLevel(CDN_VALUES, e))} × /voisin`,
    produce: (e) => ({ scale: round2(byLevel(CDN_VALUES, e.level) * e.neighbors().length) }),
  },
  firewall: {
    id: "firewall",
    name: "Pare-feu",
    family: "reseau",
    flavor: "Bloque tout. Y compris toi.",
    cost: 5,
    kind: "producer",
    accent: "pink",
    usesNeighbors: false,
    describe: (e) => `Ajoute +${fmtNum(byLevel(FIREWALL_VALUES, e))} Scale par module Réseau sur le plateau (lui compris).`,
    preview: (e) => `+${fmtNum(byLevel(FIREWALL_VALUES, e))} × /Réseau`,
    produce: (e) => ({ scale: round2(byLevel(FIREWALL_VALUES, e.level) * e.familyCount("reseau")) }),
  },
  balancer: {
    id: "balancer",
    name: "Load Balancer",
    family: "reseau",
    flavor: "Répartit la charge. Et les responsabilités.",
    cost: 6,
    kind: "utility",
    accent: "green",
    usesNeighbors: true,
    describe: (e) => e === 1
      ? "Réactive chaque Serveur voisin."
      : e === 2
        ? "Réactive chaque Serveur et chaque API voisins."
        : "Réactive chaque module producteur voisin.",
    preview: (e) => e === 1 ? "↺ Serveurs voisins" : e === 2 ? "↺ Serv.+API voisins" : "↺ producteurs voisins",
    run: (e) => {
      let t = (r) => e.level === 1
        ? isModuleType(r, "server")
        : e.level === 2 ? isModuleType(r, "server") || isModuleType(r, "api") : isProducerModule(r);
      let o = e.neighbors().filter((a) => {
        let r = e.board[a];
        return r !== null && t(r);
      });
      if (o.length) {
        e.retrigger(o, 1 + e.retryBonus);
      }
    },
  },
  dns: {
    id: "dns",
    name: "DNS",
    family: "reseau",
    flavor: "C’est toujours le DNS.",
    cost: 4,
    kind: "utility",
    accent: "green",
    usesNeighbors: true,
    describe: (e) => e === 1
      ? "Réactive le module situé juste en dessous."
      : e === 2
        ? "Réactive les modules situés juste au-dessus et juste en dessous."
        : "Réactive 2 fois les modules situés juste au-dessus et juste en dessous.",
    preview: (e) => e === 1 ? "↺ dessous" : e === 2 ? "↺ dessus + dessous" : "↺ dessus + dessous ×2",
    run: (e) => {
      let { above, below } = aboveBelow(e.board, e.slot);
      let a = (e.level === 1 ? [below] : [above, below]).filter((r) => r >= 0);
      if (a.length) {
        e.retrigger(a, (e.level === 3 ? 2 : 1) + e.retryBonus);
      }
    },
  },
  saas: {
    id: "saas",
    name: "Abonnement SaaS",
    family: "business",
    flavor: "Résiliable à tout moment. Par courrier recommandé.",
    cost: 4,
    kind: "producer",
    accent: "amber",
    usesNeighbors: false,
    describe: (e) => `Rapporte +${byLevel(SAAS_BUDGET, e)} $ de Budget.`,
    preview: (e) => `+${byLevel(SAAS_BUDGET, e)} $`,
    produce: (e) => ({ budget: byLevel(SAAS_BUDGET, e.level) }),
  },
  adserver: {
    id: "adserver",
    name: "Régie Pub",
    family: "business",
    flavor: "Tu as aimé ce module ? Voici 12 modules similaires.",
    cost: 5,
    kind: "producer",
    accent: "amber",
    usesNeighbors: true,
    describe: (e) => byLevel(ADSERVER_COMPUTE, e)
      ? `Rapporte +${byLevel(ADSERVER_BUDGET, e)} $ et +${byLevel(ADSERVER_COMPUTE, e)} Compute par module voisin.`
      : `Rapporte +${byLevel(ADSERVER_BUDGET, e)} $ par module voisin.`,
    preview: (e) => byLevel(ADSERVER_COMPUTE, e)
      ? `+${byLevel(ADSERVER_BUDGET, e)}$ +${byLevel(ADSERVER_COMPUTE, e)}⚡ /voisin`
      : `+${byLevel(ADSERVER_BUDGET, e)} $ /voisin`,
    produce: (e) => {
      let t = e.neighbors().length;
      return {
        budget: byLevel(ADSERVER_BUDGET, e.level) * t,
        compute: byLevel(ADSERVER_COMPUTE, e.level) * t,
      };
    },
  },
  marketplace: {
    id: "marketplace",
    name: "Marketplace",
    family: "business",
    flavor: "Prend 30 % sur tout. Ne fabrique rien.",
    cost: 6,
    kind: "producer",
    accent: "amber",
    usesNeighbors: false,
    describe: (e) => `Ajoute +${fmtNum(byLevel(MARKETPLACE_SCALE, e))} Scale par module Business sur le plateau (elle comprise).`,
    preview: (e) => `+${fmtNum(byLevel(MARKETPLACE_SCALE, e))} × /Business`,
    produce: (e) => ({ scale: round2(byLevel(MARKETPLACE_SCALE, e.level) * e.familyCount("business")) }),
  },
  cache: {
    id: "cache",
    name: "Cache",
    family: "ops",
    flavor: "Il y a deux choses difficiles en informatique…",
    cost: 5,
    kind: "utility",
    accent: "green",
    usesNeighbors: false,
    describe: (e) => `Le prochain module producteur activé après lui produit ×${fmtNum(byLevel(CACHE_BOOST, e))} (si aucun ne suit, le boost est perdu). Plusieurs Caches s’additionnent : ×2 puis ×2 donnent ×3.`,
    preview: (e) => `suivant ×${fmtNum(byLevel(CACHE_BOOST, e))}`,
    run: (e) => e.armBoost(byLevel(CACHE_BOOST, e.level)),
  },
  worker: {
    id: "worker",
    name: "Worker",
    family: "ops",
    flavor: "Travaille la nuit. Ne se plaint jamais. Plante parfois.",
    cost: 5,
    kind: "utility",
    accent: "green",
    usesNeighbors: false,
    describe: (e) => {
      let t = byLevel(WORKER_TIMES, e);
      return `Réactive le module placé juste avant lui (numéro inférieur) ${t === 1 ? "une fois" : `${t} fois`}.`;
    },
    preview: (e) => `↺ précédent ×${byLevel(WORKER_TIMES, e)}`,
    run: (e) => {
      let t = -1;
      for (let o = e.slot - 1; o >= 0; o--) {
        if (e.board[o]) {
          t = o;
          break;
        }
      }
      if (t >= 0) {
        e.retrigger([t], byLevel(WORKER_TIMES, e.level) + e.retryBonus);
      }
    },
  },
  queue: {
    id: "queue",
    name: "File de Messages",
    family: "ops",
    flavor: "Ton message est important. Il sera traité dans l’ordre d’arrivée.",
    cost: 4,
    kind: "utility",
    accent: "green",
    usesNeighbors: false,
    describe: (e) => {
      let t = byLevel(QUEUE_COUNT, e);
      return t === 1
        ? "Le prochain module producteur activé sera réactivé une fois."
        : `Les ${t} prochains modules producteurs activés seront réactivés une fois.`;
    },
    preview: (e) => `↺ ${byLevel(QUEUE_COUNT, e)} suivant${byLevel(QUEUE_COUNT, e) > 1 ? "s" : ""}`,
    run: (e) => e.armQueue(byLevel(QUEUE_COUNT, e.level), 1),
  },
  monitoring: {
    id: "monitoring",
    name: "Monitoring",
    family: "ops",
    flavor: "Tout est vert. Ce qui est en soi suspect.",
    cost: 4,
    kind: "producer",
    accent: "pink",
    usesNeighbors: false,
    describe: (e) => `Ajoute +${fmtNum(byLevel(MONITORING_SCALE, e))} Scale par activation déjà effectuée pendant ce déploiement.`,
    preview: (e) => `+${fmtNum(byLevel(MONITORING_SCALE, e))} × /activation`,
    produce: (e) => ({ scale: round2(byLevel(MONITORING_SCALE, e.level) * e.activationCount()) }),
  },
};

export const FAMILY_ACCENTS = { calcul: "cyan", stockage: "violet", reseau: "pink", business: "amber", ops: "green" };

export const FAMILY_GLYPHS = { calcul: "⚡", stockage: "◆", reseau: "⇄", business: "$", ops: "⚙" };

for (let e of Object.values(MODULES)) {
  e.accent = FAMILY_ACCENTS[e.family];
}

export const MODULE_IDS = Object.keys(MODULES);
