// Présentateur : transforme la partie en données simples pour l'affichage.
// L'interface lit cette vue ; elle ne touche jamais l'agrégat directement.

import { CardPlace, Phase, RULES, upgradeCost } from "../domain/index.js";

/**
 * @param {object} run
 * @param {{ started?: boolean }} [options]  started : le joueur a lancé cette partie (elle est sauvegardée).
 */
export function presentRun(run, { started = true } = {}) {
  const { round } = run;
  const toCard = (uid) => run.card(uid);
  return {
    seed: run.seed,
    phase: run.phase,
    /** Reprendre : une partie lancée, ni perdue ni gagnée (tous les contrats livrés). */
    inProgress: started && run.phase !== Phase.LOST && run.phase !== Phase.VICTORY,
    contractIndex: run.contractIndex,
    contract: run.contract,
    contracts: run.visibleContracts,
    contractCount: run.contracts.length,
    lastVersion: run.contracts.at(-1).version,
    starterId: run.starterId,
    nextContract: run.nextContract,
    bossRule: run.bossRule,
    limits: run.limits,
    money: run.money,
    data: run.data,
    pluginIds: run.pluginIds,
    pluginValues: run.pluginValues,
    architectureLevels: run.architectureLevels,
    architecturePlays: run.architecturePlays,
    score: round.score,
    deploysLeft: round.deploysLeft,
    discardsLeft: round.discardsLeft,
    drawCount: round.drawPile.length,
    playedCount: round.discardPile.length,
    hand: round.hand.map(toCard),
    board: run.cardsOn(),
    placedCount: round.board.placedCount,
    preview: run.preview(),
    parc: run.parc.cards,
    /** Où est chaque carte du parc pendant le contrat (tout est en pioche hors contrat). */
    placeOf: (uid) => (run.phase === Phase.PLAY ? round.whereIs(uid) : CardPlace.DRAW),
    offers: run.offers.map((offer) => ({ ...offer, price: run.priceOfOffer(offer) })),
    packSlots: run.packSlots,
    openPack: run.openPack,
    lastPay: run.lastPay,
    /** Le Terminal : les commandes gardées, l'emplacement de chacune, et la main tirée d'une commande ciblée en cours. */
    commands: run.commandIds,
    commandSlots: RULES.terminal.slots,
    lastCommand: run.lastCommand,
    commandSession: run.commandSession,
    wildUid: run.wildUid,
    rerollPrice: run.rerollPrice,
    upgradeCostOf: (card) => upgradeCost(card.level),
  };
}
