// Ce qu'un module (ou un Plugin) a le droit de faire quand il s'active.
// Les modules ne voient que ce contexte : ils ne connaissent pas le moteur.

import { neighborCells, offsetCell } from "../board/grid.js";

export const MAX_RETRIGGER_DEPTH = 2;

export function createActivationContext({ cell, depth, cards, state, output, pending }) {
  const filled = (index) => index >= 0 && cards[index] !== null;
  return {
    // Production du module.
    addCompute: (value) => { output.compute += value; },
    addScale: (value) => { output.scale += value; },
    addData: (value) => { output.data += value; },
    addMoney: (value) => { output.money += value; },
    spendData: (amount) => state.spend("data", amount),
    spendMoney: (amount) => state.spend("money", amount),
    fail: (reason) => { output.failure = reason; },
    // Bonus des Plugins : ils s'ajoutent au total, sans multiplicateur.
    bonusScale: (value) => { state.result.scale += value; },
    multiplyScale: (factor) => { state.result.scale *= factor; },
    bonusData: (value) => { state.stock.data += value; state.result.data += value; },
    // Ce que le module voit du plateau.
    neighbors: () => neighborCells(cell).filter(filled).map((index) => cards[index]),
    placedCards: () => state.result.placed,
    emptyNeighborCount: () => neighborCells(cell).filter((index) => !filled(index)).length,
    dataStock: () => state.stock.data,
    cellOffset: (offset) => {
      const target = offsetCell(cell, offset);
      return filled(target) ? target : -1;
    },
    previousFilledCell: () => {
      for (let index = cell - 1; index >= 0; index--) if (filled(index)) return index;
      return -1;
    },
    isFirstPlaced: () => cell === cards.findIndex((card) => card !== null),
    isLastPlaced: () => cell === cards.findLastIndex((card) => card !== null),
    cell: () => cell,
    cards,
    nextFilledCell: () => {
      for (let index = cell + 1; index < cards.length; index++) if (filled(index)) return index;
      return -1;
    },
    isRetrigger: () => depth > 0,
    // Effets sur les autres activations.
    boostNext: (factor) => { state.boost = state.boost ? state.boost + factor - 1 : factor; },
    queueRetriggers: (count) => { state.queue += count; },
    retrigger: (targets, times) => {
      if (depth >= MAX_RETRIGGER_DEPTH) return;
      for (let time = 0; time < times; time++) targets.forEach((target) => pending.push(target));
    },
  };
}
