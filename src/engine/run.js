// État d'une partie : création, emplacements, prix, notices.

import { COMPANIES, applyCompanyToContracts, companyEffects, getCompany } from "./companies.js";
import { generateContracts, generateEndlessVersion } from "./contracts.js";
import { MAX_DIFFICULTY, pluginSlotsFor, shopSurcharge } from "./difficulty.js";
import { applyHole } from "./drawer.js";
import { PACK_PRICE } from "./families.js";
import { BRANCHES } from "./fusedModules.js";
import {
  editionChanceBonus,
  extraDeploys,
  extraPluginSlots,
  extraShopModules,
  goodieOfferFor,
  goodiePrice,
  hasCheapRerolls,
  hasFreeRerolls,
  hasFreeUpgrade,
  patchCost,
  upgradeCost,
} from "./goodies.js";
import { diagonals, emptyBoard, neighbors } from "./grid.js";
import { MODULES } from "./modules.js";
import { MAX_PATCH, moduleSellPrice } from "./moduleView.js";
import { PLUGINS } from "./plugins.js";
import { Rng } from "./rng.js";
import { BASE_REROLL_COST, drawStarterChoices, rollRewards, rollShop } from "./shop.js";

export const START_BUDGET = 6;

export const START_DATA = 2;

export const UNLOCK_BASE_COST = 3;

export const UNLOCK_COST_STEP = 1;

export const DEFAULT_OPEN_SLOTS = 5;

export const DEFAULT_UNLOCKED = Array.from({ length: 25 }, (e, t) => t < DEFAULT_OPEN_SLOTS);

export const START_SHAPES = [
  [7, 11, 12, 13, 17],
  [10, 11, 12, 13, 14],
  [6, 7, 11, 12, 16],
  [0, 6, 12, 18, 24],
  [6, 11, 16, 17, 18],
  [8, 13, 16, 17, 18],
  [6, 7, 8, 11, 16],
  [6, 7, 8, 13, 18],
];

export function buyableSlots(unlocked) {
  let slots = new Set();
  for (let i = 0; i < 25; i++) {
    if (unlocked[i]) {
      for (let n of [...neighbors(i), ...diagonals(i)]) {
        if (unlocked[n] === false) {
          slots.add(n);
        }
      }
    }
  }
  return [...slots].sort((a, b2) => a - b2);
}

export function rollStartShape(rng, count) {
  let shape = START_SHAPES[rng.int(START_SHAPES.length)];
  let unlocked = Array.from({ length: 25 }, () => false);
  for (let i of shape.slice(0, count)) {
    unlocked[i] = true;
  }
  let opened = Math.min(count, shape.length);
  for (; opened < count; opened++) {
    let b2 = buyableSlots(unlocked);
    if (!b2.length) {
      break;
    }
    unlocked[b2[0]] = true;
  }
  return unlocked;
}

export function firstBuyableSlot(state) {
  let buyable = buyableSlots(state.unlocked);
  return buyable.length ? buyable[0] : -1;
}

export const LEGACY_COLUMNS = 4;

export const LEGACY_SLOTS = 12;

export function unlockError(state, slot) {
  return buyableSlots(state.unlocked).includes(slot)
    ? null
    : "Un emplacement ne s’ouvre qu’à côté d’un emplacement ouvert.";
}

export function currentContract(state) {
  let contract = state.contracts[Math.min(state.contractIndex, state.contracts.length - 1)];
  let extra = extraDeploys(state.goodies) + (companyEffects(state.company).extraDeploys ?? 0);
  return extra ? { ...contract, deploys: contract.deploys + extra } : contract;
}

export function pluginSlots(state) {
  return pluginSlotsFor(state.level) + extraPluginSlots(state.goodies) + (companyEffects(state.company).jokerSlots ?? 0);
}

export function shopOptions(state) {
  let effects = companyEffects(state.company);
  return {
    extraModules: extraShopModules(state.goodies) + (effects.shopModules ?? 0),
    editionMultiplier: editionChanceBonus(state.goodies) * (effects.editionMult ?? 1),
    jokerDiscount: effects.jokerDiscount ?? 0,
  };
}

export function priceSurcharge(state) {
  return shopSurcharge(state.level) + (companyEffects(state.company).shopBonus ?? 0);
}

export function baseRerollCost(state) {
  return hasFreeRerolls(state.goodies) ? 0 : BASE_REROLL_COST;
}

export function nextRerollCost(state, current) {
  return hasCheapRerolls(state.goodies) ? 1 : current === 0 ? BASE_REROLL_COST : current + 1;
}

export function upgradeCostFor(state, module) {
  if (module.fused) {
    let patch = module.patch ?? 0;
    return patch >= MAX_PATCH
      ? null
      : freeUpgradeAvailable(state) ? 0 : patchCost(patch, state.goodies);
  }
  return module.level === 3
    ? null
    : freeUpgradeAvailable(state) ? 0 : upgradeCost(module.level, state.goodies);
}

export function freeUpgradeAvailable(state) {
  return hasFreeUpgrade(state.goodies) && !state.freeUpgradeUsed;
}

export function packPrice(state) {
  return PACK_PRICE + priceSurcharge(state);
}

export function goodieOfferPrice(state) {
  return state.goodieOffer ? goodiePrice(state.goodieOffer, priceSurcharge(state)) : null;
}

export function sellPriceOf(module) {
  return moduleSellPrice(module);
}

export function openSlotsFor(company) {
  return companyEffects(company).openSlots ?? DEFAULT_OPEN_SLOTS;
}

export function unlockCost(state) {
  let extra = state.unlocked.filter(Boolean).length - openSlotsFor(state.company);
  return (UNLOCK_BASE_COST + UNLOCK_COST_STEP * Math.max(0, extra)) * (companyEffects(state.company).unlockCostMult ?? 1);
}

export function deploysLeft(state) {
  return currentContract(state).deploys - state.deploysUsed;
}

export function placeStartModules(state) {
  let board = [...state.board];
  let free = [];
  for (let i = 0; i < 25; i++) {
    if (state.unlocked[i] && !board[i]) {
      free.push(i);
    }
  }
  for (let i = 0; i < 25; i++) {
    if (board[i] && !state.unlocked[i]) {
      let k = free.shift();
      if (k === undefined) {
        break;
      }
      board[k] = board[i];
      board[i] = null;
    }
  }
  return { ...state, board };
}

export function newRun(seed, level, endless, company) {
  return applyHole(placeStartModules(createRun(seed, level, endless, company)));
}

export function createRun(seed, level = 1, endless = false, company = "startup") {
  if (endless) {
    level = MAX_DIFFICULTY;
  }
  if (!(company in COMPANIES)) {
    company = "startup";
  }
  let rng = new Rng(seed);
  let board = emptyBoard();
  getCompany(company).start.forEach((i, c) => board[c] = { uid: `m${c + 1}`, defId: i, level: 1 });
  let starters = drawStarterChoices(rng);
  let shop = rollShop(rng, [], priceSurcharge({ level, company }), 1, shopOptions({ goodies: [], company }));
  let contracts = applyCompanyToContracts(generateContracts(rng, level), company);
  let unlocked = rollStartShape(rng, openSlotsFor(company));
  return {
    seed,
    level,
    rng: rng.state,
    phase: "starter",
    contractIndex: 0,
    board,
    unlocked,
    jokers: [],
    budget: START_BUDGET,
    data: START_DATA,
    contractScore: 0,
    contractData: 0,
    deploysUsed: 0,
    shop,
    rerollCost: BASE_REROLL_COST,
    starterChoices: starters,
    rewardChoices: [],
    lastPayout: null,
    lastExecution: null,
    history: [],
    stats: {
      bestDeploy: 0,
      totalScore: 0,
      deploys: 0,
      maxActivations: 0,
      modulesBought: 0,
      fusions: 0,
      jokersSeen: [],
    },
    contracts,
    nextUid: 10,
    fusedUid: null,
    endless,
    company,
    goodies: [],
    goodieOffer: goodieOfferFor(seed, 1, []),
    familyLevels: {},
    packAvailable: 2,
    arrTaken: [false, false],
    boxChoices: null,
    drawer: [null, null],
    holes: [],
    packChoices: null,
    notice: null,
  };
}

export function nextUid(state, prefix) {
  state.nextUid += 1;
  return `${prefix}${state.nextUid}`;
}

export function withNotice(state, text, tone = "info") {
  state.nextUid += 1;
  state.notice = { text, tone, id: state.nextUid };
  return state;
}

export function withError(state, text) {
  return withNotice({ ...state }, text, "error");
}

export function firstFreeSlot(state) {
  for (let t = 0; t < 25; t++) {
    if (state.unlocked[t] && !state.board[t]) {
      return t;
    }
  }
  return -1;
}

// Première case libre du tiroir, ou -1.
export function firstFreeDrawerSlot(state) {
  return (state.drawer ?? []).findIndex((m) => !m);
}

// Un nouveau module (achat, récompense) a-t-il une place : plateau d'abord, sinon tiroir ?
export function hasRoomForModule(state) {
  return firstFreeSlot(state) >= 0 || firstFreeDrawerSlot(state) >= 0;
}

// Pose un nouveau module sur le plateau, sinon dans le tiroir. Modifie state.board ou state.drawer
// (copiés au préalable par l'appelant). Renvoie « emplacement N », « tiroir » ou null si tout est plein.
export function placeNewModule(state, module) {
  let slot = firstFreeSlot(state);
  if (slot >= 0) {
    state.board[slot] = module;
    return `emplacement ${slot + 1}`;
  }
  let drawerSlot = firstFreeDrawerSlot(state);
  if (drawerSlot >= 0) {
    state.drawer = [...state.drawer];
    state.drawer[drawerSlot] = module;
    return "tiroir";
  }
  return null;
}

export const NO_ROOM_TEXT = "Plus de place : vends un module ou ouvre un emplacement.";

export function markPluginSeen(state, defId) {
  if (!state.stats.jokersSeen.includes(defId)) {
    state.stats.jokersSeen = [...state.stats.jokersSeen, defId];
  }
}

export function appendEndlessVersion(state) {
  let version = state.contracts[state.contracts.length - 1].version + 1;
  let rng = new Rng(state.rng);
  state.contracts = [
    ...state.contracts,
    ...applyCompanyToContracts(generateEndlessVersion(rng, state.level, version, state.contracts.length), state.company),
  ];
  state.rng = rng.state;
}

export function enterReward(state, major) {
  if (major) {
    let rng = new Rng(state.rng);
    state.rewardChoices = rollRewards(rng, state);
    state.rng = rng.state;
  } else {
    state.rewardChoices = [];
  }
  state.phase = "reward";
}

export function advanceContract(state) {
  state.contractIndex += 1;
  state.contractScore = 0;
  state.contractData = 0;
  state.deploysUsed = 0;
  state.rerollCost = baseRerollCost(state);
  state.freeUpgradeUsed = false;
  state.rewardChoices = [];
  state.lastPayout = null;
  let rng = new Rng(state.rng);
  let contract = state.contracts[state.contractIndex];
  if (contract?.step === "A") {
    state.jokers = state.jokers.map((a) => PLUGINS[a.defId].resetsPerVersion && a.counter ? { ...a, counter: 0 } : a);
    state.goodieOffer = goodieOfferFor(state.seed, contract.version, state.goodies ?? []);
  }
  state.shop = rollShop(
    rng,
    state.jokers.map((a) => a.defId),
    priceSurcharge(state),
    contract?.version ?? 1,
    shopOptions(state),
  );
  state.rng = rng.state;
  state.packAvailable = 2;
  state.arrTaken = [false, false];
  state.boxChoices = null;
  state.packChoices = null;
  state.phase = "build";
}

export function levelUp(module, branch) {
  let level = module.level + 1;
  return level === 3 && branch ? { ...module, level, branch } : { ...module, level };
}

export function applyUpgrade(state, slot, branch) {
  let before = state.board[slot];
  state.board[slot] = levelUp(before, branch);
  let chosen = state.board[slot].branch;
  let message = before.level + 1 === 3 && chosen
    ? `${MODULES[before.defId].name} passe niveau 3 : ${BRANCHES[before.defId][chosen].name}.`
    : `${MODULES[before.defId].name} passe niveau ${before.level + 1}.`;
  if (state.jokers.some((l) => PLUGINS[l.defId].refactor)) {
    let l = neighbors(slot).filter((d) => state.board[d] && state.board[d].level < 3).sort((d, u) => state.board[d].level - state.board[u].level || d - u);
    if (l.length) {
      let d = l[0];
      let u = state.board[d];
      state.board[d] = levelUp(u);
      message += ` 🧹 Refactor : ${MODULES[u.defId].name} aussi !${u.level + 1 === 3 ? " Choisis sa spécialisation." : ""}`;
    }
  }
  return message;
}
