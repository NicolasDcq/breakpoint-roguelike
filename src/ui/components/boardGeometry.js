// Dessin des pistes du plateau (bus de chaque rangée, retours, arcs de réactivation).

import { GRID_SIZE } from "../../domain/index.js";

export const TRACE_WIDTH = 400;
export const TRACE_HEIGHT = 212.75;

export const slotX = (cell) => ((cell % GRID_SIZE) + 0.5) * (TRACE_WIDTH / GRID_SIZE);
export const slotY = (cell) => (Math.floor(cell / GRID_SIZE) + 0.5) * (TRACE_HEIGHT / GRID_SIZE);

const firstX = () => slotX(0) - 30;
const lastX = () => slotX(GRID_SIZE - 1) + 30;

export function busPath() {
  let path = "";
  for (let row = 0; row < GRID_SIZE; row++) path += `M ${firstX()} ${slotY(row * GRID_SIZE)} H ${lastX()} `;
  return path;
}

export function returnPaths() {
  const paths = [];
  for (let row = 0; row < GRID_SIZE - 1; row++) {
    const top = slotY(row * GRID_SIZE);
    const bottom = slotY((row + 1) * GRID_SIZE);
    const middle = (top + bottom) / 2;
    const right = lastX();
    const left = firstX();
    paths.push(`M ${right} ${top} C ${right + 18} ${top}, ${right + 18} ${middle}, ${right} ${middle} H ${left} C ${left - 18} ${middle}, ${left - 18} ${bottom}, ${left} ${bottom}`);
  }
  return paths;
}
