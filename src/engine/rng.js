// Générateur aléatoire à graine (parties reproductibles).

export const Rng = class {
  constructor(t) {
    this.state = t;
  }
  next() {
    this.state = this.state + 1831565813 | 0;
    let t = this.state;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  int(t) {
    return Math.floor(this.next() * t);
  }
  pick(t) {
    return t[this.int(t.length)];
  }
  weighted(t, o) {
    let a = t.reduce((n, l) => n + o(l), 0);
    let r = this.next() * a;
    for (let n of t) {
      r -= o(n);
      if (r < 0) {
        return n;
      }
    }
    return t[t.length - 1];
  }
  shuffle(t) {
    let o = [...t];
    for (let a = o.length - 1; a > 0; a--) {
      let r = this.int(a + 1);
      [o[a], o[r]] = [o[r], o[a]];
    }
    return o;
  }
};

export function randomSeed() {
  return Math.floor(Math.random() * 1e9);
}
