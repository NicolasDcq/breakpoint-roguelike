// Dessin en pixel art d'un Plugin : une grille de lettres devient des rectangles SVG.

import { memo } from "react";
import { PALETTE, SPRITES } from "./sprites.js";

/** Regroupe les pixels voisins de même couleur sur une ligne (moins de rectangles). */
function runsOf(rows) {
  const runs = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const color = row[x];
      let end = x;
      while (end < row.length && row[end] === color) end++;
      if (color !== ".") runs.push({ x, y, width: end - x, fill: PALETTE[color] });
      x = end;
    }
  });
  return runs;
}

const RUNS = Object.fromEntries(Object.entries(SPRITES).map(([id, rows]) => [id, runsOf(rows)]));

export const PixelSprite = memo(function PixelSprite({ id, size = 64 }) {
  const runs = RUNS[id];
  if (!runs) return null;
  return (
    <svg className="puce-sprite" viewBox="0 0 16 16" width={size} height={size} shapeRendering="crispEdges" aria-hidden="true">
      {runs.map((run, index) => <rect key={index} x={run.x} y={run.y} width={run.width} height={1} fill={run.fill} />)}
    </svg>
  );
});
