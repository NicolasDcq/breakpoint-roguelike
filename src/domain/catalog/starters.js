// Profils de départ : chaque partie commence avec un parc de 40 modules au style différent.
// Chaque profil garde au moins 14 modules Calcul : le Compute ne manque jamais au départ.

const repeat = (moduleId, count) => Array(count).fill(moduleId);

const DEFINITIONS = {
  classique: {
    name: "Start-up classique",
    text: "Un peu de tout, beaucoup de Serveurs.",
    parc: [...repeat("server", 8), ...repeat("micro", 6), "api", ...repeat("database", 6), ...repeat("cdn", 4), ...repeat("saas", 4), ...repeat("firewall", 2), ...repeat("analytics", 2), ...repeat("cache", 3), ...repeat("worker", 2), ...repeat("queue", 2)],
  },
  microservices: {
    name: "Architecture microservices",
    text: "Des Microservices qui aiment être voisins, et des réactivations.",
    parc: [...repeat("micro", 12), ...repeat("server", 4), ...repeat("database", 4), ...repeat("api", 2), ...repeat("cdn", 4), ...repeat("saas", 2), ...repeat("worker", 2), ...repeat("queue", 3), ...repeat("cache", 2), "dns", ...repeat("analytics", 2), "lambda", "firewall"],
  },
  data: {
    name: "Data lab",
    text: "Beaucoup de Data : l'API, l'Index et l'Analytics s'en nourrissent.",
    parc: [...repeat("server", 8), ...repeat("api", 2), ...repeat("micro", 4), ...repeat("lambda", 2), ...repeat("database", 8), ...repeat("search", 2), ...repeat("analytics", 4), ...repeat("cdn", 2), ...repeat("saas", 2), ...repeat("cache", 2), ...repeat("worker", 2), ...repeat("queue", 2)],
  },
  reseau: {
    name: "Hébergeur réseau",
    text: "Des CDN et Pare-feu pour faire monter le Scale.",
    parc: [...repeat("server", 8), ...repeat("micro", 6), ...repeat("cdn", 6), ...repeat("firewall", 4), ...repeat("dns", 2), ...repeat("database", 4), ...repeat("saas", 2), ...repeat("cache", 4), ...repeat("worker", 2), ...repeat("queue", 2)],
  },
  business: {
    name: "Agence e-commerce",
    text: "Du Business pour remplir la caisse et acheter plus.",
    parc: [...repeat("server", 8), ...repeat("micro", 4), ...repeat("lambda", 2), ...repeat("saas", 6), ...repeat("marketplace", 2), ...repeat("adserver", 2), ...repeat("database", 4), ...repeat("cdn", 4), ...repeat("analytics", 2), ...repeat("cache", 2), ...repeat("worker", 2), ...repeat("queue", 2)],
  },
  serverless: {
    name: "Tout serverless",
    text: "Des Serverless qui aiment l'espace autour d'eux.",
    parc: [...repeat("lambda", 8), ...repeat("server", 4), ...repeat("micro", 2), ...repeat("gpu", 2), ...repeat("database", 6), ...repeat("cdn", 4), ...repeat("saas", 4), ...repeat("firewall", 2), ...repeat("cache", 4), ...repeat("worker", 2), ...repeat("queue", 2)],
  },
};

export const STARTERS = Object.freeze(Object.fromEntries(Object.entries(DEFINITIONS).map(([id, starter]) => [id, Object.freeze({ id, ...starter })])));
export const STARTER_IDS = Object.keys(STARTERS);
