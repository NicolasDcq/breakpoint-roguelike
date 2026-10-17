// Réglages fixés à la construction (scripts/build.mjs et scripts/dev.mjs).

// Numéro de version, lu dans package.json.
export const APP_VERSION = typeof __APP_VERSION__ === "string" ? __APP_VERSION__ : "dev";

// Outils de développement (« Mode dev » du menu) : présents en local et sur les
// prévisualisations Vercel, absents de la version en ligne (bêta). On peut les
// forcer sur la bêta en ajoutant ?dev à l'adresse.
const devParam = typeof location !== "undefined" && new URLSearchParams(location.search).has("dev");
export const DEV_TOOLS = (typeof __DEV_TOOLS__ === "boolean" && __DEV_TOOLS__) || devParam;
