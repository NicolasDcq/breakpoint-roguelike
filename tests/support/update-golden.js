// Régénère tests/golden/v85.json avec le moteur actuel.
// À lancer seulement après un changement de règles voulu et vérifié.
//   node tests/support/update-golden.js
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { runReducer } from "../../src/engine/reducer.js";
import { newRun } from "../../src/engine/run.js";
import { playRun } from "./player.js";

const file = new URL("../golden/v85.json", import.meta.url);
const golden = JSON.parse(readFileSync(file, "utf8"));
const sha = (s) => createHash("sha256").update(s).digest("hex").slice(0, 16);
let changed = 0;
for (const ref of golden.runs) {
  const run = playRun({ reduce: runReducer, newRun, ...ref });
  let chain = "";
  for (const s of run.states) chain = sha(chain + s);
  if (chain !== ref.chain) changed++;
  Object.assign(ref, { actions: run.actions.length, phase: run.phase, contractIndex: run.contractIndex, chain });
}
golden.source = `Régénéré le ${new Date().toISOString().slice(0, 10)}`;
writeFileSync(file, JSON.stringify(golden, null, 1) + "\n");
console.log(`${changed} partie(s) sur ${golden.runs.length} ont changé.`);
