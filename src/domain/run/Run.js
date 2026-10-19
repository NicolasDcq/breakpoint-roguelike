// La partie : racine de l'agrégat. Toute règle qui change l'état passe par ici,
// et chaque commande rend un résultat (réussi ou refusé avec une raison).

import { Rng } from "../shared/Rng.js";
import { ok, refuse, Refusal } from "../shared/Result.js";
import { RULES, upgradeCost } from "../catalog/rules.js";
import { CONTRACTS } from "../catalog/contracts.js";
import { BOSSES, bossLimits } from "../catalog/bosses.js";
import { PLUGINS } from "../catalog/plugins.js";
import { ARCHITECTURE_IDS } from "../catalog/architectures.js";
import { Parc } from "../parc/Parc.js";
import { Round } from "../round/Round.js";
import { scoreDeployment } from "../scoring/ScoringEngine.js";
import { OfferKind, drawBooster, removalPrice, rollOffers } from "../shop/Shop.js";
import { Phase } from "./Phase.js";

const SNAPSHOT_VERSION = 2;

export class Run {
  constructor(state) {
    Object.assign(this, state);
  }

  /** Nouvelle partie, entièrement déterminée par sa graine. */
  static start(seed) {
    const run = new Run({
      seed,
      rng: new Rng(seed),
      parc: Parc.fromModules(RULES.startParc),
      contractIndex: 0,
      money: RULES.startMoney,
      data: RULES.startData,
      pluginIds: [],
      architectureLevels: Object.fromEntries(ARCHITECTURE_IDS.map((id) => [id, 1])),
      architecturePlays: {},
      removePrice: RULES.removeStartPrice,
      rerollPrice: RULES.rerollStartPrice,
      offers: [],
      boostersLeft: 0,
      boosterChoices: null,
      lastPay: null,
      phase: Phase.PLAY,
      round: null,
    });
    run.startRound();
    return run;
  }

  // ---------- Lecture ----------

  get contract() {
    return CONTRACTS[this.contractIndex];
  }

  get nextContract() {
    return CONTRACTS[this.contractIndex + 1] ?? null;
  }

  get bossRule() {
    return BOSSES[this.contract.boss]?.rule ?? null;
  }

  get limits() {
    return bossLimits(this.contract.boss, { deploys: RULES.deploysPerContract, maxPlaced: RULES.maxPlaced });
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
      pluginIds: this.pluginIds,
      bossId: this.contract.boss ?? null,
      dataStock: this.data,
      money: this.money,
      architectureLevels: this.architectureLevels,
      parcSize: this.parc.size,
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
      discards: RULES.discardsPerContract,
      handSize: RULES.handSize,
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
    const result = this.round.discard(uids, RULES.handSize);
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
      this.round.drawUp(RULES.handSize);
      if (this.round.isStuck) this.phase = Phase.LOST;
    }
  }

  payContract() {
    const pay = RULES.contractPay[this.contract.letter];
    const left = this.round.deploysLeft;
    const interest = this.pluginIds.reduce((sum, id) => sum + (PLUGINS[id].contractInterest?.(this.money) ?? 0), 0);
    this.money += pay + left + interest;
    this.lastPay = { pay, left, interest };
  }

  // ---------- Boutique ----------

  openShop() {
    if (this.phase !== Phase.WON) return refuse(Refusal.WRONG_PHASE);
    this.phase = Phase.SHOP;
    this.rerollPrice = RULES.rerollStartPrice;
    this.offers = rollOffers(this.rng, this.pluginIds);
    this.boostersLeft = RULES.booster.perShop;
    this.boosterChoices = null;
    return ok();
  }

  /** Refus commun aux actions de boutique : mauvaise étape, ou booster ouvert pas encore choisi. */
  shopBlocked() {
    if (this.phase !== Phase.SHOP) return refuse(Refusal.WRONG_PHASE);
    if (this.boosterChoices) return refuse(Refusal.BOOSTER_PENDING);
    return null;
  }

  /** Achète et ouvre un booster : il montre des plans d'architecture, on en garde un. */
  openBooster() {
    const blocked = this.shopBlocked();
    if (blocked) return blocked;
    if (!this.boostersLeft) return refuse(Refusal.NO_BOOSTER_LEFT);
    if (this.money < RULES.booster.price) return refuse(Refusal.NOT_ENOUGH_MONEY);
    this.money -= RULES.booster.price;
    this.boostersLeft--;
    this.boosterChoices = drawBooster(this.rng);
    return ok(this.boosterChoices);
  }

  /** Garde un plan du booster (+1 niveau à cette architecture), ou aucun (null). */
  pickFromBooster(architectureId) {
    if (this.phase !== Phase.SHOP || !this.boosterChoices) return refuse(Refusal.WRONG_PHASE);
    if (architectureId !== null && !this.boosterChoices.includes(architectureId)) return refuse(Refusal.NOT_IN_BOOSTER);
    if (architectureId) this.architectureLevels = { ...this.architectureLevels, [architectureId]: this.architectureLevels[architectureId] + 1 };
    this.boosterChoices = null;
    return ok(architectureId);
  }

  buy(offerIndex) {
    const blocked = this.shopBlocked();
    if (blocked) return blocked;
    const offer = this.offers[offerIndex];
    if (!offer) return refuse(Refusal.UNKNOWN_OFFER);
    if (offer.sold) return refuse(Refusal.ALREADY_SOLD);
    if (this.money < offer.price) return refuse(Refusal.NOT_ENOUGH_MONEY);
    if (offer.kind === OfferKind.PLUGIN && this.pluginIds.length >= RULES.maxPlugins) return refuse(Refusal.NO_PLUGIN_SLOT);
    this.money -= offer.price;
    this.offers = this.offers.map((other, index) => (index === offerIndex ? { ...other, sold: true } : other));
    if (offer.kind === OfferKind.MODULE) this.parc.add(offer.id);
    if (offer.kind === OfferKind.PLUGIN) this.pluginIds = [...this.pluginIds, offer.id];
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

  upgradeCard(uid) {
    const blocked = this.shopBlocked();
    if (blocked) return blocked;
    const card = this.card(uid);
    if (!card) return refuse(Refusal.UNKNOWN_CARD);
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
    this.startRound();
    return ok();
  }

  // ---------- Sauvegarde ----------

  toSnapshot() {
    return {
      version: SNAPSHOT_VERSION,
      seed: this.seed, rngState: this.rng.state, parc: this.parc.toJSON(), contractIndex: this.contractIndex,
      money: this.money, data: this.data, pluginIds: this.pluginIds, architectureLevels: this.architectureLevels,
      architecturePlays: this.architecturePlays, removePrice: this.removePrice, rerollPrice: this.rerollPrice,
      offers: this.offers, boostersLeft: this.boostersLeft, boosterChoices: this.boosterChoices, lastPay: this.lastPay, phase: this.phase, round: this.round.toJSON(),
    };
  }

  /** Recrée une partie depuis une sauvegarde ; null si elle est illisible ou d'une autre version. */
  static fromSnapshot(snapshot) {
    if (!snapshot || snapshot.version !== SNAPSHOT_VERSION) return null;
    const { rngState, parc, round, version, ...rest } = snapshot;
    return new Run({ ...rest, rng: new Rng(rngState), parc: Parc.fromJSON(parc), round: Round.fromJSON(round) });
  }
}
