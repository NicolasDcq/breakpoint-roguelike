// Bot d'équilibrage glouton, branché sur les sources du moteur (plus sur le bundle).
// Il ne lit jamais l'avenir : colis et paquets sont achetés sans voir leur contenu,
// puis il choisit le meilleur dedans. Chaque achat est évalué en simulant 3 déploiements.
//
//   node tools/bot/bot.mjs <graine> <niveau> <entreprise>
import { runReducer } from "../../src/engine/reducer.js";
import { MODULES } from "../../src/engine/modules.js";
import { COMPANIES } from "../../src/engine/companies.js";
import { findRule } from "../../src/engine/contracts.js";
import { arrivalKinds } from "../../src/engine/arrivals.js";
import { buyableSlots, currentContract, pluginSlots, unlockCost, upgradeCostFor } from "../../src/engine/run.js";

export const R = MODULES;
export const Companies = COMPANIES;
const A = (s, a) => runReducer(s, a);

function power(s, n = 3) {
  if (s.phase !== "build" || !s.board.some(Boolean)) return 0;
  let c = { ...s, contracts: s.contracts.map((k, i) => (i === s.contractIndex ? { ...k, target: 1e18, deploys: 99 } : k)), deploysUsed: 0, contractScore: 0, contractData: 0, boxChoices: null, packChoices: null };
  let tot = 0, dat = 0;
  const left = Math.max(1, currentContract(s).deploys - s.deploysUsed);
  for (let i = 0; i < n; i++) {
    const r = A(c, { type: "DEPLOY" });
    if (r === c || r.deploysUsed === c.deploysUsed) break;
    tot += r.lastExecution?.score ?? 0;
    dat += r.lastExecution?.dataProduced ?? 0;
    c = r;
  }
  const md = findRule(currentContract(s), "minDataProduced");
  if (md) {
    const need = md.amount - s.contractData, got = (dat / n) * left;
    if (need > 0 && got < need) tot *= 0.05 * Math.max(0.05, got / need);
  }
  return tot;
}

function openSlots(s) { const o = []; for (let i = 0; i < 25; i++) if (s.unlocked[i]) o.push(i); return o; }

function arrange(s, passes = 2) {
  let best = power(s), cur = s;
  for (let p = 0; p < passes; p++) {
    let improved = false;
    const cells = openSlots(cur).concat((cur.drawer ?? []).map((_, i) => 100 + i));
    for (let i = 0; i < cells.length; i++) for (let j = i + 1; j < cells.length; j++) {
      const a = cells[i], b = cells[j];
      if (a >= 100 && b >= 100) continue;
      const ga = a >= 100 ? cur.drawer[a - 100] : cur.board[a], gb = b >= 100 ? cur.drawer[b - 100] : cur.board[b];
      if (!ga && !gb) continue;
      const n = A(cur, { type: "MOVE_MODULE", from: ga ? a : b, to: ga ? b : a });
      if (n === cur) continue;
      const v = power(n);
      if (v > best + 1e-9) { best = v; cur = n; improved = true; }
    }
    for (let i = 0; i + 1 < cur.jokers.length; i++) {
      const n = A(cur, { type: "MOVE_PLUGIN", uid: cur.jokers[i].uid, dir: 1 });
      const v = power(n);
      if (v > best + 1e-9) { best = v; cur = n; improved = true; }
    }
    if (!improved) break;
  }
  return cur;
}

function pickBox(s, log) {
  let best = null, bv = power(s);
  for (const d of s.boxChoices) {
    let n = A(s, { type: "PICK_BOX", defId: d });
    if (n.jokers.length === s.jokers.length) {
      for (const j of s.jokers) {
        let m = A(A(s, { type: "SELL_PLUGIN", uid: j.uid }), { type: "PICK_BOX", defId: d });
        if (m.jokers.length !== s.jokers.length) continue;
        m = arrange(m, 1);
        const v = power(m);
        if (v > bv * 1.05) { bv = v; best = { st: m, d }; }
      }
      continue;
    }
    n = arrange(n, 1);
    const v = power(n);
    if (v >= bv || !best) { if (v >= bv) { bv = v; best = { st: n, d }; } }
  }
  for (const d of s.boxChoices) log.offered[d] = (log.offered[d] ?? 0) + 1;
  if (best) { log.taken[best.d] = (log.taken[best.d] ?? 0) + 1; return best.st; }
  return A(s, { type: "SKIP_BOX" });
}

function pickPack(s) {
  let best = null, bv = -1;
  const fam = {};
  for (const m of s.board) if (m) { const f = R[m.defId].family; fam[f] = (fam[f] ?? 0) + 1; }
  for (const f of s.packChoices) {
    const n = A(s, { type: "PICK_PACK", family: f });
    const v = power(n) + (fam[f] ?? 0) * 1e-3;
    if (v > bv) { bv = v; best = n; }
  }
  return best ?? A(s, { type: "SKIP_PACK" });
}

function shopStep(s, log) {
  const base = power(s) || 1;
  const cands = [];
  const consider = (label, n, costUsd, costData = 0, bonus = 0) => {
    if (n === s || (n.notice?.tone === "bad" && n.budget === s.budget && n.data === s.data)) return;
    if (n.boxChoices?.length || n.packChoices?.length) { cands.push({ label, n, ratio: bonus, gain: bonus }); return; }
    const v = power(n);
    const gain = (v - base) / base + bonus;
    if (gain <= 0.005) return;
    cands.push({ label, n, gain, ratio: gain / (costUsd + costData * 0.6 + 1) });
  };
  s.board.forEach((m, i) => {
    if (!m) return;
    if (m.fused) { consider("patch", A(s, { type: "UPGRADE", slot: i }), 0, 1); return; }
    if (m.level === 3 && !m.branch) { for (const b of ["A", "B"]) consider("branch", A(s, { type: "UPGRADE", slot: i, branch: b }), 0, 0, 0.001); return; }
    if (m.level === 2) for (const b of ["A", "B"]) consider("upgrade", A(s, { type: "UPGRADE", slot: i, branch: b }), 0, upgradeCostFor(s, m) ?? 0);
    else if (m.level === 1) consider("upgrade", A(s, { type: "UPGRADE", slot: i }), 0, upgradeCostFor(s, m) ?? 0);
    if (m.level === 3 && !m.fused) consider("fuse", A(s, { type: "FUSE", slot: i }), 0, 0, 0.001);
  });
  const free = openSlots(s).filter((i) => !s.board[i]);
  const drawerFree = (s.drawer ?? []).some((d) => !d);
  s.shop.forEach((o, i) => {
    if (o.sold || s.budget < o.price) return;
    if (o.kind === "module") {
      let n = s;
      if (!free.length && !drawerFree) {
        const u = (buyableSlots(s.unlocked) ?? [])[0];
        if (u === undefined) return;
        if (s.budget < o.price + unlockCost(s)) return;
        n = A(s, { type: "UNLOCK", slot: u });
      }
      n = A(n, { type: "BUY", index: i });
      if (n.budget === s.budget) return;
      consider("module:" + o.defId, arrange(n, 1), s.budget - n.budget);
    } else if (pluginSlots(s) <= s.jokers.length) {
      for (const j of s.jokers) {
        const n = A(A(s, { type: "SELL_PLUGIN", uid: j.uid }), { type: "BUY", index: i });
        if (n.jokers.length !== s.jokers.length) continue;
        consider("swap:" + o.defId, arrange(n, 1), Math.max(0, s.budget - n.budget));
      }
    } else consider("plugin:" + o.defId, arrange(A(s, { type: "BUY", index: i }), 1), o.price);
  });
  for (const k of (buyableSlots(s.unlocked) ?? []).slice(0, 3)) consider("unlock", A(s, { type: "UNLOCK", slot: k }), unlockCost(s));
  arrivalKinds(s).forEach((kind, k) => {
    if (s.arrTaken?.[k]) return;
    if (kind === "box" && s.jokers.length >= pluginSlots(s) && s.budget < 25) return;
    const n = A(s, { type: "BUY_PACK", slot: k });
    if (n.budget === s.budget) return;
    const price = s.budget - n.budget;
    const bonus = kind === "box" ? (s.jokers.length < pluginSlots(s) ? 0.06 : 0.02) : 0.04;
    if (s.budget - price >= 2) cands.push({ label: kind, n, gain: bonus, ratio: (bonus / (price + 1)) * 3 });
  });
  if (s.goodieOffer) {
    const n = A(s, { type: "BUY_GOODIE" });
    if (n.budget < s.budget) cands.push({ label: "goodie:" + s.goodieOffer, n, gain: 0.05, ratio: 0.05 / (s.budget - n.budget) });
  }
  if (!cands.length) return null;
  cands.sort((a, b) => b.ratio - a.ratio);
  const c = cands[0];
  const key = c.label.split(":")[0];
  log.actions[key] = (log.actions[key] ?? 0) + 1;
  if (c.label.startsWith("goodie")) log.goodies.push(c.label.slice(7));
  let n = c.n;
  if (n.boxChoices?.length) n = pickBox(n, log);
  if (n.packChoices?.length) n = pickPack(n);
  return n;
}

function chooseReward(s, log) {
  if (!s.rewardChoices?.length) return A(s, { type: "SKIP_REWARD" });
  const opts = [];
  s.rewardChoices.forEach((r, i) => {
    const picks = r.kind === "recruit" ? r.defIds.map((_, k) => k) : [undefined];
    for (const p of picks) {
      const n = A(s, { type: "CHOOSE_REWARD", index: i, pick: p });
      if (n === s || n.phase === "reward") continue;
      opts.push({ n: arrange(n, 1), kind: r.kind, extra: r.kind === "budget" ? r.amount : r.kind === "data" ? r.amount * 0.6 : 0 });
    }
  });
  const skip = A(s, { type: "SKIP_REWARD" });
  const base = power(arrange(skip, 1)) || 1;
  let best = skip, bv = 0, bk = "skip";
  for (const o of opts) {
    const v = (power(o.n) - base) / base + o.extra * 0.01 + (o.kind === "rack" ? 0.02 : 0);
    if (v > bv) { bv = v; best = o.n; bk = o.kind; }
  }
  log.rewards[bk] = (log.rewards[bk] ?? 0) + 1;
  return best;
}

export function playRun({ seed, level = 1, company = "startup", starter = null, banned = [] }) {
  const log = { offered: {}, taken: {}, actions: {}, goodies: [], rewards: {}, starterOffered: [], starter: null, reached: 0 };
  let s = A({}, { type: "NEW_RUN", seed, level, company });
  log.starterOffered = [...s.starterChoices];
  let pick = starter && s.starterChoices.includes(starter) ? starter : null;
  if (!pick) {
    let bv = -1;
    for (const d of s.starterChoices) {
      const n = arrange(A(s, { type: "CHOOSE_STARTER", jokerId: d }), 1);
      const v = power(n);
      if (v > bv) { bv = v; pick = d; }
    }
  }
  log.starter = pick;
  s = arrange(A(s, { type: "CHOOSE_STARTER", jokerId: pick }), 2);
  let guard = 0;
  while (s.phase !== "victory" && s.phase !== "defeat" && guard++ < 3000) {
    if (s.phase === "reward") { s = arrange(chooseReward(s, log), 2); continue; }
    if (s.phase !== "build") throw new Error("phase inattendue " + s.phase);
    if (s.boxChoices?.length) { s = pickBox(s, log); continue; }
    if (s.packChoices?.length) { s = pickPack(s); continue; }
    for (let k = 0; k < 40; k++) { const n = shopStep(s, log); if (!n) break; s = n; }
    s = arrange(s, 3);
    const before = s.contractIndex, d = A(s, { type: "DEPLOY" });
    if (d === s || (d.deploysUsed === s.deploysUsed && d.contractIndex === s.contractIndex && d.phase === s.phase)) {
      log.stuck = s.notice?.text || "deploy refusé";
      return { s, log };
    }
    s = d;
    if (s.contractIndex !== before || s.phase === "reward" || s.phase === "victory") log.reached = Math.max(log.reached, before + 1);
  }
  if (guard >= 3000) log.stuck = "boucle";
  log.reached = s.phase === "victory" ? s.contracts.length : log.reached;
  return { s, log };
}

if (process.argv[1]?.endsWith("bot.mjs")) {
  const t = performance.now();
  const { s, log } = playRun({ seed: +(process.argv[2] ?? 1), level: +(process.argv[3] ?? 1), company: process.argv[4] ?? "startup" });
  console.log(s.phase, "contrats réussis", log.reached, "/", s.contracts.length, "ms", Math.round(performance.now() - t));
  console.log("Plugins", s.jokers.map((j) => j.defId).join(","), "| goodies", (s.goodies ?? []).join(","));
  console.log("plateau", s.board.map((m) => (m ? m.defId + m.level + (m.branch ?? "") + (m.fused ? "F" : "") : ".")).join(" "));
  console.log("familles", JSON.stringify(s.familyLevels), "actions", JSON.stringify(log.actions), log.stuck ?? "");
}
