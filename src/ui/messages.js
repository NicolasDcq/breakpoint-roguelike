// Textes des refus du domaine, pour le joueur.

import { Refusal, RULES } from "../domain/index.js";

const MESSAGES = {
  [Refusal.BOARD_FULL]: (view) => `${view.limits.maxPlaced} modules posés au maximum.`,
  [Refusal.CELL_TAKEN]: () => "Cette case est déjà prise.",
  [Refusal.NO_DISCARD_LEFT]: () => "Plus de défausse pour ce contrat.",
  [Refusal.NOT_ENOUGH_MONEY]: () => "Pas assez de $.",
  [Refusal.NOT_ENOUGH_DATA]: () => "Pas assez de ◆.",
  [Refusal.NO_PLUGIN_SLOT]: () => `${RULES.maxPlugins} Plugins au maximum.`,
  [Refusal.PARC_TOO_SMALL]: () => `Il faut garder ${RULES.minParcSize} modules au moins.`,
  [Refusal.MAX_LEVEL]: () => "Ce module est déjà au niveau maximum.",
  [Refusal.NOT_AT_HAND]: () => "On améliore un module quand il est en main ou posé.",
  [Refusal.NO_PACK_LEFT]: () => "Plus rien de ce genre dans l'arrivage.",
  [Refusal.PACK_PENDING]: () => "Choisis d'abord une carte dans le paquet ouvert.",
};

export const refusalMessage = (reason, view) => MESSAGES[reason]?.(view) ?? "Action impossible.";
