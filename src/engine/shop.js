// Boutique, tirages de Plugins et récompenses de fin de version.

import { EDITIONS, EDITION_CHANCE, EDITION_IDS } from "./editions.js";
import { MODULES, MODULE_IDS } from "./modules.js";
import { EARLY_GAME_PLUGINS, PLUGINS, PLUGIN_IDS } from "./plugins.js";

export const SHOP_MODULE_COUNT = 3;

export const SHOP_PLUGIN_COUNT = 2;

export const LATE_VERSION = 5;

export const BASE_REROLL_COST = 2;

export const MODULE_WEIGHTS = {
  server: 9,
  micro: 8,
  api: 8,
  gpu: 4,
  lambda: 5,
  database: 9,
  analytics: 5,
  search: 5,
  backup: 5,
  cdn: 5,
  firewall: 4,
  balancer: 4,
  dns: 4,
  saas: 6,
  adserver: 4,
  marketplace: 4,
  cache: 6,
  worker: 5,
  queue: 5,
  monitoring: 4,
};

export const RARITY_WEIGHTS = { common: 60, uncommon: 32, rare: 10 };

export function drawPlugins(rng, count, owned, rareBoost = 1, version = 1) {
  let earlyFactor = version >= LATE_VERSION ? 0.3 : 1;
  let picked = [];
  for (let d = 0; d < count; d++) {
    let u = PLUGIN_IDS.filter((i) => !owned.includes(i) && !picked.includes(i));
    if (!u.length) {
      break;
    }
    picked.push(
      rng.weighted(u, (i) => {
        let c = PLUGINS[i].rarity;
        return RARITY_WEIGHTS[c] * (c === "common" ? 1 : rareBoost) * (EARLY_GAME_PLUGINS.includes(i) ? earlyFactor : 1);
      }),
    );
  }
  return picked;
}

export function rollShop(rng, owned, surcharge = 0, version = 1, options = {}) {
  let modules = [];
  let editionChance = Math.min(0.9, EDITION_CHANCE * (options.editionMultiplier ?? 1));
  for (let u = 0; u < Math.max(1, SHOP_MODULE_COUNT + (options.extraModules ?? 0)); u++) {
    let i = MODULE_IDS.filter((m) => !modules.some((y) => y.defId === m));
    let c = rng.weighted(i, (m) => MODULE_WEIGHTS[m]);
    let p = { kind: "module", defId: c, price: MODULES[c].cost + surcharge, sold: false };
    if (rng.next() < editionChance) {
      let m = EDITION_IDS.filter((v) => !EDITIONS[v].producerOnly || MODULES[c].kind === "producer");
      let y = rng.weighted(m, (v) => EDITIONS[v].weight);
      p.edition = y;
      p.price += EDITIONS[y].extraCost;
    }
    modules.push(p);
  }
  let plugins = drawPlugins(rng, SHOP_PLUGIN_COUNT, owned, 1, version).map((u) => ({
    kind: "joker",
    defId: u,
    price: Math.max(1, PLUGINS[u].cost + surcharge - (options.jokerDiscount ?? 0)),
    sold: false,
  }));
  return [...modules, ...plugins];
}

export function drawStarterChoices(rng) {
  let commons = PLUGIN_IDS.filter((o) => PLUGINS[o].rarity === "common");
  return rng.shuffle(commons).slice(0, 3);
}

export const REWARD_MODULES = MODULE_IDS.filter((e) => MODULES[e].cost >= 4);

export function rollRewards(rng, state) {
  let owned = state.jokers.map((c) => c.defId);
  let rewards = [];
  let recruits = drawPlugins(rng, 3, owned, 1.8, state.contracts[state.contractIndex]?.version ?? 1);
  if (recruits.length) {
    rewards.push({ kind: "recruit", defIds: recruits });
  }
  let hasFreeSlot = state.board.some((c, p) => !c && state.unlocked[p]);
  let hasClosedSlot = state.unlocked.some((c) => !c);
  let upgradable = [...new Set(state.board.filter((c) => c && c.level < 3).map((c) => c.defId))];
  let weights = [
    { kind: "module", w: hasFreeSlot ? 5 : 0 },
    { kind: "patch", w: upgradable.length ? 5 : 0 },
    { kind: "budget", w: 4 },
    { kind: "data", w: 4 },
    { kind: "rack", w: hasClosedSlot ? 3 : 0 },
  ];
  let version = state.contracts[state.contractIndex]?.version ?? 1;
  while (rewards.length < 3) {
    let c = weights.filter((m) => m.w > 0 && !rewards.some((y) => y.kind === m.kind));
    if (!c.length) {
      break;
    }
    let { kind } = rng.weighted(c, (m) => m.w);
    switch (kind) {
      case "module":
        rewards.push({ kind, defId: rng.pick(REWARD_MODULES) });
        break;
      case "patch":
        rewards.push({ kind, defId: rng.pick(upgradable) });
        break;
      case "budget":
        rewards.push({ kind, amount: 6 + version * 2 });
        break;
      case "data":
        rewards.push({ kind, amount: 5 + version });
        break;
      case "rack":
        rewards.push({ kind });
        break;
    }
  }
  return rewards;
}
