// Non-régression : le bot rejoue les parties de référence à l'identique.
// Si ce test échoue après un changement de règles VOULU : node tests/support/update-golden.js

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GOLDEN_FILE, playGoldenRuns } from "./support/golden.js";

test("le bot rejoue les parties de référence à l'identique", () => {
  const expected = JSON.parse(readFileSync(GOLDEN_FILE, "utf8")).runs;
  assert.deepEqual(playGoldenRuns(), expected);
});
