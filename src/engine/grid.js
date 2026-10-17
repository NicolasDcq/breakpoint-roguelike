// Géométrie du plateau 5×5 : voisins, diagonales, colonnes.

export const rowOf = (e) => Math.floor(e / 5);

export const colOf = (e) => e % 5;

export function neighbors(e) {
  let t = rowOf(e);
  let o = colOf(e);
  let a = [];
  if (t > 0) {
    a.push(e - 5);
  }
  if (o > 0) {
    a.push(e - 1);
  }
  if (o < 4) {
    a.push(e + 1);
  }
  if (t < 4) {
    a.push(e + 5);
  }
  return a;
}

export function diagonals(e) {
  let t = rowOf(e);
  let o = colOf(e);
  let a = [];
  for (let r of [-1, 1]) {
    for (let n of [-1, 1]) {
      let l = t + r;
      let d = o + n;
      if (l >= 0 && l < 5 && d >= 0 && d < 5) {
        a.push(l * 5 + d);
      }
    }
  }
  return a;
}

export function linkedNeighbors(e, t) {
  let o = neighbors(t).filter((n) => e[n] !== null);
  let a = Math.floor(t / 5);
  let r = e[t];
  for (let n = 0; n < 5; n++) {
    let l = a * 5 + n;
    if (!(l === t || o.includes(l) || !e[l])) {
      if (r?.edition === "ctr" || e[l].edition === "ctr") {
        o.push(l);
      }
    }
  }
  return o;
}

export function previousFilledSlot(e, t) {
  for (let o = t - 1; o >= 0; o--) {
    if (e[o]) {
      return o;
    }
  }
  return -1;
}

export function emptyBoard() {
  return Array.from({ length: 25 }, () => null);
}

export function aboveBelow(e, t) {
  let o = t - 5 >= 0 && e[t - 5] ? t - 5 : -1;
  let a = t + 5 < 25 && e[t + 5] ? t + 5 : -1;
  return { above: o, below: a };
}

export function columnMates(e, t) {
  let o = t % 5;
  let a = [];
  for (let r = 0; r < 5; r++) {
    let n = r * 5 + o;
    if (n !== t && e[n]) {
      a.push(n);
    }
  }
  return a;
}
