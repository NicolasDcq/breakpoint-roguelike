// Parties de référence du bot : la même graine doit donner exactement la même partie.
import { createHash } from "node:crypto";
import { GameService } from "../../src/application/GameService.js";
import { MemoryRunRepository } from "../../src/infrastructure/storage/MemoryRunRepository.js";
import { fixedSeedSource } from "../../src/infrastructure/random/RandomSeedSource.js";
import { playRun } from "../../tools/bot/player.js";

export const GOLDEN_SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
export const GOLDEN_FILE = new URL("../golden/parc.json", import.meta.url);

const sha = (text) => createHash("sha256").update(text).digest("hex").slice(0, 16);

export function playGoldenRuns() {
  return GOLDEN_SEEDS.map((seed) => {
    const service = new GameService({ repository: new MemoryRunRepository(), seeds: fixedSeedSource(seed * 31337) });
    const { trace, phase, contractIndex } = playRun(service, seed);
    return { seed, phase, contractIndex, chain: sha(trace.join("|")) };
  });
}
