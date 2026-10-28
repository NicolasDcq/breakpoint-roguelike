// Résultat d'une commande du domaine : réussie, ou refusée avec une raison.
// Les raisons sont des codes ; l'interface choisit le texte à afficher.

export const ok = (value = null) => ({ ok: true, value });
export const refuse = (reason) => ({ ok: false, reason });

/** Codes de refus connus du domaine. */
export const Refusal = Object.freeze({
  WRONG_PHASE: "wrong-phase",
  CELL_TAKEN: "cell-taken",
  NOT_IN_HAND: "not-in-hand",
  BOARD_FULL: "board-full",
  NOTHING_PLACED: "nothing-placed",
  NO_DEPLOY_LEFT: "no-deploy-left",
  NO_DISCARD_LEFT: "no-discard-left",
  NOTHING_SELECTED: "nothing-selected",
  NOT_ENOUGH_MONEY: "not-enough-money",
  NOT_ENOUGH_DATA: "not-enough-data",
  ALREADY_SOLD: "already-sold",
  NO_PLUGIN_SLOT: "no-plugin-slot",
  MAX_LEVEL: "max-level",
  PARC_TOO_SMALL: "parc-too-small",
  UNKNOWN_CARD: "unknown-card",
  UNKNOWN_PLUGIN: "unknown-plugin",
  NOT_AT_HAND: "not-at-hand",
  UNKNOWN_OFFER: "unknown-offer",
  UNKNOWN_PACK: "unknown-pack",
  NO_PACK_LEFT: "no-pack-left",
  PACK_PENDING: "pack-pending",
  NOT_IN_PACK: "not-in-pack",
  UNKNOWN_COMMAND: "unknown-command",
  NO_COMMAND_SLOT: "no-command-slot",
  COMMAND_NOT_NOW: "command-not-now",
  NO_LAST_COMMAND: "no-last-command",
  NO_COMMAND_SESSION: "no-command-session",
  BAD_TARGETS: "bad-targets",
  NO_ARCHITECTURE_PLAYED: "no-architecture-played",
});
