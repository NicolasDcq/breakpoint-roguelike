// Régénère les parties de référence après un changement de règles VOULU.
//   node tests/support/update-golden.js
import { writeFileSync } from "node:fs";
import { GOLDEN_FILE, playGoldenRuns } from "./golden.js";

const runs = playGoldenRuns();
writeFileSync(GOLDEN_FILE, JSON.stringify({ runs }, null, 2) + "\n");
console.log(`${runs.length} parties de référence écrites.`);
