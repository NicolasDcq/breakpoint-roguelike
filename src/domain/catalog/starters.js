// Profils de départ : chaque partie commence avec un parc de 20 modules au style différent.
// Chaque profil garde au moins 7 modules Calcul : le Compute ne manque jamais au départ.

const repeat = (moduleId, count) => Array(count).fill(moduleId);

const DEFINITIONS = {
  classique: {
    name: "Start-up classique",
    text: "Un peu de tout, beaucoup de Serveurs.",
    parc: [...repeat("server", 4), ...repeat("micro", 3), ...repeat("database", 3), ...repeat("cdn", 2), ...repeat("saas", 2), "firewall", "analytics", ...repeat("cache", 2), "worker", "queue"],
  },
  microservices: {
    name: "Architecture microservices",
    text: "Des Microservices qui aiment être voisins, et des réactivations.",
    parc: [...repeat("micro", 6), ...repeat("server", 2), ...repeat("database", 2), "api", ...repeat("cdn", 2), "saas", "worker", ...repeat("queue", 2), "cache", "dns", "analytics"],
  },
  data: {
    name: "Data lab",
    text: "Beaucoup de Data : l'API, l'Index et l'Analytics s'en nourrissent.",
    parc: [...repeat("server", 4), "api", ...repeat("micro", 2), "lambda", ...repeat("database", 4), "search", ...repeat("analytics", 2), "cdn", "saas", "cache", "worker", "queue"],
  },
  reseau: {
    name: "Hébergeur réseau",
    text: "Des CDN et Pare-feu pour faire monter le Scale.",
    parc: [...repeat("server", 4), ...repeat("micro", 3), ...repeat("cdn", 3), ...repeat("firewall", 2), "dns", ...repeat("database", 2), "saas", ...repeat("cache", 2), "worker", "queue"],
  },
  business: {
    name: "Agence e-commerce",
    text: "Du Business pour remplir la caisse et acheter plus.",
    parc: [...repeat("server", 4), ...repeat("micro", 2), "lambda", ...repeat("saas", 3), "marketplace", "adserver", ...repeat("database", 2), ...repeat("cdn", 2), "analytics", "cache", "worker", "queue"],
  },
  serverless: {
    name: "Tout serverless",
    text: "Des Serverless qui aiment l'espace autour d'eux.",
    parc: [...repeat("lambda", 4), ...repeat("server", 2), "micro", "gpu", ...repeat("database", 3), ...repeat("cdn", 2), ...repeat("saas", 2), "firewall", ...repeat("cache", 2), "worker", "queue"],
  },
};

export const STARTERS = Object.freeze(Object.fromEntries(Object.entries(DEFINITIONS).map(([id, starter]) => [id, Object.freeze({ id, ...starter })])));
export const STARTER_IDS = Object.keys(STARTERS);
