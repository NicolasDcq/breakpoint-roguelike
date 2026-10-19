// Un contrat en cours : la pioche, la main, le plateau, le score et les essais restants.
// Pas de remélange : une carte jouée ou défaussée ne revient qu'au contrat suivant.

import { Board } from "../board/Board.js";
import { ok, refuse, Refusal } from "../shared/Result.js";

export const CardPlace = Object.freeze({ DRAW: "draw", HAND: "hand", BOARD: "board", USED: "used" });

export class Round {
  constructor({ score = 0, deploysLeft, discardsLeft, drawPile, discardPile = [], hand = [], board = Board.empty() }) {
    this.score = score;
    this.deploysLeft = deploysLeft;
    this.discardsLeft = discardsLeft;
    this.drawPile = [...drawPile];
    this.discardPile = [...discardPile];
    this.hand = [...hand];
    this.board = board;
  }

  static start({ shuffledUids, deploys, discards, handSize }) {
    const round = new Round({ deploysLeft: deploys, discardsLeft: discards, drawPile: shuffledUids });
    round.drawUp(handSize);
    return round;
  }

  /** Complète la main (cartes posées comprises) jusqu'à `handSize`, tant que la pioche le permet. */
  drawUp(handSize) {
    while (this.hand.length + this.board.placedCount < handSize && this.drawPile.length) {
      this.hand.push(this.drawPile.pop());
    }
  }

  /** Où est cette carte pendant le contrat : pioche, main, plateau, ou déjà utilisée. */
  whereIs(uid) {
    if (this.hand.includes(uid)) return CardPlace.HAND;
    if (this.board.cells.includes(uid)) return CardPlace.BOARD;
    if (this.discardPile.includes(uid)) return CardPlace.USED;
    return CardPlace.DRAW;
  }

  get isStuck() {
    return this.hand.length === 0 && this.board.isEmpty;
  }

  place(uid, cell, maxPlaced) {
    if (!this.board.isFree(cell)) return refuse(Refusal.CELL_TAKEN);
    if (!this.hand.includes(uid)) return refuse(Refusal.NOT_IN_HAND);
    if (this.board.placedCount >= maxPlaced) return refuse(Refusal.BOARD_FULL);
    this.board = this.board.with(cell, uid);
    this.hand = this.hand.filter((other) => other !== uid);
    return ok();
  }

  /** Déplace un module posé ; si la case d'arrivée est prise, les deux échangent leur place. */
  move(from, to) {
    const uid = this.board.at(from);
    if (!uid) return refuse(Refusal.NOTHING_SELECTED);
    if (from === to) return ok();
    const other = this.board.at(to);
    this.board = this.board.with(from, other).with(to, uid);
    return ok();
  }

  unplace(cell) {
    const uid = this.board.at(cell);
    if (!uid) return refuse(Refusal.NOTHING_SELECTED);
    this.board = this.board.without(cell);
    this.hand.push(uid);
    return ok();
  }

  discard(uids, handSize) {
    if (!this.discardsLeft) return refuse(Refusal.NO_DISCARD_LEFT);
    const chosen = uids.filter((uid) => this.hand.includes(uid));
    if (!chosen.length) return refuse(Refusal.NOTHING_SELECTED);
    this.hand = this.hand.filter((uid) => !chosen.includes(uid));
    this.discardPile.push(...chosen);
    this.discardsLeft--;
    this.drawUp(handSize);
    return ok();
  }

  /** Enregistre un déploiement joué : le plateau part à la défausse. */
  recordDeploy(score) {
    this.score += score;
    this.deploysLeft--;
    this.discardPile.push(...this.board.placedUids());
    this.board = Board.empty();
  }

  toJSON() {
    return {
      score: this.score, deploysLeft: this.deploysLeft, discardsLeft: this.discardsLeft,
      drawPile: this.drawPile, discardPile: this.discardPile, hand: this.hand, board: this.board.toJSON(),
    };
  }

  static fromJSON(data) {
    return new Round({ ...data, board: new Board(data.board) });
  }
}
