// Le parc : la collection de modules du joueur, comme un paquet de cartes.
// Il fabrique aussi les identifiants des nouvelles cartes.

import { createCard, withLevel } from "./Card.js";

export class Parc {
  constructor(cards = [], nextId = cards.length + 1) {
    this.cards = [...cards];
    this.nextId = nextId;
  }

  static fromModules(moduleIds) {
    const parc = new Parc();
    moduleIds.forEach((moduleId) => parc.add(moduleId));
    return parc;
  }

  get size() {
    return this.cards.length;
  }

  find(uid) {
    return this.cards.find((card) => card.uid === uid) ?? null;
  }

  uids() {
    return this.cards.map((card) => card.uid);
  }

  add(moduleId, level = 1) {
    const card = createCard(`c${this.nextId++}`, moduleId, level);
    this.cards.push(card);
    return card;
  }

  remove(uid) {
    this.cards = this.cards.filter((card) => card.uid !== uid);
  }

  raiseLevel(uid) {
    this.cards = this.cards.map((card) => (card.uid === uid ? withLevel(card, card.level + 1) : card));
  }

  toJSON() {
    return { cards: this.cards, nextId: this.nextId };
  }

  static fromJSON(data) {
    return new Parc(data.cards.map((card) => createCard(card.uid, card.moduleId, card.level)), data.nextId);
  }
}
