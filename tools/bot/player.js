// Joueur automatique, pour l'équilibrage et le test de non-régression.
// Stratégie : essayer les combinaisons de la main, défausser pour viser une architecture,
// acheter les mises à jour des architectures les plus jouées.

import { Board, Phase, RULES, upgradeCost, OfferKind } from "../../src/domain/index.js";
import { GRID_SIZE } from "../../src/domain/board/grid.js";

// Pour aller vite, le bot cherche ses places dans le coin 3×3 en haut à gauche du plateau :
// 5 modules y tiennent, avec tous leurs voisinages possibles.
const CANDIDATE_CELLS = [0, 1, 2].flatMap((row) => [0, 1, 2].map((column) => row * GRID_SIZE + column));

function* subsets(items, maxSize, start = 0, current = []) {
  if (current.length) yield current;
  if (current.length === maxSize) return;
  for (let index = start; index < items.length; index++) yield* subsets(items, maxSize, index + 1, [...current, items[index]]);
}

/** Place les cartes une par une, chacune sur la meilleure case libre. */
function arrange(run, uids) {
  let board = Board.empty();
  for (const uid of uids) {
    let best = null;
    for (const cell of CANDIDATE_CELLS) {
      if (!board.isFree(cell)) continue;
      const candidate = board.with(cell, uid);
      const score = run.preview(candidate).score;
      if (!best || score > best.score) best = { board: candidate, score };
    }
    board = best.board;
  }
  return { board, score: run.preview(board).score };
}

function bestBoard(run) {
  let best = null;
  for (const uids of subsets(run.round.hand, run.limits.maxPlaced)) {
    const candidate = arrange(run, uids);
    if (!best || candidate.score > best.score) best = candidate;
  }
  return best;
}

function playTurn(service) {
  const { run } = service;
  let best = bestBoard(run);
  const missing = run.contract.target - run.round.score;
  while (run.round.discardsLeft && best.score * run.round.deploysLeft < missing) {
    const used = new Set(best.board.placedUids());
    const copies = {};
    run.round.hand.forEach((uid) => { const id = run.card(uid).moduleId; copies[id] = (copies[id] ?? 0) + 1; });
    const junk = run.round.hand.filter((uid) => !used.has(uid) && copies[run.card(uid).moduleId] === 1);
    if (!junk.length) break;
    service.discardCards(junk.slice(0, 4));
    if (run.phase !== Phase.PLAY) return;
    best = bestBoard(run);
  }
  best.board.cells.forEach((uid, cell) => { if (uid) service.placeCard(uid, cell); });
  service.deploy();
}

function shop(service, random) {
  service.openShop();
  const { run } = service;
  for (const card of [...run.parc.cards].sort(() => random() - 0.5)) {
    const cost = upgradeCost(card.level);
    if (cost && run.data >= cost) service.upgradeCard(card.uid);
  }
  const favorites = Object.entries(run.architecturePlays).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([id]) => id);
  run.offers.forEach((offer, index) => { if (offer.kind === OfferKind.ARCHITECTURE && favorites.includes(offer.id)) service.buyOffer(index); });
  run.offers.forEach((offer, index) => { if (offer.kind === OfferKind.PLUGIN) service.buyOffer(index); });
  run.offers.forEach((offer, index) => {
    if (offer.kind === OfferKind.MODULE && run.money >= offer.price + 2 && random() < 0.6) service.buyOffer(index);
  });
  service.nextContract();
}

/** Joue une partie complète. Rend la trace des étapes (pour le test de non-régression). */
export function playRun(service, botSeed) {
  let x = botSeed * 7919;
  const random = () => ((x = (x * 1103515245 + 12345) % 2147483648) / 2147483648);
  const trace = [];
  for (let guard = 0; guard < 500; guard++) {
    const { run } = service;
    if (run.phase === Phase.PLAY) playTurn(service);
    else if (run.phase === Phase.WON) shop(service, random);
    else break;
    trace.push(`${run.contractIndex}:${run.round.score}:${run.money}:${run.data}:${run.phase}`);
  }
  return { trace, phase: service.run.phase, contractIndex: service.run.contractIndex, plays: service.run.architecturePlays };
}

export { RULES };
