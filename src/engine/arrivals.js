// Arrivage de la boutique : colis de Plugins et paquets de mises à jour.

import { findRule } from "./contracts.js";
import { PACK_CHOICES, drawPackFamilies } from "./families.js";
import { Rng } from "./rng.js";
import { currentContract, packPrice, withError } from "./run.js";
import { drawPlugins } from "./shop.js";

export function arrivalKinds(state) {
  if (state.tuto) {
    return ["box", "update"];
  }
  let rng = new Rng((state.seed ^ Math.imul((state.contractIndex | 0) + 13, 2654435761)) >>> 0);
  rng.next();
  return [0, 1].map(() => rng.next() < 0.45 ? "box" : "update");
}

export function buyArrival(state, index) {
  if (state.phase !== "build") {
    return state;
  }
  if (findRule(currentContract(state), "shopClosed")) {
    return withError(state, "Boutique fermée pendant ce contrat.");
  }
  if (state.packChoices?.length || state.boxChoices?.length) {
    return state;
  }
  let taken = state.arrTaken ?? [false, false];
  if (taken[index]) {
    return withError(state, "Déjà pris dans cet arrivage.");
  }
  let kind = arrivalKinds(state)[index];
  let hasRecruiter = (state.jokers ?? []).some((j) => j.defId === "recruiter");
  let nextTaken = [...taken];
  nextTaken[index] = true;
  let packsLeft = state.packAvailable === true ? 2 : state.packAvailable === false ? 0 : state.packAvailable | 0;
  if (kind === "update") {
    let price = packPrice(state);
    if (state.budget < price) {
      return withError(state, `Pas assez de Budget (${price} $ requis).`);
    }
    return {
      ...state,
      budget: state.budget - price,
      arrTaken: nextTaken,
      packAvailable: Math.max(0, packsLeft - 1),
      packChoices: drawPackFamilies(
        state.seed,
        state.contractIndex + 1e3 * (index + 1),
        hasRecruiter ? PACK_CHOICES + 1 : PACK_CHOICES,
      ),
    };
  }
  let boxPrice = packPrice(state) + 1;
  if (state.budget < boxPrice) {
    return withError(state, `Pas assez de Budget (${boxPrice} $ requis).`);
  }
  let rng = new Rng(state.rng);
  let choices = drawPlugins(
    rng,
    hasRecruiter ? 4 : 3,
    state.jokers.map((j) => j.defId),
    1,
    currentContract(state).version,
  );
  return {
    ...state,
    budget: state.budget - boxPrice,
    arrTaken: nextTaken,
    packAvailable: Math.max(0, packsLeft - 1),
    boxChoices: choices,
    rng: rng.state,
  };
}
