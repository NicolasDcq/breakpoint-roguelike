// Géométrie du dessin du plateau (pistes, arcs).

export const TRACE_WIDTH = 400;

export const TRACE_HEIGHT = 212.75;

export const slotX = (e) => (e % 5 + 0.5) * (TRACE_WIDTH / 5);

export const slotY = (e) => (Math.floor(e / 5) + 0.5) * (TRACE_HEIGHT / 5);

export function busPath() {
  let e = "";
  for (let t = 0; t < 5; t++) {
    let o = slotY(t * 5);
    e += `M ${slotX(0) - 30} ${o} H ${slotX(4) + 30} `;
  }
  return e;
}

export function returnPaths() {
  let e = [];
  for (let t = 0; t < 4; t++) {
    let o = slotY(t * 5);
    let a = slotY((t + 1) * 5);
    let r = slotX(4) + 30;
    let n = slotX(0) - 30;
    let l = (o + a) / 2;
    e.push(
      `M ${r} ${o} C ${r + 18} ${o}, ${r + 18} ${l}, ${r} ${l} H ${n} C ${n - 18} ${l}, ${n - 18} ${a}, ${n} ${a}`,
    );
  }
  return e;
}

export function arcPath(e, t) {
  let o = slotX(e);
  let a = slotY(e);
  let r = slotX(t);
  let n = slotY(t);
  let l = (o + r) / 2;
  let d = (a + n) / 2 - 40 - Math.abs(o - r) * 0.15;
  return `M ${o} ${a} Q ${l} ${d} ${r} ${n}`;
}
