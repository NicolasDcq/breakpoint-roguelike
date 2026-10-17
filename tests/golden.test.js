// Non-régression du moteur : 96 parties jouées par le joueur automatique.
// Les empreintes de référence ont été produites avec le moteur de la v85 publiée
// (le bundle d'origine), avant la reconstruction en projet.
//
// Si ce test échoue après une modification VOULUE des règles, régénérer la
// référence : node tests/support/update-golden.js

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { runReducer } from "../src/engine/reducer.js";
import { newRun } from "../src/engine/run.js";
import { playRun } from "./support/player.js";

const golden = JSON.parse(readFileSync(new URL("./golden/v85.json", import.meta.url), "utf8"));
const sha = (s) => createHash("sha256").update(s).digest("hex").slice(0, 16);

export function chainOf(states) {
  let chain = "";
  for (const s of states) chain = sha(chain + s);
  return chain;
}

test(`le moteur rejoue les ${golden.runs.length} parties de référence à l'identique`, () => {
  const failures = [];
  for (const ref of golden.runs) {
    const { seed, level, company, endless, steps, rich } = ref;
    const run = playRun({ reduce: runReducer, newRun, seed, level, company, endless, steps, rich });
    const chain = chainOf(run.states);
    if (chain !== ref.chain || run.phase !== ref.phase || run.contractIndex !== ref.contractIndex) {
      failures.push(`graine ${seed} (${company}, niveau ${level}${rich ? ", riche" : ""}) : ${run.phase} au contrat ${run.contractIndex}, attendu ${ref.phase} au contrat ${ref.contractIndex}`);
    }
  }
  assert.deepEqual(failures, []);
});

test("la référence couvre victoires, défaites et mode infini", () => {
  const phases = new Set(golden.runs.map((r) => r.phase));
  assert.ok(phases.has("victory"));
  assert.ok(phases.has("defeat"));
  assert.ok(golden.runs.some((r) => r.endless && r.contractIndex > 24));
});
