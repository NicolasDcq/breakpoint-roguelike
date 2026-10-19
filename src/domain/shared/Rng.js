// Générateur aléatoire à graine : une partie se rejoue à l'identique.
// Son état est un simple nombre, donc il se sauvegarde avec la partie.

export class Rng {
  constructor(state) {
    this.state = state | 0;
  }

  next() {
    this.state = (this.state + 1831565813) | 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  int(max) {
    return Math.floor(this.next() * max);
  }

  shuffle(items) {
    const copy = [...items];
    for (let last = copy.length - 1; last > 0; last--) {
      const other = this.int(last + 1);
      [copy[last], copy[other]] = [copy[other], copy[last]];
    }
    return copy;
  }

  /** Tire `count` éléments différents, chacun avec une chance proportionnelle à son poids. */
  weightedSample(items, weightOf, count) {
    const pool = [...items];
    const picked = [];
    while (picked.length < count && pool.length) {
      const total = pool.reduce((sum, item) => sum + weightOf(item), 0);
      let roll = this.next() * total;
      let index = pool.findIndex((item) => (roll -= weightOf(item)) < 0);
      if (index < 0) index = pool.length - 1;
      picked.push(pool.splice(index, 1)[0]);
    }
    return picked;
  }

  /** Tire `count` éléments différents. */
  sample(items, count) {
    return this.shuffle(items).slice(0, count);
  }
}
