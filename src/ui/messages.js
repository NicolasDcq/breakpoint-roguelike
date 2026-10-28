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
  [Refusal.NO_COMMAND_SLOT]: () => `Terminal plein (${RULES.terminal.slots} commandes) : utilises-en une d'abord.`,
  [Refusal.COMMAND_NOT_NOW]: (view) => (view.phase === "play" ? "Cette commande s'utilise entre deux contrats, à la boutique." : "Cette commande s'utilise pendant un contrat."),
  [Refusal.NO_LAST_COMMAND]: () => "Aucune commande à rejouer : utilises-en une d'abord.",
  [Refusal.BAD_TARGETS]: () => "Choisis des modules dans la main tirée.",
  [Refusal.NO_ARCHITECTURE_PLAYED]: () => "Aucune architecture jouée pour le moment.",
};

export const refusalMessage = (reason, view) => MESSAGES[reason]?.(view) ?? "Action impossible.";
