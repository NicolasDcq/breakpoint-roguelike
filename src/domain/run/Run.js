// La partie : racine de l'agrégat. Toute règle qui change l'état passe par ici,
// et chaque commande rend un résultat (réussi ou refusé avec une raison).

import { Rng } from "../shared/Rng.js";
import { ok, refuse, Refusal } from "../shared/Result.js";
import { RULES, upgradeCost } from "../catalog/rules.js";
import { BOSSES, bossLimits } from "../catalog/bosses.js";
import { PLUGINS, pluginSellPrice } from "../catalog/plugins.js";
import { ARCHITECTURE_IDS } from "../catalog/architectures.js";
import { Parc } from "../parc/Parc.js";
import { CardPlace, Round } from "../round/Round.js";
import { scoreDeployment } from "../scoring/ScoringEngine.js";
import { OfferKind, removalPrice, rollOffers, rollPackSlots } from "../shop/Shop.js";
import { PACKS, drawPack } from "../catalog/packs.js";
import { Phase } from "./Phase.js";
import { generateRun } from "../generation/RunGenerator.js";

const SNAPSHOT_VERSION = 5;

/**
 * Ce que rapporte une carte gardée, selon le genre de paquet.
 * Rend un refus si la carte ne peut pas être gardée (le paquet reste alors ouvert), sinon rien.
 */
const PACK_REWARDS = {
  module: (run, moduleId) => { run.parc.add(moduleId); },
  architecture: (run, architectureId) => {
    run.architectureLevels = { ...run.architectureLevels, [architectureId]: run.architectureLevels[architectureId] + 1 };
  },
  // Emplacements pleins : le Plugin gardé remplace un des siens (replacePluginId), qui est revendu.
  plugin: (run, pluginId, replacePluginId) => {
    if (run.pluginIds.length < RULES.maxPlugins) {
      run.pluginIds = [...run.pluginIds, pluginId];
      return null;
    }
    if (replacePluginId === null) return refuse(Refusal.NO_PLUGIN_SLOT);
    if (!run.pluginIds.includes(replacePluginId)) return refuse(Refusal.UNKNOWN_PLUGIN);
    run.money += pluginSellPrice(replacePluginId);
    run.pluginIds = run.pluginIds.map((id) => (id === replacePluginId ? pluginId : id));
    return null;
  },
};

export class Run {
  constructor(state) {
    Object.assign(this, state);
  }

  /** Nouvelle partie, entièrement déterminée par sa graine : la recette est tirée au hasard. */
  static start(seed) {
    const rng = new Rng(seed);
    const recipe = generateRun(rng);
    const run = new Run({
      seed,
      rng,
      starterId: recipe.starterId,
      contracts: recipe.contracts,
      parc: Parc.fromModules(recipe.startParc),
      contractIndex: 0,
      money: RULES.startMoney,
      data: RULES.startData,
      pluginIds: [],
      architectureLevels: Object.fromEntries(ARCHITECTURE_IDS.map((id) => [id, 1])),
      architecturePlays: {},
      removePrice: RULES.removeStartPrice,
      rerollPrice: RULES.rerollStartPrice,
      offers: [],
      packSlots: [],
      openPack: null,
      lastPay: null,
      phase: Phase.PLAY,
      round: null,
    });
    run.startRound();
    return run;
  }

  // ---------- Lecture ----------

  get contract() {
    return this.contracts[this.contractIndex];
  }

  get nextContract() {
    return this.contracts[this.contractIndex + 1] ?? null;
  }

  /**
   * Les contrats que le joueur peut voir : ceux de la version en cours seulement
   * (une fois un boss passé, on découvre la version suivante), comme dans Balatro.
   */
  get visibleContracts() {
    const upcoming = this.phase === Phase.WON || this.phase === Phase.SHOP ? this.nextContract ?? this.contract : this.contract;
    return this.contracts.filter((contract) => contract.version <= upcoming.version);
  }

  get bossRule() {
    return BOSSES[this.contract.boss]?.text ?? null;
  }

  get limits() {
    return bossLimits(this.contract.boss, {
      deploys: RULES.deploysPerContract,
      maxPlaced: RULES.maxPlaced,
      handSize: RULES.handSize,
      discards: RULES.discardsPerContract,
    });
  }

  /** Les Plugins qui agissent en ce moment (un boss peut les couper). */
  get activePluginIds() {
    return this.limits.pluginsActive ? this.pluginIds : [];
  }

  card(uid) {
    return this.parc.find(uid);
  }

  /** Les 16 cases avec leur carte (ou null). */
  cardsOn(board = this.round.board) {
    return board.cells.map((uid) => (uid ? this.card(uid) : null));
  }

  /** Le détail du déploiement si on déployait ce plateau maintenant. Ne change rien. */
  preview(board = this.round.board) {
    return scoreDeployment({
      cards: this.cardsOn(board),
      pluginIds: this.activePluginIds,
      bossId: this.contract.boss ?? null,
      dataStock: this.data,
      money: this.money,
      architectureLevels: this.architectureLevels,
      parcSize: this.parc.size,
      contractsWon: this.contractIndex,
      maxPlaced: this.limits.maxPlaced,
      discardsUsed: this.limits.discards - this.round.discardsLeft,
    });
  }

  get currentRemovePrice() {
    return removalPrice(this.pluginIds, this.removePrice);
  }

  // ---------- Contrat en cours ----------

  startRound() {
    this.round = Round.start({
      shuffledUids: this.rng.shuffle(this.parc.uids()),
      deploys: this.limits.deploys,
      discards: this.limits.discards,
      handSize: this.limits.handSize,
    });
    this.phase = Phase.PLAY;
  }

  place(uid, cell) {
    if (this.phase !== Phase.PLAY) return refuse(Refusal.WRONG_PHASE);
    return this.round.place(uid, cell, this.limits.maxPlaced);
  }

  moveCard(from, to) {
    if (this.phase !== Phase.PLAY) return refuse(Refusal.WRONG_PHASE);
    return this.round.move(from, to);
  }

  unplace(cell) {
    if (this.phase !== Phase.PLAY) return refuse(Refusal.WRONG_PHASE);
    return this.round.unplace(cell);
  }

  discard(uids) {
    if (this.phase !== Phase.PLAY) return refuse(Refusal.WRONG_PHASE);
    const result = this.round.discard(uids, this.limits.handSize);
    if (result.ok && this.round.isStuck) this.phase = Phase.LOST;
    return result;
  }

  deploy() {
    if (this.phase !== Phase.PLAY) return refuse(Refusal.WRONG_PHASE);
    if (this.round.board.isEmpty) return refuse(Refusal.NOTHING_PLACED);
    if (!this.round.deploysLeft) return refuse(Refusal.NO_DEPLOY_LEFT);
    const result = this.preview();
    const { id } = result.architecture;
    this.architecturePlays[id] = (this.architecturePlays[id] ?? 0) + 1;
    this.data = Math.max(0, this.data + result.data);
    this.money = Math.max(0, this.money + result.money);
    this.round.recordDeploy(result.score);
    this.settleAfterDeploy();
    return ok(result);
  }

  settleAfterDeploy() {
    if (this.round.score >= this.contract.target) {
      this.payContract();
      this.phase = this.nextContract ? Phase.WON : Phase.VICTORY;
    } else if (!this.round.deploysLeft) {
      this.phase = Phase.LOST;
    } else {
      this.round.drawUp(this.limits.handSize);
      if (this.round.isStuck) this.phase = Phase.LOST;
    }
  }

  payContract() {
    const pay = RULES.contractPay[this.contract.letter];
    const left = this.round.deploysLeft;
    const interest = this.activePluginIds.reduce((sum, id) => sum + (PLUGINS[id].contractInterest?.(this.money) ?? 0), 0);
    this.money += pay + left + interest;
    this.lastPay = { pay, left, interest };
  }

  // ---------- Boutique ----------

  openShop() {
    if (this.phase !== Phase.WON) return refuse(Refusal.WRONG_PHASE);
    this.phase = Phase.SHOP;
    this.rerollPrice = RULES.rerollStartPrice;
    this.offers = rollOffers(this.rng, this.pluginIds);
    this.packSlots = rollPackSlots(this.rng);
    this.openPack = null;
    return ok();
  }

  /** Refus commun aux actions de boutique : mauvaise étape, ou paquet ouvert pas encore choisi. */
  shopBlocked() {
    if (this.phase !== Phase.SHOP) return refuse(Refusal.WRONG_PHASE);
    if (this.openPack) return refuse(Refusal.PACK_PENDING);
    return null;
  }

  /** Achète et ouvre le paquet d'un emplacement de l'arrivage (colis, booster ou pack de Plugins). */
  buyPack(slotIndex) {
    const blocked = this.shopBlocked();
    if (blocked) return blocked;
    const slot = this.packSlots[slotIndex];
    if (!slot) return refuse(Refusal.UNKNOWN_PACK);
    if (slot.sold) return refuse(Refusal.NO_PACK_LEFT);
    const pack = PACKS[slot.packId];
    if (this.money < pack.price) return refuse(Refusal.NOT_ENOUGH_MONEY);
    this.money -= pack.price;
    this.packSlots = this.packSlots.map((other, index) => (index === slotIndex ? { ...other, sold: true } : other));
    this.openPack = { packId: slot.packId, choices: drawPack(this.rng, slot.packId, this.pluginIds) };
    return ok(this.openPack);
  }

  /**
   * Garde une carte du paquet ouvert, ou aucune (null).
   * Pack de Plugins avec les emplacements pleins : replacePluginId dit lequel est revendu.
   */
  pickFromPack(choiceId, replacePluginId = null) {
    if (this.phase !== Phase.SHOP || !this.openPack) return refuse(Refusal.WRONG_PHASE);
    if (choiceId !== null && !this.openPack.choices.includes(choiceId)) return refuse(Refusal.NOT_IN_PACK);
    if (choiceId !== null) {
      const refusal = PACK_REWARDS[PACKS[this.openPack.packId].reward](this, choiceId, replacePluginId);
      if (refusal) return refusal;
    }
    this.openPack = null;
    return ok(choiceId);
  }

  /**
   * Achète une offre. Si les emplacements de Plugin sont pleins, on peut en revendre un
   * (replacePluginId) : le nouveau prend sa place, et la revente aide à payer.
   */
  buy(offerIndex, replacePluginId = null) {
    const blocked = this.shopBlocked();
    if (blocked) return blocked;
    const offer = this.offers[offerIndex];
    if (!offer) return refuse(Refusal.UNKNOWN_OFFER);
    if (offer.sold) return refuse(Refusal.ALREADY_SOLD);
    const replacing = replacePluginId !== null;
    if (replacing && !this.pluginIds.includes(replacePluginId)) return refuse(Refusal.UNKNOWN_PLUGIN);
    const refund = replacing ? pluginSellPrice(replacePluginId) : 0;
    if (!replacing && this.pluginIds.length >= RULES.maxPlugins) return refuse(Refusal.NO_PLUGIN_SLOT);
    if (this.money + refund < offer.price) return refuse(Refusal.NOT_ENOUGH_MONEY);
    this.money += refund - offer.price;
    this.offers = this.offers.map((other, index) => (index === offerIndex ? { ...other, sold: true } : other));
    this.pluginIds = replacing
      ? this.pluginIds.map((id) => (id === replacePluginId ? offer.id : id))
      : [...this.pluginIds, offer.id];
    return ok(offer);
  }

  reroll() {
    const blocked = this.shopBlocked();
    if (blocked) return blocked;
    if (this.money < this.rerollPrice) return refuse(Refusal.NOT_ENOUGH_MONEY);
    this.money -= this.rerollPrice;
    this.rerollPrice++;
    this.offers = rollOffers(this.rng, this.pluginIds);
    return ok();
  }

  removeCard(uid) {
    const blocked = this.shopBlocked();
    if (blocked) return blocked;
    if (!this.card(uid)) return refuse(Refusal.UNKNOWN_CARD);
    if (this.parc.size <= RULES.minParcSize) return refuse(Refusal.PARC_TOO_SMALL);
    const price = this.currentRemovePrice;
    if (this.money < price) return refuse(Refusal.NOT_ENOUGH_MONEY);
    this.money -= price;
    if (price) this.removePrice++;
    this.parc.remove(uid);
    return ok();
  }

  /** Améliore un module en partie, quand il est en main ou posé : ça coûte de la Data. */
  upgradeCard(uid) {
    if (this.phase !== Phase.PLAY) return refuse(Refusal.WRONG_PHASE);
    const card = this.card(uid);
    if (!card) return refuse(Refusal.UNKNOWN_CARD);
    if (![CardPlace.HAND, CardPlace.BOARD].includes(this.round.whereIs(uid))) return refuse(Refusal.NOT_AT_HAND);
    const cost = upgradeCost(card.level);
    if (!cost) return refuse(Refusal.MAX_LEVEL);
    if (this.data < cost) return refuse(Refusal.NOT_ENOUGH_DATA);
    this.data -= cost;
    this.parc.raiseLevel(uid);
    return ok();
  }

  goToNextContract() {
    const blocked = this.shopBlocked();
    if (blocked) return blocked;
    this.contractIndex++;
    this.offers = [];
    this.packSlots = [];
    this.startRound();
    return ok();
  }

  // ---------- Sauvegarde ----------

  toSnapshot() {
    return {
      version: SNAPSHOT_VERSION,
      seed: this.seed, rngState: this.rng.state, starterId: this.starterId, contracts: this.contracts, parc: this.parc.toJSON(), contractIndex: this.contractIndex,
      money: this.money, data: this.data, pluginIds: this.pluginIds, architectureLevels: this.architectureLevels,
      architecturePlays: this.architecturePlays, removePrice: this.removePrice, rerollPrice: this.rerollPrice,
      offers: this.offers, packSlots: this.packSlots, openPack: this.openPack, lastPay: this.lastPay, phase: this.phase, round: this.round.toJSON(),
    };
  }

  /** Recrée une partie depuis une sauvegarde ; null si elle est illisible ou d'une autre version. */
  static fromSnapshot(snapshot) {
    if (!snapshot || snapshot.version !== SNAPSHOT_VERSION) return null;
    const { rngState, parc, round, version, ...rest } = snapshot;
    return new Run({ ...rest, rng: new Rng(rngState), parc: Parc.fromJSON(parc), round: Round.fromJSON(round) });
  }
}
