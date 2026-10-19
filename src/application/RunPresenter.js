// Présentateur : transforme la partie en données simples pour l'affichage.
// L'interface lit cette vue ; elle ne touche jamais l'agrégat directement.

import { RULES, upgradeCost } from "../domain/index.js";

export function presentRun(run) {
  const { round } = run;
  const toCard = (uid) => run.card(uid);
  return {
    seed: run.seed,
    phase: run.phase,
    contractIndex: run.contractIndex,
    contract: run.contract,
    nextContract: run.nextContract,
    bossRule: run.bossRule,
    limits: run.limits,
    money: run.money,
    data: run.data,
    pluginIds: run.pluginIds,
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
    offers: run.offers,
    boostersLeft: run.boostersLeft,
    boosterChoices: run.boosterChoices,
    lastPay: run.lastPay,
    removePrice: run.currentRemovePrice,
    rerollPrice: run.rerollPrice,
    canRemove: run.parc.size > RULES.minParcSize,
    upgradeCostOf: (card) => upgradeCost(card.level),
  };
}
