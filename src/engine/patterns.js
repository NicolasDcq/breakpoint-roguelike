// Formes du plateau lues par les Plugins de forme (lignes, carrés, symétrie…).

import { FAMILIES, familyLevel } from "./families.js";
import { neighbors } from "./grid.js";
import { MODULES } from "./modules.js";

export function familyAt(b2, i) {
  let m = b2[i];
  return m ? MODULES[m.defId].family : null;
}

export function countLinesOf3(b2) {
  let n = 0;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 3; c++) {
      let h2 = [r * 5 + c, r * 5 + c + 1, r * 5 + c + 2];
      let v = [c * 5 + r, (c + 1) * 5 + r, (c + 2) * 5 + r];
      for (let w of [h2, v]) {
        let f2 = familyAt(b2, w[0]);
        if (f2 && w.every((i) => familyAt(b2, i) === f2)) {
          n++;
        }
      }
    }
  }
  return n;
}

export function countFullSquares(b2) {
  let n = 0;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      let i = r * 5 + c;
      if ([i, i + 1, i + 5, i + 6].every((k) => b2[k])) {
        n++;
      }
    }
  }
  return n;
}

export function countFullColumns(b2) {
  let n = 0;
  for (let c = 0; c < 5; c++) {
    if ([c, c + 5, c + 10, c + 15, c + 20].every((k) => b2[k])) {
      n++;
    }
  }
  return n;
}

export function countFullDiagonals(b2) {
  return [[0, 6, 12, 18, 24], [4, 8, 12, 16, 20]].filter((d) => d.every((k) => b2[k])).length;
}

export function largestFamilyCluster(b2) {
  let s2 = new Set();
  let best = 0;
  for (let i = 0; i < 25; i++) {
    if (!b2[i] || s2.has(i)) {
      continue;
    }
    let f2 = familyAt(b2, i);
    let q = [i];
    let n = 0;
    for (s2.add(i); q.length;) {
      let x = q.pop();
      n++;
      for (let y of neighbors(x)) {
        if (!s2.has(y) && familyAt(b2, y) === f2) {
          s2.add(y);
          q.push(y);
        }
      }
    }
    best = Math.max(best, n);
  }
  return best;
}

export function isMirrored(b2) {
  for (let r = 0; r < 5; r++) {
    let o = r * 5;
    if (familyAt(b2, o) !== familyAt(b2, o + 4) || familyAt(b2, o + 1) !== familyAt(b2, o + 3)) {
      return false;
    }
  }
  return true;
}

export function isTidy(b2) {
  for (let i = 0; i < 25; i++) {
    let f2 = familyAt(b2, i);
    if (f2 && neighbors(i).some((j) => familyAt(b2, j) === f2)) {
      return false;
    }
  }
  return true;
}

export function countModules(b2) {
  return b2.filter(Boolean).length;
}

export function familyLevelsGained(L) {
  let n = 0;
  for (let k of FAMILIES) {
    n += familyLevel(L, k) - 1;
  }
  return n;
}
