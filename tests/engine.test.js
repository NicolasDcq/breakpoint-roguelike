// Tests unitaires du moteur et des sauvegardes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { neighbors, diagonals, emptyBoard } from "../src/engine/grid.js";
import { Rng } from "../src/engine/rng.js";
import { newRun, upgradeAvailability } from "../src/engine/run.js";
import { runReducer, previewDeploy } from "../src/engine/reducer.js";
import { TOTAL_CONTRACTS } from "../src/engine/contracts.js";
import { MODULES } from "../src/engine/modules.js";
import { PLUGINS } from "../src/engine/plugins.js";
import { COMPANY_IDS } from "../src/engine/companies.js";
import { serializeRun, parseRun } from "../src/save/runSave.js";
import { emptyProfile, parseProfile, recordRun } from "../src/save/profile.js";

test("plateau 5×5 : voisins et diagonales", () => {
  assert.deepEqual(neighbors(0), [1, 5]);
  assert.deepEqual(neighbors(12), [7, 11, 13, 17]);
  assert.deepEqual(diagonals(12).sort((a, b) => a - b), [6, 8, 16, 18]);
  assert.equal(emptyBoard().length, 25);
});

test("le générateur aléatoire est reproductible", () => {
  const a = new Rng(42);
  const b = new Rng(42);
  for (let i = 0; i < 100; i++) assert.equal(a.next(), b.next());
});

test("catalogue : 20 modules et 55 Plugins", () => {
  assert.equal(Object.keys(MODULES).length, 20);
  assert.equal(Object.keys(PLUGINS).length, 55);
  assert.equal(COMPANY_IDS.length, 8);
});

test("une nouvelle partie a 24 contrats et 5 emplacements ouverts", () => {
  for (const company of COMPANY_IDS) {
    const s = newRun(1234, 1, false, company);
    assert.equal(s.contracts.length, TOTAL_CONTRACTS);
    assert.equal(s.board.length, 25);
    assert.equal(s.phase, "starter");
    assert.equal(s.starterChoices.length, 3);
    assert.ok(s.unlocked.filter(Boolean).length >= 5, company);
  }
});

test("même graine, même partie", () => {
  assert.deepEqual(newRun(99, 3, false, "labo"), newRun(99, 3, false, "labo"));
});

test("choisir un Plugin puis déployer produit un score", () => {
  let s = newRun(2024, 1, false, "startup");
  s = runReducer(s, { type: "CHOOSE_STARTER", jokerId: s.starterChoices[0] });
  assert.equal(s.phase, "build");
  assert.equal(s.jokers.length, 1);
  const preview = previewDeploy(s);
  assert.ok(preview && preview.score > 0);
  const after = runReducer(s, { type: "DEPLOY" });
  assert.equal(after.deploysUsed, 1);
  assert.equal(after.contractScore, preview.score);
});

test("une action impossible renvoie le même état ou une erreur", () => {
  const s = newRun(7, 1, false, "startup");
  assert.equal(runReducer(s, { type: "DEPLOY" }).phase, "starter");
});

test("sauvegarde : aller-retour sans perte", () => {
  let s = newRun(31337, 2, false, "banque");
  s = runReducer(s, { type: "CHOOSE_STARTER", jokerId: s.starterChoices[1] });
  const back = parseRun(serializeRun(s, 0));
  assert.deepEqual(back.board, s.board);
  assert.deepEqual(back.jokers, s.jokers);
  assert.equal(back.seed, s.seed);
});

test("sauvegarde : refuse les données corrompues", () => {
  assert.equal(parseRun("pas du json"), null);
  assert.equal(parseRun(JSON.stringify({ v: 999, state: {} })), null);
  assert.equal(parseRun(null), null);
});

test("profil : une victoire débloque le niveau suivant", () => {
  const profile = emptyProfile();
  const run = { ...newRun(1, 1, false, "startup"), phase: "victory" };
  run.stats = { ...run.stats, maxActivations: 10, fusions: 0, jokersSeen: [] };
  const { profile: next, newLevel } = recordRun(profile, run);
  assert.equal(next.companies.startup.won, 1);
  assert.equal(newLevel, 2);
  assert.deepEqual(parseProfile(JSON.stringify(next)), next);
});

test("pastille de montée de niveau : mêmes conditions que l'action UPGRADE", () => {
  const base = { ...newRun(7, 1, false, "startup"), phase: "build", goodies: [], freeUpgradeUsed: false };
  const mod = (o) => ({ uid: "m1", defId: "server", level: 1, ...o });
  assert.equal(upgradeAvailability({ ...base, data: 0 }, mod()), null);
  assert.equal(upgradeAvailability({ ...base, data: 99 }, mod()), "amelioration");
  assert.equal(upgradeAvailability({ ...base, data: 99 }, mod({ level: 2 })), "amelioration");
  assert.equal(upgradeAvailability({ ...base, data: 0 }, mod({ level: 3 })), "choix");
  assert.equal(upgradeAvailability({ ...base, data: 99 }, mod({ level: 3, branch: "A" })), null);
  assert.equal(upgradeAvailability({ ...base, phase: "reward", data: 99 }, mod()), null);
  assert.equal(upgradeAvailability({ ...base, data: 99 }, null), null);
});

// Fusion hybride : deux modules niveau 3 différents, effets combinés, deux familles.
function fusionTable() {
  const s = newRun(77, 1, false, "startup");
  const state = { ...s, phase: "build", data: 20, board: s.board.map(() => null), drawer: [null, null] };
  state.board[0] = { uid: "a", defId: "server", level: 3, branch: "A", edition: "opt" };
  state.board[1] = { uid: "b", defId: "saas", level: 3, branch: "B", edition: "free" };
  state.board[2] = { uid: "c", defId: "server", level: 3, branch: "B" };
  state.drawer[0] = { uid: "d", defId: "api", level: 3, branch: "A" };
  return state;
}

test("fusion hybride : nom, deux familles, spécialisations gardées, coût en Data", async () => {
  const { moduleView, countFamilies } = await import("../src/engine/moduleView.js");
  const { fusionCount } = await import("../src/engine/reducer.js");
  const { fusionCost, HYBRID_NAMES } = await import("../src/engine/hybrids.js");
  assert.equal(Object.keys(HYBRID_NAMES).length, 190);
  assert.equal(new Set(Object.values(HYBRID_NAMES)).size, 190);
  const state = fusionTable();
  assert.equal(fusionCount(state), 2);
  const next = runReducer(state, { type: "FUSE", slot: 1, partner: 0, edition: "partner" });
  const hybrid = next.board[1];
  assert.equal(next.board[0], null);
  assert.equal(next.data, 20 - fusionCost(state));
  assert.equal(fusionCost(state), 12);
  assert.equal(fusionCost(next), 18);
  assert.equal(hybrid.defId, "server");
  assert.equal(hybrid.partnerId, "saas");
  assert.equal(hybrid.branch, "A");
  assert.equal(hybrid.partnerBranch, "B");
  assert.equal(hybrid.edition, "opt");
  const view = moduleView(hybrid);
  assert.equal(view.name, "Cloud managé");
  assert.deepEqual(view.families, ["calcul", "business"]);
  assert.equal(countFamilies(next.board).business, 1);
  assert.equal(countFamilies(next.board).calcul, 2);
});

test("fusion hybride : les deux effets s'additionnent au déploiement", () => {
  const state = fusionTable();
  const fused = runReducer(state, { type: "FUSE", slot: 0, partner: 1, edition: "slot" });
  const result = previewDeploy({ ...fused, board: fused.board.map((m, i) => (i === 2 ? null : m)) });
  const first = result.events.find((e) => e.t === "activate" && e.slot === 0);
  assert.equal(first.out.compute, 30);
  assert.equal(first.out.budget, 2);
  assert.equal(first.out.scale, 0.75);
});

test("fusion : depuis le tiroir, deux modules identiques donnent la 2.0, pas de fusion sans Data", () => {
  const state = fusionTable();
  const withDrawer = runReducer(state, { type: "FUSE", slot: 2, partner: 100 });
  assert.equal(withDrawer.drawer[0], null);
  assert.equal(withDrawer.board[2].partnerId, "api");
  const twin = runReducer(state, { type: "FUSE", slot: 0, partner: 2 });
  assert.equal(twin.board[0].fused, true);
  assert.equal(twin.board[0].partnerId, undefined);
  const poor = runReducer({ ...state, data: 3 }, { type: "FUSE", slot: 0, partner: 1 });
  assert.equal(poor.board[0].defId, "server");
  assert.equal(poor.notice.tone, "error");
});

test("textes en lignes : tous les modules, niveaux, spécialisations, 2.0 et hybrides", async () => {
  const { effectLines, hereContext } = await import("../src/engine/effectLines.js");
  const { hybridPair } = await import("../src/engine/hybrids.js");
  const ids = Object.keys(MODULES);
  const state = fusionTable();
  const all = [];
  for (const a of ids) {
    for (const level of [1, 2, 3]) all.push({ defId: a, level });
    for (const branch of ["A", "B"]) all.push({ defId: a, level: 3, branch });
    all.push({ defId: a, level: 3, fused: true });
    for (const b of ids) {
      if (b === a) continue;
      const [defId, partnerId] = hybridPair(a, b);
      for (const x of ["A", "B"]) for (const y of ["A", "B"]) all.push({ defId, partnerId, level: 3, fused: true, branch: x, partnerBranch: y });
    }
  }
  for (const module of all) {
    const lines = effectLines(module);
    assert.ok(lines.length > 0);
    for (const l of lines) {
      const words = `${l.text} ${l.cond ?? ""}`;
      assert.ok(!/\brien\b|\blui\b|\d\.\d/.test(words), `${module.defId} : « ${words} »`);
      l.here?.(hereContext(state, 0));
    }
  }
});

test("hybride : la Base nourrit l'API, le SaaS paie le GPU", () => {
  const s = newRun(5, 1, false, "startup");
  const state = { ...s, phase: "build", data: 0, budget: 0, board: s.board.map(() => null) };
  state.board[0] = { uid: "a", defId: "api", partnerId: "database", level: 3, fused: true, branch: "A", partnerBranch: "A" };
  state.board[2] = { uid: "b", defId: "gpu", partnerId: "saas", level: 3, fused: true, branch: "A", partnerBranch: "A" };
  const result = previewDeploy(state);
  const apiBase = result.events.find((e) => e.t === "activate" && e.slot === 0);
  const gpuSaas = result.events.find((e) => e.t === "activate" && e.slot === 2);
  assert.equal(apiBase.out.compute, 26);
  assert.equal(apiBase.out.data, 6);
  assert.equal(gpuSaas.out.compute, 70);
  assert.equal(gpuSaas.out.budget, 3);
});
