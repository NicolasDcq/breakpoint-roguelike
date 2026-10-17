// Tests unitaires du moteur et des sauvegardes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { neighbors, diagonals, emptyBoard } from "../src/engine/grid.js";
import { Rng } from "../src/engine/rng.js";
import { newRun } from "../src/engine/run.js";
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
