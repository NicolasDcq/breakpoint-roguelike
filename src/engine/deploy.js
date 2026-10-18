// Exécution d'un déploiement : activations, réactivations, Plugins, score.

import {
  DEFAULT_MAX_CHAIN,
  EMPTY_OUTPUT,
  MAX_RETRIGGER_DEPTH,
  RETRIGGER_BUDGET_CAP,
} from "./constants.js";
import { findRule } from "./contracts.js";
import { brokenSlots } from "./drawer.js";
import { betaCrashes, editionMultiplier } from "./editions.js";
import {
  FAMILY_LABELS,
  familyMultiplier,
  networkScaleBonus,
  opsRetriggerScale,
} from "./families.js";
import { diagonals, linkedNeighbors } from "./grid.js";
import { MODULES } from "./modules.js";
import { countFamilies, moduleView } from "./moduleView.js";
import { PLUGINS, effectiveFamilyLevel } from "./plugins.js";
import { round2 } from "./util.js";

export function disabledPlugins(jokers, contract) {
  let disabled = new Set();
  if (findRule(contract, "disableLeftPlugin") && jokers.length > 0) {
    disabled.add(jokers[0].uid);
  }
  jokers.forEach((a, r) => {
    if (!(disabled.has(a.uid) || !PLUGINS[a.defId].disablesNeighbors)) {
      if (jokers[r - 1]) {
        disabled.add(jokers[r - 1].uid);
      }
      if (jokers[r + 1]) {
        disabled.add(jokers[r + 1].uid);
      }
    }
  });
  return disabled;
}

export function activePlugins(jokers, contract) {
  let disabled = disabledPlugins(jokers, contract);
  let active = [];
  jokers.forEach((r, n) => {
    if (disabled.has(r.uid)) {
      return;
    }
    let l = PLUGINS[r.defId];
    if (l.copiesRight) {
      let d = jokers[n + 1];
      if (!d || disabled.has(d.uid) || PLUGINS[d.defId].copiesRight) {
        return;
      }
      l = PLUGINS[d.defId];
    }
    active.push({ joker: r, def: l });
  });
  return active;
}

export function executeDeploy(input) {
  let board = input.board;
  let maxChain = input.maxChain ?? DEFAULT_MAX_CHAIN;
  let plugins = activePlugins(input.jokers, input.contract);
  let broken = brokenSlots(input.contract);
  let bannedId = findRule(input.contract, "bannedModule")?.module ?? null;
  let noRetrigger = !!findRule(input.contract, "noRetrigger");
  let familyCounts = countFamilies(board);
  let emptyOpen = input.unlocked.filter((x, B) => x && !board[B]).length;
  let acc = {
    compute: 0,
    scale: 1,
    data: input.data,
    budget: input.budget,
    dataProduced: 0,
    boost: null,
    boostSlot: -1,
    queue: null,
    activations: 0,
    retriggers: 0,
    fizzles: 0,
    limitReached: false,
    firstProducerDone: false,
    retriggerBlockedLogged: false,
    budgetBy: new Map(),
    chainLogged: false,
    events: [],
  };
  let hasPlugin = (x) => plugins.some((B) => B.def.id === x);
  let noNeighbors = ((x) => plugins.some((B) => !!B.def[x]))("noNeighbors");
  let retryBonus = plugins.reduce((x, B) => x + (B.def.retryBonus ?? 0), 0);
  let cacheDuration = Math.max(1, ...plugins.map((x) => x.def.cacheDuration ?? 1));
  let neighborsOf = (x) => noNeighbors ? [] : linkedNeighbors(board, x);
  let diagonalsOf = (x) => noNeighbors ? [] : diagonals(x).filter((B) => board[B] !== null);
  let totals = () => ({ compute: acc.compute, scale: round2(acc.scale), data: acc.data, budget: acc.budget });
  let emit = (x) => acc.events.push({ ...x, totals: totals() });
  let applyPluginGain = (x, B, W = "") => {
    if (!B) {
      return;
    }
    let ae = [];
    if (B.scale) {
      acc.scale = round2(acc.scale + B.scale);
      ae.push(`+${round2(B.scale)} Scale`);
    }
    if (B.compute) {
      acc.compute += B.compute;
      ae.push(`+${B.compute} ⚡`);
    }
    if (ae.length) {
      emit({ t: "joker", jokerUid: x.joker.uid, jokerId: x.joker.defId, text: ae.join(", ") + W });
    }
  };
  let fizzle = (x, B, W) => {
    acc.fizzles++;
    emit({ t: "fizzle", slot: x, uid: B, reason: W });
    for (let ae of plugins) {
      applyPluginGain(ae, ae.def.onFizzle?.());
    }
  };
  let lastProducer = -1;
  for (let x = 0; x < 25; x++) {
    let B = board[x];
    if (B && MODULES[B.defId].kind === "producer" && !broken.has(x) && B.defId !== bannedId) {
      lastProducer = x;
    }
  }
  function retrigger(from, targets, times, depth, fromQueue = false) {
    if (noRetrigger) {
      if (!acc.retriggerBlockedLogged) {
        acc.retriggerBlockedLogged = true;
        emit({ t: "info", text: "Réactivation bloquée par les auditeurs." });
      }
      return;
    }
    emit({ t: "retrigger", from, to: targets, times });
    for (let target of targets) {
      for (let k = 0; k < times; k++) {
        activate(target, true, depth + 1, fromQueue);
      }
    }
  }
  function activate(slot, isRetrigger, depth, fromQueue = false) {
    let mod = board[slot];
    if (!mod || acc.limitReached) {
      return;
    }
    if (depth > maxChain) {
      if (!acc.chainLogged) {
        acc.chainLogged = true;
        emit({
          t: "info",
          text: `Chaîne de réactivations limitée à ${maxChain} niveaux : les réactivations plus profondes sont ignorées.`,
        });
      }
      return;
    }
    if (acc.activations >= 1e3 || depth > MAX_RETRIGGER_DEPTH) {
      acc.limitReached = true;
      emit({
        t: "limit",
        text: acc.activations >= 1e3
          ? `Limite de ${1e3} activations atteinte : la suite est ignorée.`
          : `Profondeur de réactivation maximale (${MAX_RETRIGGER_DEPTH}) atteinte.`,
      });
      return;
    }
    let shielded = neighborsOf(slot).some((E) => board[E] && moduleView(board[E]).shields);
    if (broken.has(slot) && !shielded) {
      return fizzle(slot, mod.uid, "Emplacement en panne");
    }
    if ((bannedId === mod.defId || bannedId === mod.partnerId) && !shielded) {
      return fizzle(slot, mod.uid, "Interdit par le client");
    }
    if (betaCrashes(mod, input.contract.id, input.deployIndex)) {
      return fizzle(slot, mod.uid, "Bêta : plantage");
    }
    let activationIndex = acc.activations;
    acc.activations++;
    if (isRetrigger) {
      acc.retriggers++;
    }
    let view = moduleView(mod);
    let patch = mod.fused ? mod.patch ?? 0 : 0;
    let consumed = 0;
    let failReason = "";
    let ctx = {
      slot,
      level: mod.level,
      module: mod,
      board,
      neighbors: () => neighborsOf(slot),
      diagonals: () => diagonalsOf(slot),
      dataStock: () => acc.data,
      budget: () => acc.budget,
      emptyOpenSlots: () => emptyOpen,
      activationCount: () => activationIndex,
      familyCount: (E) => familyCounts[E],
      consumeData: (E) => acc.data < E
        ? (failReason = "Pas assez de Data", false)
        : (acc.data -= E, consumed += E, true),
      consumeBudget: (E) => acc.budget < E ? (failReason = "Pas assez de Budget", false) : (acc.budget -= E, true),
      armBoost: (E, Z = 1) => {
        let ue = round2(E + (mod.fused ? 0.5 * patch : 0));
        let It = Math.max(cacheDuration, Z);
        acc.boost = acc.boost
          ? {
            mult: round2(acc.boost.mult + ue - 1),
            remaining: Math.max(acc.boost.remaining, It),
          }
          : { mult: ue, remaining: It };
        acc.boostSlot = slot;
        emit({ t: "boost", slot, mult: acc.boost.mult, remaining: acc.boost.remaining });
      },
      armQueue: (E, Z) => {
        let ue = E + (mod.fused ? patch : 0);
        acc.queue = acc.queue
          ? { remaining: acc.queue.remaining + ue, times: Math.max(acc.queue.times, Z) }
          : { remaining: ue, times: Z };
        emit({
          t: "info",
          text: `File de messages : ${acc.queue.remaining} producteur(s) seront réactivés.`,
        });
      },
      retrigger: (E, Z) => retrigger(slot, E, Z, depth),
      retryBonus: retryBonus + (mod.fused ? patch : 0),
      isRetrigger,
      retriggerCount: () => acc.retriggers,
      hasPlugin,
    };
    let pluginCtx = {
      board,
      levels: input.familyLevels,
      slot,
      module: mod,
      family: view.family,
      families: view.families,
      retrigger: isRetrigger,
      firstProducer: !acc.firstProducerDone,
      lastProducer: slot === lastProducer,
      neighborCount: neighborsOf(slot).length,
      retriggerCount: acc.retriggers,
      naturalNeighborCount: linkedNeighbors(board, slot).length,
      sameNeighbor: neighborsOf(slot).some((E) => board[E]?.defId === mod.defId),
      consumedData: 0,
    };
    // Un hybride producteur + soutien produit puis agit ; s'il ne produit rien,
    // il agit quand même comme un module de soutien.
    let produced = view.kind === "utility" ? null : view.produce?.(ctx) ?? null;
    if (view.kind === "utility" || (!produced && view.run)) {
      let E = mod.edition === "free" ? 1 : 0;
      acc.budget += E;
      emit({
        t: "activate",
        slot,
        uid: mod.uid,
        defId: mod.defId,
        fused: !!mod.fused,
        retrigger: isRetrigger,
        depth,
        out: { ...EMPTY_OUTPUT, budget: E },
        mult: 1,
        boosted: false,
        sources: E ? ["Freemium +1 $"] : [],
        jokerUids: [],
      });
      afterActivation({ ...pluginCtx, boosted: false, out: { ...EMPTY_OUTPUT } });
      view.run?.(ctx);
      return;
    }
    if (!produced) {
      return fizzle(slot, mod.uid, failReason || "Rien à produire");
    }
    let out = { ...EMPTY_OUTPUT, ...produced };
    pluginCtx.consumedData = consumed;
    let editionMult = editionMultiplier(mod);
    if (patch || editionMult !== 1) {
      let E = (1 + 0.5 * patch) * editionMult;
      out.compute = Math.round(out.compute * E);
      out.data = Math.round(out.data * E);
      out.budget = Math.round(out.budget * E);
      out.scale = round2(out.scale * E);
    }
    let sources = [];
    let pluginUids = [];
    for (let family of view.families) {
      let famLevel = effectiveFamilyLevel(input.familyLevels, family, hasPlugin("lts"));
      if (famLevel <= 1) {
        continue;
      }
      let E = familyMultiplier(famLevel);
      let Z = `${FAMILY_LABELS[family]} niv. ${famLevel} ×${E}`;
      if (family === "calcul" && out.compute) {
        out.compute = Math.round(out.compute * E);
        sources.push(Z);
      } else if (family === "stockage" && out.data) {
        out.data = Math.round(out.data * E);
        sources.push(Z);
      } else if (family === "business" && out.budget) {
        out.budget = Math.round(out.budget * E);
        sources.push(Z);
      }
    }
    for (let E of plugins) {
      let Z = E.def.flatCompute?.(pluginCtx) ?? 0;
      if (Z) {
        out.compute += Z;
        sources.push(`${E.def.emoji} +${Z} ⚡`);
        pluginUids.push(E.joker.uid);
      }
      let ue = E.def.flatData?.(pluginCtx) ?? 0;
      if (ue) {
        out.data += ue;
        sources.push(`${E.def.emoji} +${ue} ◆`);
        pluginUids.push(E.joker.uid);
      }
    }
    for (let E of plugins) {
      let Z = E.def.dataMult?.(pluginCtx) ?? 1;
      if (Z !== 1 && out.data) {
        out.data = Math.round(out.data * Z);
        sources.push(`${E.def.emoji} ×${Z} ◆`);
        pluginUids.push(E.joker.uid);
      }
    }
    let mult = 1;
    let boosted = false;
    for (let E of plugins) {
      let Z = E.def.multiplier?.(pluginCtx);
      if (Z && Z.mult !== 1) {
        mult *= Z.mult;
        if (Z.boost) {
          boosted = true;
        }
        sources.push(`${E.def.emoji} ×${Z.mult}`);
        pluginUids.push(E.joker.uid);
      }
    }
    for (let E of neighborsOf(slot)) {
      let Z = board[E] ? moduleView(board[E]) : null;
      let ue = Z?.aura?.({ defId: mod.defId, family: view.family, families: view.families }) ?? 1;
      if (ue !== 1) {
        mult *= ue;
        sources.push(`${Z.branchName ?? Z.name} ×${ue}`);
      }
    }
    if (acc.boost) {
      mult *= acc.boost.mult;
      boosted = true;
      sources.push(`Cache ×${acc.boost.mult}`);
      acc.boost.remaining--;
      if (acc.boost.remaining <= 0) {
        acc.boost = null;
      }
    }
    acc.firstProducerDone = true;
    let final = {
      compute: Math.round(out.compute * mult),
      data: Math.round(out.data * mult),
      budget: Math.round(out.budget * mult),
      scale: round2(out.scale * mult),
    };
    if (isRetrigger) {
      let E = acc.budgetBy.get(mod.uid) ?? 0;
      final.budget = Math.max(0, Math.min(final.budget, RETRIGGER_BUDGET_CAP[mod.level - 1] - E));
    }
    acc.budgetBy.set(mod.uid, (acc.budgetBy.get(mod.uid) ?? 0) + final.budget);
    if (isRetrigger) {
      let E = opsRetriggerScale(effectiveFamilyLevel(input.familyLevels, "ops", hasPlugin("lts")));
      if (E > 0) {
        final.scale = round2(final.scale + E);
        sources.push(
          `Ops niv. ${effectiveFamilyLevel(input.familyLevels, "ops", hasPlugin("lts"))} +${E} Scale`,
        );
      }
    }
    if (mod.edition === "free") {
      final.budget += 1;
    }
    acc.compute += final.compute;
    acc.data += final.data;
    acc.dataProduced += final.data;
    acc.budget += final.budget;
    acc.scale = round2(acc.scale + final.scale);
    emit({
      t: "activate",
      slot,
      uid: mod.uid,
      defId: mod.defId,
      fused: !!mod.fused,
      retrigger: isRetrigger,
      depth,
      out: final,
      mult: round2(mult),
      boosted,
      sources,
      jokerUids: pluginUids,
    });
    if (consumed > 0) {
      for (let E of plugins) {
        let Z = E.def.onDataConsumed?.(consumed);
        if (Z?.compute) {
          applyPluginGain(E, Z, ` (${consumed} Data consommée)`);
        }
      }
    }
    afterActivation({ ...pluginCtx, boosted, out: final });
    if (view.hybrid) {
      view.run?.(ctx);
    }
    if (!fromQueue && acc.queue && acc.queue.remaining > 0) {
      acc.queue.remaining--;
      let E = acc.queue.times;
      if (acc.queue.remaining <= 0) {
        acc.queue = null;
      }
      retrigger(slot, [slot], E, depth, true);
    }
  }
  function afterActivation(activation) {
    for (let p of plugins) {
      applyPluginGain(p, p.def.afterActivation?.(activation));
    }
  }
  let networkLevel = effectiveFamilyLevel(input.familyLevels, "reseau", hasPlugin("lts"));
  let networkBonus = networkScaleBonus(networkLevel, familyCounts.reseau);
  if (networkBonus > 0) {
    acc.scale = round2(acc.scale + networkBonus);
    emit({
      t: "info",
      text: `Réseau niv. ${networkLevel} : +${networkBonus} Scale (${familyCounts.reseau} module${familyCounts.reseau > 1 ? "s" : ""} Réseau).`,
    });
  }
  for (let x = 0; x < 25; x++) {
    if (board[x]) {
      activate(x, false, 0);
    }
  }
  if (acc.boost) {
    emit({
      t: "info",
      slot: acc.boostSlot,
      text: `Boost ×${acc.boost.mult} du Cache perdu : aucun module producteur ne s’active après lui.`,
    });
  }
  let distinctTypes = new Set(board.filter(Boolean).map((x) => x.defId));
  for (let x of plugins) {
    if (!x.def.atEnd) {
      continue;
    }
    let B = {
      board,
      familyLevels: input.familyLevels,
      compute: acc.compute,
      scale: acc.scale,
      budget: acc.budget,
      data: acc.data,
      jokerCount: input.jokers.length,
      emptyUnlocked: emptyOpen,
      distinctTypes: distinctTypes.size,
      moduleCount: board.filter(Boolean).length,
      familyCounts,
      familyKinds: Object.values(familyCounts).filter((D) => D > 0).length,
      deployIndex: input.deployIndex,
      deploysTotal: input.contract.deploys,
      hasConstraint: input.contract.rules.length > 0,
      fizzles: acc.fizzles,
      counter: x.joker.counter,
    };
    let W = x.def.atEnd(B);
    if (!W) {
      continue;
    }
    let ae = (D) => emit({ t: "joker", jokerUid: x.joker.uid, jokerId: x.joker.defId, text: D });
    if (W.addScale) {
      acc.scale = round2(acc.scale + W.addScale);
      ae(`+${round2(W.addScale)} Scale`);
    }
    if (W.mulScale && W.mulScale !== 1) {
      acc.scale = round2(acc.scale * W.mulScale);
      ae(`Scale ×${W.mulScale}`);
    }
    if (W.addBudget) {
      acc.budget += W.addBudget;
      ae(`+${W.addBudget} $`);
    }
    if (W.addCompute) {
      acc.compute += W.addCompute;
      ae(`+${W.addCompute} Compute`);
    }
  }
  let score = Math.floor(acc.compute * acc.scale);
  emit({ t: "end", score });
  let boardAfter = [...board];
  let activeUids = new Set(plugins.map((x) => x.joker.uid));
  let jokersAfter = input.jokers.map((x) => ({ ...x }));
  for (let x of jokersAfter) {
    let B = PLUGINS[x.defId];
    if (!activeUids.has(x.uid)) {
      continue;
    }
    if (B.countsDeploys) {
      x.counter += 1;
    }
    let W = B.debtLimit;
    if (W && (x.counter += 1, x.counter >= W)) {
      x.counter = 0;
      let ae = -1;
      for (let D = 15; D >= 0; D--) {
        if (boardAfter[D]) {
          ae = D;
          break;
        }
      }
      if (ae >= 0) {
        let D = boardAfter[ae];
        boardAfter[ae] = null;
        emit({
          t: "destroy",
          slot: ae,
          jokerUid: x.uid,
          text: `Dette technique ! ${moduleView(D).name} (emplacement ${ae + 1}) est détruit.`,
        });
      }
    }
  }
  return {
    events: acc.events,
    compute: acc.compute,
    scale: round2(acc.scale),
    score,
    activations: acc.activations,
    retriggers: acc.retriggers,
    limitReached: acc.limitReached,
    dataAfter: acc.data,
    dataProduced: acc.dataProduced,
    budgetAfter: acc.budget,
    boardAfter,
    jokersAfter,
  };
}
