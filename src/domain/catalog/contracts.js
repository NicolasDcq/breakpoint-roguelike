// Les 12 contrats d'une partie : 4 versions × A, B, C. Le contrat C a une contrainte (boss).

export const CONTRACTS = Object.freeze([
  { version: 1, letter: "A", name: "Site de la Mairie", target: 150 },
  { version: 1, letter: "B", name: "Blog culinaire", target: 220 },
  { version: 1, letter: "C", name: "Portail des Impôts", target: 270, boss: "fewDeploys" },
  { version: 2, letter: "A", name: "Appli de covoiturage", target: 420 },
  { version: 2, letter: "B", name: "Jeu mobile", target: 560 },
  { version: 2, letter: "C", name: "Banque en ligne", target: 730, boss: "broken" },
  { version: 3, letter: "A", name: "Plateforme de streaming", target: 950 },
  { version: 3, letter: "B", name: "Réseau social", target: 1230 },
  { version: 3, letter: "C", name: "Hôpital Saint-Octet", target: 1630, boss: "noServer" },
  { version: 4, letter: "A", name: "Marketplace mondiale", target: 2130 },
  { version: 4, letter: "B", name: "IA générative", target: 2780 },
  { version: 4, letter: "C", name: "Agence spatiale", target: 3000, boss: "fewModules" },
].map(Object.freeze));
