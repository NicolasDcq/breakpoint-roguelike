// Les contrats d'une partie : 8 versions × A, B, C, comme les 8 antes de Balatro.
// Le contrat C a une contrainte (boss) et reste le plus dur de sa version.
// Chaque partie tire ses noms de clients, ses objectifs (± un peu) et ses boss.

export const VERSIONS = 8;
export const LETTERS = Object.freeze(["A", "B", "C"]);
/** Objectif de base de chaque version (la courbe de Balatro : vite au début, de moins en moins ensuite). */
export const VERSION_BASES = Object.freeze([150, 400, 1000, 2500, 5500, 10000, 17500, 25000]);
/** Dans une version : le contrat B vaut 1,5 fois le A, le boss 2 fois. */
export const LETTER_FACTORS = Object.freeze({ A: 1, B: 1.5, C: 2 });
/** Objectif de référence de chaque contrat, dans l'ordre. */
export const BASE_TARGETS = Object.freeze(VERSION_BASES.flatMap((base) => LETTERS.map((letter) => Math.round(base * LETTER_FACTORS[letter]))));
/** L'objectif varie de ±8 % d'une partie à l'autre. */
export const TARGET_SPREAD = 0.08;

/** Noms possibles, par version : les clients grossissent au fil de la partie. */
export const CLIENT_NAMES = Object.freeze([
  ["Site de la Mairie", "Blog culinaire", "Portail des Impôts", "Boulangerie en ligne", "Club de foot du quartier", "Agenda de la médiathèque", "Annuaire des artisans"],
  ["Appli de covoiturage", "Jeu mobile", "Banque en ligne", "Plateforme de livraison", "Réseau de vélos partagés", "Appli de rencontres", "Billetterie de festival"],
  ["Plateforme de streaming", "Réseau social", "Hôpital Saint-Octet", "Bourse en ligne", "Opérateur télécom", "Moteur de recherche", "Cloud gaming"],
  ["Marketplace mondiale", "IA générative", "Agence spatiale", "Banque centrale", "Jeux olympiques en direct", "Réseau électrique national", "Métavers"],
  ["Sécurité sociale", "Contrôle aérien européen", "Réseau de paiement mondial", "Cinéma en streaming 4K", "Constructeur de voitures autonomes", "Assureur géant", "Plateforme d'e-sport"],
  ["Armée numérique", "Cadastre mondial", "Supercalculateur météo", "Réseau de satellites", "Bourse de New York", "Registre des brevets", "Réseau hospitalier national"],
  ["Cloud souverain", "Collisionneur de particules", "Système de vote en ligne", "Banque des banques", "Passeport numérique mondial", "Réseau électrique du continent", "Station spatiale internationale"],
  ["Cerveau mondial", "Internet lui-même", "Simulation de la planète", "Horloge atomique mondiale", "Le dernier serveur DNS", "Jumeau numérique de la Terre", "Le Grand Livre du monde"],
]);
