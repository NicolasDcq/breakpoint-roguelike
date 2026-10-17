// Formatage des nombres pour l'affichage.

export function fmt(e) {
  let t = Math.abs(e);
  if (t < 1e4) {
    return Number.isInteger(e) ? e.toLocaleString("fr-FR") : trimZeros(e.toFixed(2));
  }
  let o = [[1e12, "T"], [1e9, "G"], [1e6, "M"], [1e3, "k"]];
  for (let [a, r] of o) {
    if (t >= a) {
      return trimZeros((e / a).toFixed(t / a >= 100 ? 0 : 1)) + r;
    }
  }
  return String(e);
}

export function fmtDec(e) {
  let t = Math.abs(e);
  return t >= 1e3 ? fmt(Math.round(e)) : t >= 100 ? trimZeros(e.toFixed(1)) : trimZeros(e.toFixed(2));
}

export function trimZeros(e) {
  return e.includes(".") ? e.replace(/\.?0+$/, "") : e;
}
