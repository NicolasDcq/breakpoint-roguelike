// Vue résolue d'un module (niveau, spécialisation, fusion), coûts et ventes.

import { BRANCHES, FUSED_MODULES } from "./fusedModules.js";
import { hybridName, isHybrid, moduleFamilies } from "./hybrids.js";
import { MODULES } from "./modules.js";
import { fmtNum, round2 } from "./util.js";

export const PATCH_COSTS = [10, 20, 40];

export const MAX_PATCH = PATCH_COSTS.length;

export const PATCH_BONUS = 0.5;

export const patchVersion = (e) => `2.${e.patch ?? 0}`;

export function describePatch(module) {
  let patch = module.patch ?? 0;
  let bonusText = (r) => moduleView(module).kind === "producer"
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

// Effet d'un module niveau 3 (avec ou sans spécialisation), utilisé par les hybrides.
function partView(defId, branch) {
  let def = MODULES[defId];
  let spec = branch ? BRANCHES[defId][branch] : null;
  return spec
    ? { ...spec, kind: def.kind, branchName: spec.name }
    : {
      kind: def.kind,
      usesNeighbors: def.usesNeighbors,
      text: def.describe(3),
      preview: def.preview(3),
      produce: def.produce,
      run: def.run,
    };
}

function addOutputs(first, second) {
  if (!first || !second) {
    return first ?? second;
  }
  let sum = { ...first };
  for (let [key, value] of Object.entries(second)) {
    sum[key] = key === "scale" ? round2((sum[key] ?? 0) + value) : (sum[key] ?? 0) + value;
  }
  return sum;
}

// Vue d'un hybride : les deux effets s'additionnent, les deux familles comptent.
function hybridView(module) {
  let first = partView(module.defId, module.branch);
  let second = partView(module.partnerId, module.partnerBranch);
  let parts = [first, second];
  let producers = parts.filter((part) => part.kind === "producer");
  let runners = parts.filter((part) => part.run);
  let auras = parts.filter((part) => part.aura);
  let version = patchVersion(module);
  let name = hybridName(module.defId, module.partnerId);
  let families = moduleFamilies(module);
  return {
    name: version === "2.0" ? name : `${name} ${version}`,
    baseName: name,
    hybrid: true,
    parents: [
      { defId: module.defId, branch: module.branch, branchName: first.branchName },
      { defId: module.partnerId, branch: module.partnerBranch, branchName: second.branchName },
    ],
    flavor: `${MODULES[module.defId].name} et ${MODULES[module.partnerId].name} dans la même baie.`,
    family: families[0],
    families,
    kind: producers.length ? "producer" : "utility",
    accent: MODULES[module.defId].accent,
    usesNeighbors: parts.some((part) => part.usesNeighbors),
    text: `${first.text} ${second.text}`,
    preview: `${first.preview} · ${second.preview}`,
    produce: producers.length
      ? (ctx) => producers.reduce((total, part) => addOutputs(total, part.produce(ctx) ?? null), null)
      : undefined,
    run: runners.length ? (ctx) => runners.forEach((part) => part.run(ctx)) : undefined,
    shields: parts.some((part) => part.shields),
    aura: auras.length ? (ctx) => auras.reduce((mult, part) => mult * part.aura(ctx), 1) : undefined,
  };
}

export function moduleView(module) {
  let def = MODULES[module.defId];
  if (isHybrid(module)) {
    return hybridView(module);
  }
  if (module.fused) {
    let o = FUSED_MODULES[module.defId];
    let a = patchVersion(module);
    return {
      ...o,
      name: a === "2.0" ? o.name : `${o.name} ${a}`,
      baseName: o.name,
      family: def.family,
      families: [def.family],
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
      families: [def.family],
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
    families: [def.family],
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
      for (let family of moduleFamilies(o)) {
        counts[family]++;
      }
    }
  }
  return counts;
}

export const UPGRADE_COSTS = { 1: 3, 2: 6, 3: null };

export function moduleSellPrice(module) {
  let half = Math.floor(MODULES[module.defId].cost / 2);
  if (isHybrid(module)) {
    half += Math.floor(MODULES[module.partnerId].cost / 2);
    return half + 2 + (module.edition ? 1 : 0);
  }
  return (module.fused ? half * 2 + 2 : half) + (module.edition ? 1 : 0);
}
