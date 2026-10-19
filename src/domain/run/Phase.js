// Les étapes d'une partie.
export const Phase = Object.freeze({
  PLAY: "play", // un contrat en cours
  WON: "won", // contrat livré, avant la boutique
  SHOP: "shop", // la boutique
  LOST: "lost", // partie perdue
  VICTORY: "victory", // les 12 contrats livrés
});
