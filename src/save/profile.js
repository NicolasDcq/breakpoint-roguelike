// Profil du joueur : progression par entreprise, exploits, déblocages.

import { COMPANY_IDS } from "../engine/companies.js";
import { MAX_DIFFICULTY } from "../engine/difficulty.js";

export const emptyCompanyRecord = () => ({ maxLevel: 1, won: 0, endless: false, endlessBest: 0 });

export function emptyProfile() {
  return {
    v: 1,
    companies: Object.fromEntries(COMPANY_IDS.map((e) => [e, emptyCompanyRecord()])),
    stats: { maxActivations: 0, maxVersion: 0, bestWon: 0, jokersSeen: [], fusions: 0 },
  };
}

export function legacyProfile(e, t, o) {
  let a = emptyProfile();
  let r = Math.min(MAX_DIFFICULTY, Math.max(1, e || 1));
  let n = t ? MAX_DIFFICULTY : r - 1;
  a.companies.startup = { maxLevel: r, won: n, endless: t, endlessBest: o || 0 };
  a.stats.bestWon = n;
  return a;
}

export function parseProfile(raw) {
  if (!raw) {
    return null;
  }
  try {
    let data = JSON.parse(raw);
    if (!data || data.v !== 1 || typeof data.companies != "object" || typeof data.stats != "object") {
      return null;
    }
    let profile = emptyProfile();
    for (let r of COMPANY_IDS) {
      let n = data.companies[r];
      if (n) {
        profile.companies[r] = {
          maxLevel: clampInt(n.maxLevel, 1, MAX_DIFFICULTY),
          won: clampInt(n.won, 0, MAX_DIFFICULTY),
          endless: !!n.endless,
          endlessBest: Math.max(0, Number(n.endlessBest) || 0),
        };
      }
    }
    let stats = data.stats;
    profile.stats = {
      maxActivations: Math.max(0, Number(stats.maxActivations) || 0),
      maxVersion: Math.max(0, Number(stats.maxVersion) || 0),
      bestWon: clampInt(stats.bestWon, 0, MAX_DIFFICULTY),
      jokersSeen: Array.isArray(stats.jokersSeen)
        ? stats.jokersSeen.filter((r) => typeof r == "string")
        : [],
      fusions: Math.max(0, Number(stats.fusions) || 0),
    };
    return profile;
  } catch {
    return null;
  }
}

export function clampInt(e, t, o) {
  let a = Math.round(Number(e));
  return Number.isFinite(a) ? Math.min(o, Math.max(t, a)) : t;
}

export const UNLOCK_CONDITIONS = {
  agence: {
    text: "Atteins 100 activations en un déploiement",
    progress: (e) => [e.stats.maxActivations, 100],
  },
  scaleup: { text: "Atteins la version 6", progress: (e) => [e.stats.maxVersion, 6] },
  admin: { text: "Gagne en 3. Préprod", progress: (e) => [e.stats.bestWon, 3] },
  esn: { text: "Recrute 25 Plugins différents", progress: (e) => [e.stats.jokersSeen.length, 25] },
  cloud: { text: "Fusionne 5 modules", progress: (e) => [e.stats.fusions, 5] },
};

export function isCompanyUnlocked(e, t) {
  let o = UNLOCK_CONDITIONS[t];
  if (!o) {
    return true;
  }
  let [a, r] = o.progress(e);
  return a >= r;
}

export function unlockedCompanies(e) {
  return COMPANY_IDS.filter((t) => isCompanyUnlocked(e, t));
}

export function totalWins(e) {
  return COMPANY_IDS.reduce((t, o) => t + e.companies[o].won, 0);
}

export function recordRun(profile, run) {
  let company = run.company ?? "startup";
  let unlockedBefore = new Set(unlockedCompanies(profile));
  let next = {
    v: 1,
    companies: { ...profile.companies, [company]: { ...profile.companies[company] } },
    stats: { ...profile.stats, jokersSeen: [...profile.stats.jokersSeen] },
  };
  let record = next.companies[company];
  let version = run.contracts[Math.min(run.contractIndex, run.contracts.length - 1)].version;
  next.stats.maxActivations = Math.max(next.stats.maxActivations, run.stats.maxActivations);
  next.stats.maxVersion = Math.max(next.stats.maxVersion, version);
  next.stats.fusions += run.stats.fusions;
  for (let p of run.stats.jokersSeen) {
    if (!next.stats.jokersSeen.includes(p)) {
      next.stats.jokersSeen.push(p);
    }
  }
  let newLevel = null;
  let newEndless = false;
  let newRecord = false;
  if (run.endless) {
    if (version > record.endlessBest) {
      record.endlessBest = version;
      newRecord = true;
    }
  } else if (run.phase === "victory") {
    record.won = Math.max(record.won, run.level);
    next.stats.bestWon = Math.max(next.stats.bestWon, run.level);
    if (run.level < MAX_DIFFICULTY && run.level + 1 > record.maxLevel) {
      record.maxLevel = run.level + 1;
      newLevel = record.maxLevel;
    }
    if (run.level === MAX_DIFFICULTY && !record.endless) {
      record.endless = true;
      newEndless = true;
    }
  }
  let newCompanies = unlockedCompanies(next).filter((p) => !unlockedBefore.has(p));
  return { profile: next, newLevel, newEndless, newCompanies, newRecord };
}
