// Les répliques de Loup Niel aux écrans de fin. Ajouter une réplique = ajouter une ligne.
// Le choix dépend de la graine de la partie : pas de hasard dans l'interface, et la même partie dit la même chose.

export const VICTORY_QUOTES = [
  "Ça, c'est de l'architecture multi-tenant !",
  "On peut dire que c'est du « yes » au client.",
  "Zéro downtime, 100 % de style.",
  "Tu viens de scaler ça comme un chef.",
  "Ça passe en prod un vendredi, et ça tient.",
  "Même le client n'a rien à redire. Si, il veut une modif.",
  "Ça, c'est ce que j'appelle de la haute dispo.",
  "Le monolithe pleure, le cluster exulte.",
  "Pas de rollback ce soir, je crois que tu as gagné.",
  "Ton parc est propre. Ton code, on verra lundi.",
  "Livré dans les temps ? Je note l'exploit.",
  "Un petit merge, et tout le monde y croit.",
];

export const DEFEAT_QUOTES = [
  "Ça, c'est un incident de prod. On fait un post-mortem ?",
  "Pas de panique : on appelle ça un « apprentissage ».",
  "Il manquait peut-être un petit cache.",
  "Single point of failure : c'était ton plateau.",
  "On rollback et on repart, personne n'a rien vu.",
  "Le client veut une réunion. Je dis que tu es en congé ?",
  "Pas de Ctrl+Z en prod, mais une nouvelle partie, si.",
  "Même les meilleurs ont fait tomber la prod un vendredi.",
  "Quand je dis « on fait du 80/20 », c'est les 80 % qu'il faut faire, pas les 20.",
];

/** Une réplique de la liste, choisie par la graine (même partie, même réplique). */
export const quoteFor = (quotes, seed) => quotes[Math.abs(Number(seed) || 0) % quotes.length];
