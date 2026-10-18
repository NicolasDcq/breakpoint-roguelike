// Sérialisation et validation de la sauvegarde d'une partie.

import { COMPANIES } from "../engine/companies.js";
import { TOTAL_CONTRACTS } from "../engine/contracts.js";
import { MAX_DIFFICULTY } from "../engine/difficulty.js";
import { FAMILIES } from "../engine/families.js";
import { GOODIES, goodieOfferFor } from "../engine/goodies.js";
import { MODULES } from "../engine/modules.js";
import { PLUGINS } from "../engine/plugins.js";

export const SAVE_VERSION = 1;

export const isSavable = (e) => e.phase === "build" || e.phase === "reward" || e.phase === "victory";

export function serializeRun(state, savedAt = Date.now()) {
  let payload = { v: SAVE_VERSION, savedAt, state: { ...state, notice: null, fusedUid: null } };
  return JSON.stringify(payload);
}

export const isInt = (e) => typeof e == "number" && Number.isInteger(e);

export const isNum = (e) => typeof e == "number" && Number.isFinite(e);

export function parseRun(raw) {
  if (!raw) {
    return null;
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!data || data.v !== SAVE_VERSION || typeof data.state != "object" || data.state === null) {
    return null;
  }
  let state = data.state;
  try {
    if (!isSavable(state)
      || !isInt(state.seed)
      || !isInt(state.rng)
      || !isInt(state.level)
      || state.level < 1
      || state.level > MAX_DIFFICULTY
      || !Array.isArray(state.contracts)
      || state.contracts.length < TOTAL_CONTRACTS
      || state.contracts.length % 3 !== 0
      || !isInt(state.contractIndex)
      || state.contractIndex < 0
      || state.contractIndex >= state.contracts.length
      || !Array.isArray(state.board)
      || state.board.length !== 25
      || !Array.isArray(state.unlocked)
      || state.unlocked.length !== 25) {
      return null;
    }
    // Plateau et tiroir : modules connus ; un hybride a un second parent connu.
    let badModule = (m) => !m
      || !(m.defId in MODULES)
      || ![1, 2, 3].includes(m.level)
      || typeof m.uid != "string"
      || m.partnerId !== undefined && !(m.partnerId in MODULES);
    for (let a of [...state.board, ...Array.isArray(state.drawer) ? state.drawer : []]) {
      if (a !== null && badModule(a)) {
        return null;
      }
    }
    if (!Array.isArray(state.jokers)
      || state.jokers.some((a) => !a || !(a.defId in PLUGINS) || typeof a.uid != "string")
      || ![
        state.budget,
        state.data,
        state.contractScore,
        state.contractData,
        state.deploysUsed,
        state.rerollCost,
        state.nextUid,
      ].every(isNum)
      || !Array.isArray(state.shop)
      || !Array.isArray(state.history)
      || !Array.isArray(state.rewardChoices)
      || !state.stats
      || state.company !== undefined && !(state.company in COMPANIES)
      || state.goodies !== undefined && !Array.isArray(state.goodies)) {
      return null;
    }
    if (state.goodies) {
      state.goodies = state.goodies.filter((a) => a in GOODIES);
    }
    if (state.goodieOffer != null && !(state.goodieOffer in GOODIES)) {
      state.goodieOffer = goodieOfferFor(state.seed, state.contracts[state.contractIndex].version, state.goodies ?? []);
    }
    if (state.familyLevels !== undefined) {
      if (typeof state.familyLevels != "object" || state.familyLevels === null) {
        return null;
      }
      for (let a of Object.keys(state.familyLevels)) {
        let r = state.familyLevels[a];
        if (!FAMILIES.includes(a) || !isInt(r) || r < 1) {
          delete state.familyLevels[a];
        }
      }
    }
    if (state.packChoices != null
      && (!Array.isArray(state.packChoices) || state.packChoices.some((a) => !FAMILIES.includes(a)))) {
      state.packChoices = null;
    }
    for (let a of state.shop) {
      if (a.kind === "module" && !(a.defId in MODULES)
        || a.kind === "joker" && !(a.defId in PLUGINS)) {
        return null;
      }
    }
  } catch {
    return null;
  }
  if (state.goodies === undefined) {
    state.goodies = [];
    state.goodieOffer = goodieOfferFor(state.seed, state.contracts[state.contractIndex].version, []);
  }
  return state;
}
