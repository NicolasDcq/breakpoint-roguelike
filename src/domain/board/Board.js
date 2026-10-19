// Le plateau : 16 cases (4×4), chacune vide (null) ou occupée par une carte (son uid).
// Objet valeur : chaque changement rend un nouveau plateau.

import { CELL_COUNT } from "./grid.js";

export class Board {
  constructor(cells = Array(CELL_COUNT).fill(null)) {
    this.cells = Object.freeze([...cells]);
  }

  static empty() {
    return new Board();
  }

  at(cell) {
    return this.cells[cell];
  }

  isFree(cell) {
    return this.cells[cell] === null;
  }

  get placedCount() {
    return this.cells.filter(Boolean).length;
  }

  get isEmpty() {
    return this.placedCount === 0;
  }

  placedUids() {
    return this.cells.filter(Boolean);
  }

  with(cell, uid) {
    const cells = [...this.cells];
    cells[cell] = uid;
    return new Board(cells);
  }

  without(cell) {
    return this.with(cell, null);
  }

  toJSON() {
    return [...this.cells];
  }
}
