// Reducer de la partie : toutes les actions du joueur.

import { buyArrival } from "./arrivals.js";
import { companyEffects, companyInterest, getCompany } from "./companies.js";
import { PAY_PER_UNUSED_DEPLOY, contractPay, findRule } from "./contracts.js";
import { activePlugins, executeDeploy } from "./deploy.js";
import { applyHole, expandDrawer, moveWithDrawer } from "./drawer.js";
import { EDITIONS } from "./editions.js";
import { FAMILY_LABELS, PACK_CHOICES, drawPackFamilies, familyLevel } from "./families.js";
import { BRANCHES, FUSED_MODULES } from "./fusedModules.js";
import { GOODIES, goodieIncome, goodiePrice, upgradeCost } from "./goodies.js";
import { fusionCost, hybridPair } from "./hybrids.js";
import { MODULES } from "./modules.js";
import { MAX_PATCH, findFusionPartner, moduleView, patchVersion } from "./moduleView.js";
import { PLUGINS, pluginSellPrice } from "./plugins.js";
import { Rng } from "./rng.js";
import {
  advanceContract,
  appendEndlessVersion,
  applyUpgrade,
  buyableSlots,
  currentContract,
  deploysLeft,
  enterReward,
  NO_ROOM_TEXT,
  placeNewModule,
  freeUpgradeAvailable,
  levelUp,
  markPluginSeen,
  newRun,
  nextRerollCost,
  nextUid,
  packPrice,
  pluginSlots,
  priceSurcharge,
  sellPriceOf,
  shopOptions,
  unlockCost,
  unlockError,
  upgradeCostFor,
  withError,
  withNotice,
} from "./run.js";
import { rollShop } from "./shop.js";

export function runReducer(state, action) {
  switch (action.type) {
    case "TUTO_SET":
      return action.state;
    case "TUTO_PATCH":
      return { ...state, ...action.patch };
    case "NEW_RUN":
      return newRun(
        action.seed,
        action.level ?? 1,
        action.endless ?? false,
        action.company ?? state.company ?? "startup",
      );
    case "CHOOSE_STARTER": {
      if (state.phase !== "starter" || !state.starterChoices.includes(action.jokerId)) {
        return state;
      }
      let o = { ...state, jokers: [...state.jokers], stats: { ...state.stats } };
      o.jokers.push({ uid: nextUid(o, "j"), defId: action.jokerId, counter: 0 });
      markPluginSeen(o, action.jokerId);
      o.phase = "build";
      o.starterChoices = [];
      return withNotice(o, `${PLUGINS[action.jokerId].name} rejoint l’équipe.`, "good");
    }
    case "BUY": {
      if (state.phase !== "build") {
        return state;
      }
      let o = currentContract(state);
      if (findRule(o, "shopClosed")) {
        return withError(state, "Boutique fermée pendant ce contrat.");
      }
      let a = state.shop[action.index];
      if (!a || a.sold) {
        return state;
      }
      if (state.budget < a.price) {
        return withError(state, `Pas assez de Budget (${a.price} $ requis).`);
      }
      let r = {
        ...state,
        board: [...state.board],
        jokers: [...state.jokers],
        shop: state.shop.map((n, l) => l === action.index ? { ...n, sold: true } : n),
        stats: { ...state.stats },
      };
      if (a.kind === "module") {
        let place = placeNewModule(r, {
          uid: nextUid(r, "m"),
          defId: a.defId,
          level: 1,
          ...a.edition ? { edition: a.edition } : {},
        });
        if (!place) {
          return withError(state, NO_ROOM_TEXT);
        }
        r.budget -= a.price;
        r.stats.modulesBought += 1;
        let name = `${MODULES[a.defId].name}${a.edition ? ` ${EDITIONS[a.edition].name}` : ""}`;
        return withNotice(
          r,
          place === "tiroir" ? `${name} rangé dans le tiroir (plateau plein).` : `${name} installé en ${place}.`,
          "good",
        );
      }
      return r.jokers.length >= pluginSlots(r)
        ? withError(state, `Maximum ${pluginSlots(r)} Plugins : vends-en un d’abord.`)
        : (r.jokers.push({ uid: nextUid(r, "j"), defId: a.defId, counter: 0 }),
          r.budget -= a.price,
          markPluginSeen(r, a.defId),
          withNotice(r, `${PLUGINS[a.defId].name} recruté !`, "good"));
    }
    case "BUY_GOODIE": {
      if (state.phase !== "build") {
        return state;
      }
      if (findRule(currentContract(state), "shopClosed")) {
        return withError(state, "Boutique fermée pendant ce contrat.");
      }
      let o = state.goodieOffer;
      if (!o) {
        return state;
      }
      let a = goodiePrice(o, priceSurcharge(state));
      if (state.budget < a) {
        return withError(state, `Pas assez de Budget (${a} $ requis).`);
      }
      let r = {
        ...state,
        goodies: [...state.goodies ?? [], o],
        goodieOffer: null,
        budget: state.budget - a,
      };
      if (o === "stickers") {
        r.rerollCost = 0;
      }
      if (o === "planche") {
        r.rerollCost = Math.min(r.rerollCost, 1);
      }
      return withNotice(r, `${GOODIES[o].name} collé sur ton laptop : ${GOODIES[o].text}`, "good");
    }
    case "BUY_PACK": {
      if (action.slot !== undefined) {
        return buyArrival(state, action.slot);
      }
      if (state.phase !== "build") {
        return state;
      }
      if (findRule(currentContract(state), "shopClosed")) {
        return withError(state, "Boutique fermée pendant ce contrat.");
      }
      if (state.packChoices?.length) {
        return state;
      }
      let pn = state.packAvailable === true
        ? 2
        : state.packAvailable === false ? 0 : state.packAvailable | 0;
      if (pn <= 0) {
        return withError(state, "Les paquets de cet arrivage sont déjà pris.");
      }
      let o = packPrice(state);
      return state.budget < o
        ? withError(state, `Pas assez de Budget (${o} $ requis).`)
        : {
          ...state,
          budget: state.budget - o,
          packAvailable: pn - 1,
          packChoices: drawPackFamilies(
            state.seed,
            state.contractIndex + 1e3 * (2 - pn),
            (state.jokers ?? []).some((j) => j.defId === "recruiter")
              ? PACK_CHOICES + 1
              : PACK_CHOICES,
          ),
        };
    }
    case "PICK_BOX": {
      if (state.phase !== "build" || !state.boxChoices?.includes(action.defId)) {
        return state;
      }
      if (state.jokers.length >= pluginSlots(state)) {
        return withError(state, `Maximum ${pluginSlots(state)} Plugins : vends-en un d’abord.`);
      }
      let r = { ...state, jokers: [...state.jokers], stats: { ...state.stats }, boxChoices: null };
      r.jokers.push({ uid: nextUid(r, "j"), defId: action.defId, counter: 0 });
      markPluginSeen(r, action.defId);
      return withNotice(r, `${PLUGINS[action.defId].name} sort du colis et rejoint l’équipe !`, "good");
    }
    case "SKIP_BOX":
      return state.phase !== "build" || !state.boxChoices?.length
        ? state
        : withNotice(
          {
            ...state,
            boxChoices: null,
            jokers: (state.jokers ?? []).map((j) => j.defId === "hotfix" ? { ...j, counter: (j.counter ?? 0) + 1 } : j),
          },
          "Colis refermé : aucun Plugin pris.",
        );
    case "PICK_PACK": {
      if (state.phase !== "build" || !state.packChoices?.includes(action.family)) {
        return state;
      }
      let o = { ...state.familyLevels ?? {} };
      let a = familyLevel(o, action.family) + 1;
      o[action.family] = a;
      return withNotice(
        {
          ...state,
          familyLevels: o,
          packChoices: null,
          budget: state.budget + ((state.jokers ?? []).some((j) => j.defId === "subs")
            ? 2 * familyLevel(o, "business")
            : 0),
        },
        `${FAMILY_LABELS[action.family]} passe niveau ${a}.`,
        "good",
      );
    }
    case "SKIP_PACK":
      return state.phase !== "build" || !state.packChoices?.length
        ? state
        : withNotice(
          {
            ...state,
            packChoices: null,
            jokers: (state.jokers ?? []).map((j) => j.defId === "hotfix" ? { ...j, counter: (j.counter ?? 0) + 1 } : j),
          },
          "Paquet refermé : aucune mise à jour prise.",
        );
    case "REROLL": {
      if (state.phase !== "build") {
        return state;
      }
      if (companyEffects(state.company).noReroll) {
        return withError(state, `${getCompany(state.company).name} : pas de relance en boutique.`);
      }
      if (findRule(currentContract(state), "shopClosed")) {
        return withError(state, "Boutique fermée pendant ce contrat.");
      }
      if (state.budget < state.rerollCost) {
        return withError(state, `Relance : ${state.rerollCost} $ requis.`);
      }
      let o = new Rng(state.rng);
      let a = rollShop(
        o,
        state.jokers.map((r) => r.defId),
        priceSurcharge(state),
        currentContract(state).version,
        shopOptions(state),
      );
      return {
        ...state,
        shop: a,
        rng: o.state,
        budget: state.budget - state.rerollCost,
        rerollCost: nextRerollCost(state, state.rerollCost),
      };
    }
    case "SELL_MODULE": {
      if (state.phase !== "build") {
        return state;
      }
      let o = state.board[action.slot];
      if (!o) {
        return state;
      }
      let a = {
        ...state,
        board: [...state.board],
        jokers: state.jokers.map((n) => PLUGINS[n.defId].countsSales ? { ...n, counter: n.counter + 1 } : n),
      };
      a.board[action.slot] = null;
      let r = sellPriceOf(o);
      a.budget += r;
      return withNotice(a, `${moduleView(o).name} vendu (+${r} $).`);
    }
    case "SELL_PLUGIN": {
      if (state.phase !== "build" && state.phase !== "reward") {
        return state;
      }
      let o = state.jokers.find((n) => n.uid === action.uid);
      if (!o) {
        return state;
      }
      let a = pluginSellPrice(o.defId);
      let r = {
        ...state,
        jokers: state.jokers.filter((n) => n.uid !== action.uid),
        budget: state.budget + a,
      };
      return withNotice(r, `${PLUGINS[o.defId].name} quitte l’équipe (+${a} $).`);
    }
    case "DRAWER_EXPAND":
      return expandDrawer(state);
    case "MOVE_MODULE": {
      if (state.phase !== "build") {
        return state;
      }
      let { from, to } = action;
      if (from >= 100 || to >= 100) {
        return moveWithDrawer(state, from, to);
      }
      if (from === to || !state.board[from] || !state.unlocked[to]) {
        return state;
      }
      let r = [...state.board];
      [r[from], r[to]] = [r[to], r[from]];
      return { ...state, board: r };
    }
    case "UPGRADE": {
      if (state.phase !== "build") {
        return state;
      }
      let o = state.board[action.slot];
      if (!o) {
        return state;
      }
      if (o.fused) {
        let n = o.patch ?? 0;
        if (n >= MAX_PATCH) {
          return withError(state, "Déjà en version finale.");
        }
        let l = upgradeCostFor(state, o);
        if (state.data < l) {
          return withError(state, `Pas assez de Data (${l} ◆ requis).`);
        }
        let d = { ...state, board: [...state.board], data: state.data - l };
        if (freeUpgradeAvailable(state)) {
          d.freeUpgradeUsed = true;
        }
        let u = { ...o, patch: n + 1 };
        d.board[action.slot] = u;
        return withNotice(d, `${FUSED_MODULES[o.defId].name} passe en version ${patchVersion(u)}.`, "good");
      }
      if (o.level === 3 && !o.branch) {
        if (!action.branch) {
          return withError(state, "Choisis une spécialisation.");
        }
        let n = { ...state, board: [...state.board] };
        n.board[action.slot] = { ...o, branch: action.branch };
        return withNotice(n, `${MODULES[o.defId].name} : ${BRANCHES[o.defId][action.branch].name}.`, "good");
      }
      let a = upgradeCostFor(state, o);
      if (a === null) {
        return withError(state, "Déjà au niveau maximum.");
      }
      if (o.level === 2 && !action.branch) {
        return withError(state, "Choisis une spécialisation pour le niveau 3.");
      }
      if (state.data < a) {
        return withError(state, `Pas assez de Data (${a} ◆ requis).`);
      }
      let r = { ...state, board: [...state.board], data: state.data - a };
      if (freeUpgradeAvailable(state)) {
        r.freeUpgradeUsed = true;
      }
      return withNotice(r, applyUpgrade(r, action.slot, action.branch), "good");
    }
    case "FUSE": {
      return fuseModules(state, action);
    }
    case "UNLOCK": {
      if (state.phase !== "build" || state.unlocked[action.slot]) {
        return state;
      }
      let o = unlockError(state, action.slot);
      if (o) {
        return withError(state, o);
      }
      let a = unlockCost(state);
      if (state.budget < a) {
        return withError(state, `Ouvrir un emplacement coûte ${a} $.`);
      }
      let r = [...state.unlocked];
      r[action.slot] = true;
      return withNotice(
        { ...state, unlocked: r, budget: state.budget - a },
        `Emplacement ${action.slot + 1} ouvert.`,
        "good",
      );
    }
    case "MOVE_PLUGIN": {
      let o = state.jokers.findIndex((n) => n.uid === action.uid);
      let a = o + action.dir;
      if (o < 0 || a < 0 || a >= state.jokers.length) {
        return state;
      }
      let r = [...state.jokers];
      [r[o], r[a]] = [r[a], r[o]];
      return { ...state, jokers: r };
    }
    case "DEPLOY":
      return deploy(state);
    case "CHOOSE_REWARD": {
      if (state.phase !== "reward") {
        return state;
      }
      let o = state.rewardChoices[action.index];
      if (!o) {
        return state;
      }
      let a = {
        ...state,
        board: [...state.board],
        jokers: [...state.jokers],
        unlocked: [...state.unlocked],
        stats: { ...state.stats },
      };
      let r = "";
      switch (o.kind) {
        case "recruit": {
          let n = o.defIds[action.pick ?? 0];
          if (!n) {
            return state;
          }
          if (a.jokers.length >= pluginSlots(a)) {
            return withError(state, `Maximum ${pluginSlots(a)} Plugins : vends-en un d’abord.`);
          }
          a.jokers.push({ uid: nextUid(a, "j"), defId: n, counter: 0 });
          markPluginSeen(a, n);
          r = `${PLUGINS[n].name} recruté !`;
          break;
        }
        case "joker":
          if (a.jokers.length >= pluginSlots(a)) {
            return withError(state, `Maximum ${pluginSlots(a)} Plugins : vends-en un d’abord.`);
          }
          a.jokers.push({ uid: nextUid(a, "j"), defId: o.defId, counter: 0 });
          markPluginSeen(a, o.defId);
          r = `${PLUGINS[o.defId].name} recruté !`;
          break;
        case "module": {
          let place = placeNewModule(a, { uid: nextUid(a, "m"), defId: o.defId, level: 1 });
          if (!place) {
            return withError(state, NO_ROOM_TEXT);
          }
          r = place === "tiroir"
            ? `${MODULES[o.defId].name} rangé dans le tiroir (plateau plein).`
            : `${MODULES[o.defId].name} installé.`;
          break;
        }
        case "patch": {
          let n = 0;
          a.board = a.board.map((l) => l && l.defId === o.defId && l.level < 3 && !l.fused ? (n++, levelUp(l)) : l);
          r = `Patch : ${n} × ${MODULES[o.defId].name} +1 niveau.`;
          if (a.board.some((l) => l && l.defId === o.defId && l.level === 3 && !l.fused && !l.branch)) {
            r += " Choisis la spécialisation des modules passés niveau 3.";
          }
          break;
        }
        case "budget":
          a.budget += o.amount;
          r = `+${o.amount} $`;
          break;
        case "data":
          a.data += o.amount;
          r = `+${o.amount} Data`;
          break;
        case "rack": {
          let n = buyableSlots(a.unlocked)[0] ?? -1;
          if (n >= 0) {
            a.unlocked[n] = true;
          }
          r = `Emplacement ${n + 1} ouvert.`;
          break;
        }
      }
      advanceContract(a);
      return withNotice(applyHole(a), r, "good");
    }
    case "SKIP_REWARD": {
      if (state.phase !== "reward") {
        return state;
      }
      let o = { ...state };
      advanceContract(o);
      return applyHole(o);
    }
    case "ABANDON":
      return state.phase !== "build"
        ? state
        : {
          ...state,
          phase: "defeat",
          history: [
            ...state.history,
            {
              contractId: currentContract(state).id,
              score: state.contractScore,
              deploysUsed: state.deploysUsed,
              success: false,
            },
          ],
        };
  }
}

export function canDeploy(state) {
  return state.phase !== "build"
    ? { ok: false, reason: "Pas maintenant." }
    : deploysLeft(state) <= 0
      ? { ok: false, reason: "Plus de déploiements." }
      : state.board.some(Boolean) ? { ok: true } : { ok: false, reason: "Le plateau est vide." };
}

export function contractMet(contract, score, data) {
  let rule = findRule(contract, "minDataProduced");
  return score >= contract.target && (!rule || data >= rule.amount);
}

export function deployInput(state) {
  let contract = currentContract(state);
  let deployCost = findRule(contract, "deployCost")?.amount ?? 0;
  let dataCost = Math.min(state.data, findRule(contract, "dataCost")?.amount ?? 0);
  return {
    board: state.board,
    unlocked: state.unlocked,
    jokers: state.jokers,
    data: state.data - dataCost,
    budget: state.budget - deployCost,
    contract,
    deployIndex: state.deploysUsed,
    maxChain: companyEffects(state.company).maxChain,
    familyLevels: state.familyLevels,
  };
}

export function deploy(state) {
  if (state.boxChoices?.length) {
    return state;
  }
  if (state.packChoices?.length) {
    return withError(state, "Choisis une mise à jour (ou passe) avant de déployer.");
  }
  let check = canDeploy(state);
  if (!check.ok) {
    return withError(state, check.reason);
  }
  let contract = currentContract(state);
  let result = executeDeploy(deployInput(state));
  let next = {
    ...state,
    board: result.boardAfter.map((n) => n && n.edition === "ml" ? { ...n, learn: (n.learn ?? 0) + 1 } : n),
    jokers: result.jokersAfter,
    data: result.dataAfter,
    budget: result.budgetAfter,
    contractScore: state.contractScore + result.score,
    contractData: state.contractData + result.dataProduced,
    deploysUsed: state.deploysUsed + 1,
    lastExecution: result,
    notice: null,
    stats: {
      ...state.stats,
      bestDeploy: Math.max(state.stats.bestDeploy, result.score),
      totalScore: state.stats.totalScore + result.score,
      deploys: state.stats.deploys + 1,
      maxActivations: Math.max(state.stats.maxActivations, result.activations),
    },
  };
  if (contractMet(contract, next.contractScore, next.contractData)) {
    let n = contract.deploys - next.deploysUsed;
    let l = Math.max(
      0,
      contractPay(next.contractIndex, next.level) + (companyEffects(next.company).payBonus ?? 0),
    );
    let d = n * PAY_PER_UNUSED_DEPLOY;
    let u = 0;
    for (let p of activePlugins(next.jokers, contract)) {
      u += p.def.contractInterest?.(next.budget + l + d, next.deploysUsed) ?? 0;
    }
    u += companyInterest(next.company, next.budget);
    let i = goodieIncome(next.goodies);
    next.budget += l + d + u + i;
    next.lastPayout = { base: l, unusedDeploys: d, interest: u, ...i ? { goodies: i } : {} };
    next.history = [
      ...next.history,
      {
        contractId: contract.id,
        score: next.contractScore,
        deploysUsed: next.deploysUsed,
        success: true,
      },
    ];
    let c = next.contractIndex >= next.contracts.length - 1;
    if (c && !next.endless) {
      next.phase = "victory";
    } else {
      if (c) {
        appendEndlessVersion(next);
      }
      enterReward(next, !!contract.major);
    }
  } else {
    if (next.deploysUsed >= contract.deploys) {
      next.phase = "defeat";
      next.history = [
        ...next.history,
        {
          contractId: contract.id,
          score: next.contractScore,
          deploysUsed: next.deploysUsed,
          success: false,
        },
      ];
    }
  }
  return next;
}

// Modules prêts à fusionner : niveau 3, pas déjà fusionnés, sur le plateau
// (numéro de case) ou dans le tiroir (100 + numéro du tiroir).
export function fusionCandidates(state) {
  let ready = (module) => !!module && module.level === 3 && !module.fused;
  let slots = [];
  state.board.forEach((module, slot) => {
    if (ready(module)) {
      slots.push(slot);
    }
  });
  (state.drawer ?? []).forEach((module, index) => {
    if (ready(module)) {
      slots.push(100 + index);
    }
  });
  return slots;
}

// Nombre de fusions qu'on peut faire d'affilée (pastille du bouton Fusion).
export const fusionCount = (state) => Math.floor(fusionCandidates(state).length / 2);

const moduleAt = (state, slot) => slot >= 100 ? (state.drawer ?? [])[slot - 100] ?? null : state.board[slot] ?? null;

// Résultat d'une fusion, sans l'appliquer : utilisé par l'atelier pour l'aperçu.
export function fusionResult(first, second, editionFrom = null) {
  let keepEdition = editionFrom === "partner"
    ? second
    : editionFrom === "slot"
      ? first
      : first.edition ? first : second;
  let edition = keepEdition.edition ? { edition: keepEdition.edition } : {};
  let learn = keepEdition.learn ? { learn: keepEdition.learn } : {};
  if (first.defId === second.defId) {
    return { defId: first.defId, level: 3, fused: true, ...edition, ...learn };
  }
  let [defId, partnerId] = hybridPair(first.defId, second.defId);
  let [main, partner] = defId === first.defId ? [first, second] : [second, first];
  return {
    defId,
    partnerId,
    level: 3,
    fused: true,
    ...main.branch ? { branch: main.branch } : {},
    ...partner.branch ? { partnerBranch: partner.branch } : {},
    ...edition,
    ...learn,
  };
}

function fuseModules(state, action) {
  if (state.phase !== "build") {
    return state;
  }
  let first = moduleAt(state, action.slot);
  if (!first) {
    return state;
  }
  let partnerSlot = action.partner ?? findFusionPartner(state.board, action.slot);
  let second = partnerSlot >= 0 ? moduleAt(state, partnerSlot) : null;
  let ready = (module) => !!module && module.level === 3 && !module.fused;
  if (partnerSlot === action.slot || !ready(first) || !ready(second)) {
    return withError(state, "Il faut deux modules niveau 3 pour fusionner.");
  }
  let cost = fusionCost(state);
  if (state.data < cost) {
    return withError(state, `Pas assez de Data (${cost} ◆ requis pour fusionner).`);
  }
  let next = {
    ...state,
    board: [...state.board],
    drawer: [...state.drawer ?? []],
    data: state.data - cost,
    stats: { ...state.stats },
  };
  let uid = nextUid(next, "f");
  let fused = { uid, ...fusionResult(first, second, action.edition) };
  let put = (slot, value) => {
    if (slot >= 100) {
      next.drawer[slot - 100] = value;
    } else {
      next.board[slot] = value;
    }
  };
  put(action.slot, fused);
  put(partnerSlot, null);
  next.fusedUid = uid;
  next.stats.fusions += 1;
  let freed = partnerSlot >= 100
    ? `La place ${partnerSlot - 99} du tiroir est libérée.`
    : `L’emplacement ${partnerSlot + 1} est libéré.`;
  return withNotice(
    next,
    `Fusion : ${MODULES[first.defId].name} + ${MODULES[second.defId].name} → ${moduleView(fused).name}. ${freed}`,
    "good",
  );
}

export function previewDeploy(state) {
  return state.phase !== "build" || !canDeploy(state).ok ? null : executeDeploy(deployInput(state));
}
