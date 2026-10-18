// Usage : node tools/bot/run.mjs <fichier.jsonl> <worker> <nbWorkers> <niveaux> <entreprises|all> <graines a-b>
import { appendFileSync } from "node:fs";
import { playRun, R, Companies } from "./bot.mjs";
import { isHybrid, moduleFamilies } from "../../src/engine/hybrids.js";
import { moduleView } from "../../src/engine/moduleView.js";
const [out, w, nw, lv, co, sr] = process.argv.slice(2);
const levels = lv.split(",").map(Number);
const comps = co === "all" ? Object.keys(Companies) : co.split(",");
const [a, b] = sr.split("-").map(Number);
let k = 0;
for (const level of levels) for (const company of comps) for (let seed = a; seed <= b; seed++) {
  if (k++ % +nw !== +w) continue;
  const t = Date.now();
  let rec;
  try {
    const { s, log } = playRun({ seed: seed * 7919 + 13, level, company });
    const fam = {};
    for (const m of s.board) if (m) for (const f of moduleFamilies(m)) fam[f] = (fam[f] ?? 0) + 1;
    rec = { level, company, seed, phase: s.phase, reached: log.reached, total: s.contracts.length,
      starterOffered: log.starterOffered, starter: log.starter, plugins: s.jokers.map((j) => j.defId),
      boxOffered: log.offered, boxTaken: log.taken, actions: log.actions, goodies: s.goodies ?? [], rewards: log.rewards,
      familyLevels: s.familyLevels ?? {}, boardFam: fam, modules: s.board.filter(Boolean).map((m) => m.defId),
      fusions: s.stats?.fusions, hybrids: s.board.filter(isHybrid).map((m) => moduleView(m).baseName), stuck: log.stuck ?? null, ms: Date.now() - t };
  } catch (e) { rec = { level, company, seed, error: String(e.stack).slice(0, 400) }; }
  appendFileSync(out, JSON.stringify(rec) + "\n");
}
