// Vue résolue d'un module (niveau, spécialisation, fusion), coûts et ventes.

import { BRANCHES, FUSED_MODULES } from "./fusedModules.js";
import { MODULES } from "./modules.js";
import { fmtNum } from "./util.js";

export const PATCH_COSTS = [10, 20, 40];

export const MAX_PATCH = PATCH_COSTS.length;

export const PATCH_BONUS = 0.5;

export const patchVersion = (e) => `2.${e.patch ?? 0}`;

export function describePatch(module) {
  let patch = module.patch ?? 0;
  let bonusText = (r) => MODULES[module.defId].kind === "producer"
    ? `production ×${fmtNum(1 + PATCH_BONUS * r)}`
    : module.defId === "cache"
      ? `boost +${fmtNum(0.5 * r)}`
      : module.defId === "queue"
        ? `+${r} module${r > 1 ? "s" : ""} en file`
        : `+${r} réactivation${r > 1 ? "s" : ""}`;
  let current = patch ? `Version ${patchVersion(module)} : ${bonusText(patch)}.` : "Version 2.0.";
  return patch < MAX_PATCH
    ? `${current} En 2.${patch + 1} : ${bonusText(patch + 1)}.`
    : `${current} Version finale.`;
}

export function moduleView(module) {
  let def = MODULES[module.defId];
  if (module.fused) {
    let o = FUSED_MODULES[module.defId];
    let a = patchVersion(module);
    return {
      ...o,
      name: a === "2.0" ? o.name : `${o.name} ${a}`,
      family: def.family,
      kind: def.kind,
      accent: def.accent,
    };
  }
  if (module.level === 3 && module.branch) {
    let o = BRANCHES[module.defId][module.branch];
    return {
      name: def.name,
      flavor: def.flavor,
      family: def.family,
      kind: def.kind,
      accent: def.accent,
      usesNeighbors: o.usesNeighbors ?? false,
      text: o.text,
      preview: o.preview,
      produce: o.produce,
      run: o.run,
      branchName: o.name,
      shields: o.shields,
      aura: o.aura,
    };
  }
  return {
    name: def.name,
    flavor: def.flavor,
    family: def.family,
    kind: def.kind,
    accent: def.accent,
    usesNeighbors: def.usesNeighbors,
    text: def.describe(module.level),
    preview: def.preview(module.level),
    produce: def.produce,
    run: def.run,
  };
}

export function findFusionPartner(board, slot) {
  let module = board[slot];
  if (!module || module.fused || module.level < 3) {
    return -1;
  }
  for (let a = 0; a < board.length; a++) {
    let r = board[a];
    if (a !== slot && r && r.defId === module.defId && r.level === 3 && !r.fused) {
      return a;
    }
  }
  return -1;
}

export function countFamilies(board) {
  let counts = { calcul: 0, stockage: 0, reseau: 0, business: 0, ops: 0 };
  for (let o of board) {
    if (o) {
      counts[MODULES[o.defId].family]++;
    }
  }
  return counts;
}

export const UPGRADE_COSTS = { 1: 3, 2: 6, 3: null };

export function moduleSellPrice(module) {
  let half = Math.floor(MODULES[module.defId].cost / 2);
  return (module.fused ? half * 2 + 2 : half) + (module.edition ? 1 : 0);
}
