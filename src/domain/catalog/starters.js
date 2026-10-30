// Le parc de départ : toujours le même, pour que les parties soient comparables (stats d'équilibrage).
// Comme le deck normal de Balatro : chaque module en 2 exemplaires, sauf les 3 modules Calcul de base
// (Serveur, Microservice, API) en 3 exemplaires. Les architectures du haut (Ferme, Datacenter) ne
// sortent donc pas au départ : il faut ajouter des exemplaires (colis, commande `cp`).
// Plus tard, chaque entreprise modifiera ce parc standard (voir la branche `main-old` pour l'idée).

const repeat = (moduleId, count) => Array(count).fill(moduleId);

const DEFINITIONS = {
  standard: {
    name: "Parc standard",
    text: "Chaque module en 2 exemplaires, et 3 Serveurs, Microservices et API.",
    parc: [
      ...repeat("server", 3), ...repeat("micro", 3), ...repeat("api", 3), ...repeat("gpu", 2), ...repeat("lambda", 2),
      ...repeat("database", 2), ...repeat("analytics", 2), ...repeat("search", 2),
      ...repeat("cdn", 2), ...repeat("firewall", 2), ...repeat("dns", 2),
      ...repeat("saas", 2), ...repeat("marketplace", 2), ...repeat("adserver", 2),
      ...repeat("cache", 2), ...repeat("worker", 2), ...repeat("queue", 2),
    ],
  },
};

export const STARTERS = Object.freeze(Object.fromEntries(Object.entries(DEFINITIONS).map(([id, starter]) => [id, Object.freeze({ id, ...starter })])));
export const STARTER_IDS = Object.keys(STARTERS);
export const DEFAULT_STARTER_ID = "standard";
