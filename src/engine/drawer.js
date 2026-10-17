// Tiroir de pièces détachées et trous du boss.

import { Rng } from "./rng.js";
import { withError, withNotice } from "./run.js";

export function moveWithDrawer(state, from, to) {
  if (state.phase !== "build") {
    return state;
  }
  if (from >= 100 && to >= 100) {
    return state;
  }
  let board = [...state.board];
  let drawer = [...state.drawer ?? [null, null]];
  let get = (i) => i >= 100 ? drawer[i - 100] : board[i];
  let set = (i, v) => {
    if (i >= 100) {
      drawer[i - 100] = v;
    } else {
      board[i] = v;
    }
  };
  if (from >= 100 ? from - 100 >= drawer.length : !state.unlocked[from]) {
    return state;
  }
  if (to >= 100 ? to - 100 >= drawer.length : !state.unlocked[to]) {
    return state;
  }
  let moving = get(from);
  if (!moving) {
    return state;
  }
  let other = get(to);
  set(from, other);
  set(to, moving);
  return { ...state, board, drawer };
}

export function expandDrawer(state) {
  if (state.phase !== "build") {
    return state;
  }
  let drawer = state.drawer ?? [null, null];
  if (drawer.length >= 6) {
    return withError(state, "Tiroir déjà au maximum.");
  }
  let cost = [20, 40, 70, 110][drawer.length - 2];
  if (state.budget < cost) {
    return withError(state, `Agrandir le tiroir coûte ${cost} $.`);
  }
  if (!state.goodies?.length) {
    return withError(state, "Il faut un goodie pour agrandir le tiroir.");
  }
  return withNotice(
    {
      ...state,
      budget: state.budget - cost,
      goodies: state.goodies.slice(1),
      drawer: [...drawer, null],
    },
    "Tiroir agrandi d’un emplacement.",
    "good",
  );
}

export function applyHole(state) {
  let contract = state.contracts?.[state.contractIndex];
  if (!contract || !contract.rules?.some((r) => r.kind === "hole")) {
    return state;
  }
  let holes = state.holes ?? [];
  let cap = state.endless ? 4 : state.level === 8 ? 2 : 1;
  if (holes.length >= cap) {
    return state;
  }
  let open = [];
  for (let i = 0; i < 25; i++) {
    if (state.unlocked[i] && !holes.includes(i)) {
      open.push(i);
    }
  }
  if (open.length <= 1) {
    return state;
  }
  let rng = new Rng(state.rng);
  let slot = open[rng.int(open.length)];
  let board = [...state.board];
  let unlocked = [...state.unlocked];
  let drawer = [...state.drawer ?? [null, null]];
  let removed = board[slot];
  unlocked[slot] = null;
  board[slot] = null;
  if (removed) {
    let f2 = drawer.findIndex((x) => !x);
    if (f2 >= 0) {
      drawer[f2] = removed;
    }
  }
  return { ...state, board, unlocked, drawer, holes: [...holes, slot], rng: rng.state };
}

export function brokenSlots(e) {
  return new Set();
}

export function moduleAt(state, slot) {
  return slot >= 100 ? (state.drawer ?? [])[slot - 100] : state.board[slot];
}
