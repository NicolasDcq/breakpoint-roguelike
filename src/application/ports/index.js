// Ports : ce dont l'application a besoin du monde extérieur.
// Les adaptateurs (infrastructure) les implémentent ; l'application ne connaît que ces contrats.

/**
 * Sauvegarde d'une partie.
 * @typedef {object} RunRepository
 * @property {() => (object|null)} load   la dernière sauvegarde, ou null
 * @property {(snapshot: object) => void} save
 * @property {() => void} clear
 */

/**
 * Source de graines pour les nouvelles parties.
 * @typedef {object} SeedSource
 * @property {() => number} next
 */

/**
 * Préférences du joueur (par exemple : règles déjà lues).
 * @typedef {object} PreferenceStore
 * @property {(key: string) => (string|null)} get
 * @property {(key: string, value: string) => void} set
 */

export {};
