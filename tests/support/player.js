// Joueur automatique déterministe : il ne connaît que l'état et le reducer.
// Sert aux tests de non-régression (et de base au futur bot d'équilibrage).
//
//   playRun({ reduce, newRun, seed, level, company, steps })
//     → { actions, states, phase, contractIndex }
//
// Ses choix sont pseudo-aléatoires (graine fixe) parmi les actions possibles,
// avec une préférence pour les actions utiles : il couvre ainsi la boutique,
// l'arrivage, les améliorations, la fusion, le tiroir et les récompenses.

function lcg(seed) {
  let x = seed >>> 0 || 1;
  return () => {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    return x / 4294967296;
  };
}

function candidates(s, rnd) {
  const acts = [];
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  if (s.phase === "starter") return [{ type: "CHOOSE_STARTER", jokerId: pick(s.starterChoices) }];
  if (s.phase === "reward") {
    if (!s.rewardChoices.length || rnd() < 0.15) return [{ type: "SKIP_REWARD" }];
    const index = Math.floor(rnd() * s.rewardChoices.length);
    const choice = s.rewardChoices[index];
    const pickIdx = choice.kind === "recruit" ? Math.floor(rnd() * choice.defIds.length) : 0;
    return [{ type: "CHOOSE_REWARD", index, pick: pickIdx }, { type: "SKIP_REWARD" }];
  }
  if (s.phase !== "build") return [];
  if (s.boxChoices?.length) {
    return rnd() < 0.8 ? [{ type: "PICK_BOX", defId: pick(s.boxChoices) }, { type: "SKIP_BOX" }] : [{ type: "SKIP_BOX" }];
  }
  if (s.packChoices?.length) {
    return rnd() < 0.85 ? [{ type: "PICK_PACK", family: pick(s.packChoices) }] : [{ type: "SKIP_PACK" }];
  }
  const filled = s.board.map((m, i) => (m ? i : -1)).filter((i) => i >= 0);
  const r = rnd();
  if (r < 0.18) s.shop.forEach((it, i) => !it.sold && it.price <= s.budget && acts.push({ type: "BUY", index: i }));
  else if (r < 0.26) acts.push({ type: "BUY_PACK", slot: Math.floor(rnd() * 2) });
  else if (r < 0.30) acts.push({ type: "BUY_GOODIE" });
  else if (r < 0.40 && filled.length) {
    const slot = pick(filled);
    acts.push({ type: "UPGRADE", slot, branch: rnd() < 0.5 ? "A" : "B" });
  } else if (r < 0.45 && filled.length) acts.push({ type: "FUSE", slot: pick(filled) });
  else if (r < 0.50) {
    const closed = s.unlocked.map((u, i) => (u === false ? i : -1)).filter((i) => i >= 0);
    if (closed.length) acts.push({ type: "UNLOCK", slot: pick(closed) });
  } else if (r < 0.56 && filled.length) {
    const from = pick(filled);
    const to = rnd() < 0.3 ? 100 + Math.floor(rnd() * (s.drawer?.length ?? 2)) : Math.floor(rnd() * 25);
    acts.push({ type: "MOVE_MODULE", from, to });
  } else if (r < 0.58 && s.drawer?.some(Boolean)) {
    const from = 100 + s.drawer.findIndex(Boolean);
    acts.push({ type: "MOVE_MODULE", from, to: Math.floor(rnd() * 25) });
  } else if (r < 0.60) acts.push({ type: "REROLL" });
  else if (r < 0.62 && filled.length > 3) acts.push({ type: "SELL_MODULE", slot: pick(filled) });
  else if (r < 0.63 && s.jokers.length > 1) acts.push({ type: "SELL_PLUGIN", uid: pick(s.jokers).uid });
  else if (r < 0.65 && s.jokers.length > 1) acts.push({ type: "MOVE_PLUGIN", uid: pick(s.jokers).uid, dir: rnd() < 0.5 ? -1 : 1 });
  else if (r < 0.66) acts.push({ type: "DRAWER_EXPAND" });
  if (!acts.length || rnd() < 0.3) acts.push({ type: "DEPLOY" });
  return acts;
}

// Empreinte stable d'un état (sans la notice, qui contient un compteur d'affichage).
export function fingerprint(s) {
  return JSON.stringify(s, (k, v) => (v instanceof Set ? [...v] : v));
}

// rich : complète l'argent et la Data (action TUTO_PATCH) pour explorer la fin de partie.
export function playRun({ reduce, newRun, seed, level = 1, company = "startup", endless = false, steps = 300, rich = false }) {
  const rnd = lcg(seed * 7919 + level * 31 + company.length);
  let s = newRun(seed, level, endless, company);
  const actions = [];
  const states = [fingerprint(s)];
  for (let i = 0; i < steps; i++) {
    if (s.phase === "victory" || s.phase === "defeat") break;
    if (rich && s.phase === "build" && s.budget < 40) {
      s = reduce(s, { type: "TUTO_PATCH", patch: { budget: s.budget + 150, data: s.data + 60 } });
      states.push(fingerprint(s));
    }
    const acts = candidates(s, rnd);
    if (!acts.length) break;
    const a = acts[0];
    if (rich && a.type === "DEPLOY" && rnd() < 0.8) {
      // pousse le contrat jusqu'à l'objectif pour parcourir toute la partie
      const c = s.contracts[s.contractIndex];
      s = reduce(s, { type: "TUTO_PATCH", patch: { contractScore: c.target, contractData: s.contractData + 50 } });
      states.push(fingerprint(s));
    }
    let next = reduce(s, a);
    if (next === s && a.type !== "DEPLOY") next = reduce(s, acts[acts.length - 1]);
    actions.push(a.type);
    s = next;
    states.push(fingerprint(s));
  }
  return { actions, states, phase: s.phase, contractIndex: s.contractIndex, state: s };
}
