// Équilibrage : fait jouer le bot sur N parties.
//   node tools/bot/bot.js 80
import { GameService } from "../../src/application/GameService.js";
import { MemoryRunRepository } from "../../src/infrastructure/storage/MemoryRunRepository.js";
import { fixedSeedSource } from "../../src/infrastructure/random/RandomSeedSource.js";
import { playRun } from "./player.js";

const games = Number(process.argv[2]) || 60;
const stops = {};
const plays = {};
const byStarter = {};
let wins = 0;
for (let seed = 1; seed <= games; seed++) {
  const service = new GameService({ repository: new MemoryRunRepository(), seeds: fixedSeedSource(seed * 31337) });
  const result = playRun(service, seed);
  const key = result.phase === "victory" ? "victoire" : `contrat ${result.contractIndex + 1}`;
  stops[key] = (stops[key] ?? 0) + 1;
  if (result.phase === "victory") wins++;
  const starter = service.run.starterId;
  byStarter[starter] = byStarter[starter] ?? { parties: 0, victoires: 0 };
  byStarter[starter].parties++;
  if (result.phase === "victory") byStarter[starter].victoires++;
  for (const [id, count] of Object.entries(result.plays)) plays[id] = (plays[id] ?? 0) + count;
}
console.log(`Victoires : ${wins} / ${games} (${Math.round((wins / games) * 100)} %)`);
console.log("Fin de partie :", stops);
console.log("Architectures jouées :", plays);
console.log("Par profil de départ :", byStarter);
