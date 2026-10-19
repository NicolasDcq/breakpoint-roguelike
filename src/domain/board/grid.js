// Géométrie du plateau 4×4. Les cases sont numérotées de 0 à 15, ligne par ligne :
// elles s'activent dans cet ordre.

export const GRID_SIZE = 4;
export const CELL_COUNT = GRID_SIZE * GRID_SIZE;
export const CELLS = Array.from({ length: CELL_COUNT }, (_, cell) => cell);

const inside = (cell) => cell >= 0 && cell < CELL_COUNT;

/** Cases voisines (haut, bas, gauche, droite). */
export function neighborCells(cell) {
  const column = cell % GRID_SIZE;
  return [
    cell - GRID_SIZE,
    cell + GRID_SIZE,
    column > 0 ? cell - 1 : -1,
    column < GRID_SIZE - 1 ? cell + 1 : -1,
  ].filter(inside);
}

/** La case décalée de `offset` (par exemple +GRID_SIZE = juste en dessous), ou -1 hors du plateau. */
export function offsetCell(cell, offset) {
  const target = cell + offset;
  return inside(target) ? target : -1;
}
