// Lecture animée des événements d'un déploiement.

import { useCallback, useEffect, useRef, useState } from "react";
import { sfx } from "../../audio/sfx.js";
import { fmt, fmtDec } from "../../engine/format.js";

const EVENT_DELAYS = {
  activate: 420,
  fizzle: 420,
  boost: 300,
  retrigger: 260,
  joker: 420,
  limit: 900,
  info: 500,
  end: 300,
  destroy: 1100,
};

function eventFloaters(e) {
  if (e.t === "activate") {
    let t = [];
    if (e.out.compute) {
      t.push({ text: `+${fmt(e.out.compute)} ⚡`, tone: "compute" });
    }
    if (e.out.data) {
      t.push({ text: `+${fmt(e.out.data)} ◆`, tone: "data" });
    }
    if (e.out.scale) {
      t.push({ text: `+${fmtDec(e.out.scale)} ×`, tone: "scale" });
    }
    if (e.out.budget) {
      t.push({ text: `+${fmt(e.out.budget)} $`, tone: "budget" });
    }
    if (e.mult > 1 && t.length) {
      t.unshift({ text: `×${fmtDec(e.mult)}`, tone: "mult" });
    }
    return t;
  }
  return e.t === "fizzle"
    ? [{ text: e.reason === "Pas assez de Data" ? "Data manquante" : "En panne", tone: "fail" }]
    : e.t === "boost"
      ? [{ text: `Boost ×${fmtDec(e.mult)}`, tone: "boost" }]
      : e.t === "info" && e.slot !== undefined ? [{ text: "Boost perdu", tone: "fail" }] : [];
}

function eventSound(e, t) {
  switch (e.t) {
    case "activate":
      if (e.out.scale) {
        sfx.scale();
      } else {
        sfx.activate(t, e.mult > 1);
      }
      break;
    case "fizzle":
    case "limit":
      sfx.fail();
      break;
    case "boost":
      sfx.boost();
      break;
    case "retrigger":
      sfx.retrigger();
      break;
    case "joker":
      sfx.joker();
      break;
    case "destroy":
      sfx.crash();
      break;
    case "end":
      sfx.score(e.score >= 1e3);
      break;
  }
}

function readSpeed() {
  try {
    let e = Number(localStorage.getItem("breakpoint.speed"));
    return e === 2 || e === 4 ? e : 1;
  } catch {
    return 1;
  }
}

export function usePlayback() {
  let [e, t] = useState(null);
  let [o, a] = useState(-1);
  let [r, n] = useState([]);
  let [l, d] = useState(null);
  let [u, i] = useState(readSpeed);
  let c = useRef(null);
  let p = useRef(0);
  let m = useRef(-1);
  let y = e !== null && o < e.length;
  let v = e && o >= 0 && o < e.length ? e[o] : null;
  let w = useCallback(
    (j, ne) => {
      c.current = ne;
      p.current += 1;
      n([]);
      d(null);
      t(j);
      a(0);
    },
    [],
  );
  let T = useCallback(
    () => {
      t(null);
      a(-1);
      d(null);
      let j = c.current;
      c.current = null;
      j?.();
    },
    [],
  );
  let te = useCallback(
    () => {
      n([]);
      T();
    },
    [T],
  );
  let H = useCallback(
    (j) => {
      i(j);
      try {
        localStorage.setItem("breakpoint.speed", String(j));
      } catch { }
    },
    [],
  );
  useEffect(
    () => {
      if (!v) {
        return;
      }
      let j = p.current * 1e4 + o;
      let ne = v.t === "activate" || v.t === "fizzle" || v.t === "boost" || v.t === "info"
        ? v.slot
        : undefined;
      if (ne !== undefined) {
        let L = eventFloaters(v);
        if (L.length) {
          n((q) => q.some((le) => le.id === j) ? q : [...q.slice(-14), { id: j, slot: ne, lines: L }]);
          let Q = 1300 / u;
          window.setTimeout(() => n((q) => q.filter((le) => le.id !== j)), Q);
        }
      }
      if (v.t === "joker" || v.t === "destroy") {
        d({ id: j, uid: v.jokerUid, text: v.t === "joker" ? v.text : "Dette !" });
      }
      if (m.current !== j) {
        m.current = j;
        eventSound(v, e ? e.slice(0, o + 1).filter((L) => L.t === "activate").length : 0);
      }
    },
    [v, o, u, e],
  );
  useEffect(
    () => {
      if (!e || o < 0) {
        return;
      }
      if (o >= e.length) {
        let q = window.setTimeout(T, 650 / u);
        return () => window.clearTimeout(q);
      }
      let j = e[o];
      let ne = 1 + o / 18;
      let L = Math.max(70, EVENT_DELAYS[j.t] / ne) / u;
      let Q = window.setTimeout(() => a((q) => q + 1), j.t === "end" ? EVENT_DELAYS.end / u : L);
      return () => window.clearTimeout(Q);
    },
    [e, o, u, T],
  );
  let N = 0;
  if (e) {
    for (let j = 0; j <= Math.min(o, e.length - 1); j++) {
      if (e[j].t === "activate") {
        N++;
      }
    }
  }
  let S = e && o >= 0 ? e[Math.min(o, e.length - 1)].totals : null;
  return {
    state: {
      animating: e !== null,
      playing: y,
      index: o,
      event: v,
      totals: S,
      activeSlot: v && "slot" in v && v.slot !== undefined ? v.slot : v?.t === "retrigger" ? v.from : null,
      retriggerTargets: v?.t === "retrigger" ? v.to : [],
      popups: r,
      jokerPulse: l,
      activationCount: N,
      speed: u,
    },
    start: w,
    skip: te,
    setSpeed: H,
    events: e,
  };
}
