// Lecture et écriture dans localStorage.

import { MAX_DIFFICULTY } from "../engine/difficulty.js";
import { legacyProfile, parseProfile } from "./profile.js";
import { isSavable, parseRun, serializeRun } from "./runSave.js";

export const KEY_MAX_LEVEL = "breakpoint.maxLevel";

export const KEY_RUN = "breakpoint.run";

export const KEY_ENDLESS = "breakpoint.endless";

export const KEY_ENDLESS_BEST = "breakpoint.endlessBest";

export const KEY_DEV_UNLOCK = "breakpoint.devUnlock";

export const DEV_LEVEL = MAX_DIFFICULTY + 1;

export function readNumber(e) {
  try {
    let t = Number(localStorage.getItem(e));
    return Number.isFinite(t) ? t : 0;
  } catch {
    return 0;
  }
}

export function writeValue(e, t) {
  try {
    localStorage.setItem(e, String(t));
  } catch { }
}

export function loadRun() {
  try {
    return parseRun(localStorage.getItem(KEY_RUN));
  } catch {
    return null;
  }
}

export function saveRun(e) {
  if (e && e.tuto) {
    return;
  }
  try {
    if (isSavable(e)) {
      localStorage.setItem(KEY_RUN, serializeRun(e));
    } else {
      localStorage.removeItem(KEY_RUN);
    }
  } catch { }
}

export function readLegacyMaxLevel() {
  try {
    let e = Number(localStorage.getItem(KEY_MAX_LEVEL));
    return Number.isFinite(e) && e >= 1 ? Math.min(e, MAX_DIFFICULTY) : 1;
  } catch {
    return 1;
  }
}

export const KEY_PROFILE = "breakpoint.profile";

export const KEY_RECORDED = "breakpoint.recorded";

export function loadProfile() {
  try {
    let e = parseProfile(localStorage.getItem(KEY_PROFILE));
    if (e) {
      return e;
    }
  } catch { }
  return legacyProfile(readLegacyMaxLevel(), readNumber(KEY_ENDLESS) === 1, readNumber(KEY_ENDLESS_BEST));
}

export function saveProfile(e) {
  try {
    localStorage.setItem(KEY_PROFILE, JSON.stringify(e));
  } catch { }
}

export function alreadyRecorded(e) {
  try {
    if (localStorage.getItem(KEY_RECORDED) === e) {
      return true;
    }
    localStorage.setItem(KEY_RECORDED, e);
  } catch { }
  return false;
}
