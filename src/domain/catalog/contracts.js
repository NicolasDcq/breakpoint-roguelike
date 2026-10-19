// Les contrats d'une partie : 4 versions × A, B, C. Le contrat C a une contrainte (boss).
// Chaque partie tire ses noms de clients, ses objectifs (± un peu) et ses boss.

/** Objectif de référence de chaque contrat, dans l'ordre. */
export const BASE_TARGETS = Object.freeze([150, 215, 265, 415, 550, 720, 940, 1210, 1610, 2100, 2740, 3200]);
export const VERSIONS = 4;
export const LETTERS = Object.freeze(["A", "B", "C"]);
/** L'objectif varie de ±8 % d'une partie à l'autre. */
export const TARGET_SPREAD = 0.08;

/** Noms possibles, par version : les clients grossissent au fil de la partie. */
export const CLIENT_NAMES = Object.freeze([
  ["Site de la Mairie", "Blog culinaire", "Portail des Impôts", "Boulangerie en ligne", "Club de foot du quartier", "Agenda de la médiathèque", "Annuaire des artisans"],
  ["Appli de covoiturage", "Jeu mobile", "Banque en ligne", "Plateforme de livraison", "Réseau de vélos partagés", "Appli de rencontres", "Billetterie de festival"],
  ["Plateforme de streaming", "Réseau social", "Hôpital Saint-Octet", "Bourse en ligne", "Opérateur télécom", "Moteur de recherche", "Cloud gaming"],
  ["Marketplace mondiale", "IA générative", "Agence spatiale", "Banque centrale", "Jeux olympiques en direct", "Réseau électrique national", "Métavers"],
]);
