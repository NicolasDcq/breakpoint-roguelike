// Service applicatif : les actions du joueur (cas d'usage).
// Chaque action passe par la partie (le domaine), puis la sauvegarde et prévient l'interface.

import { Run, RULES } from "../domain/index.js";
import { presentRun } from "./RunPresenter.js";

export class GameService {
  /**
   * @param {object} deps
   * @param {import("./ports/index.js").RunRepository} deps.repository
   * @param {import("./ports/index.js").SeedSource} deps.seeds
   */
  constructor({ repository, seeds }) {
    this.repository = repository;
    this.seeds = seeds;
    this.listeners = new Set();
    const saved = Run.fromSnapshot(repository.load());
    this.run = saved ?? Run.start(seeds.next());
    /** Le joueur a déjà lancé une partie : sinon l'accueil ne propose pas de reprendre. */
    this.started = Boolean(saved);
    this.view = presentRun(this.run, { started: this.started });
  }

  /** Crée une partie neuve, sauvegardée tout de suite (le joueur l'a lancée). */
  createRun(seed = this.seeds.next()) {
    const run = Run.start(seed);
    this.persist(run);
    return run;
  }

  persist(run = this.run) {
    this.repository.save(run.toSnapshot());
    this.started = true;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getView() {
    return this.view;
  }

  /** Ce que donnerait un déploiement maintenant (pour l'animation). */
  previewDeploy() {
    return this.run.preview();
  }

  // ---------- Cas d'usage ----------

  newRun(seed) {
    this.run = this.createRun(seed);
    this.publish();
  }

  /** La partie préparée du tutoriel (graine fixe, donc main et boutique rejouables). */
  startTutorial() { this.newRun(RULES.tutorialSeed); }

  placeCard(uid, cell) { return this.execute((run) => run.place(uid, cell)); }
  takeBack(cell) { return this.execute((run) => run.unplace(cell)); }
  moveCard(from, to) { return this.execute((run) => run.moveCard(from, to)); }
  discardCards(uids) { return this.execute((run) => run.discard(uids)); }
  deploy() { return this.execute((run) => run.deploy()); }
  openShop() { return this.execute((run) => run.openShop()); }
  buyOffer(index, replacePluginId = null) { return this.execute((run) => run.buy(index, replacePluginId)); }
  buyPack(slotIndex) { return this.execute((run) => run.buyPack(slotIndex)); }
  pickFromPack(choiceId, replacePluginId = null) { return this.execute((run) => run.pickFromPack(choiceId, replacePluginId)); }
  movePlugin(fromIndex, toIndex) { return this.execute((run) => run.movePlugin(fromIndex, toIndex)); }
  rerollShop() { return this.execute((run) => run.reroll()); }
  removeCard(uid) { return this.execute((run) => run.removeCard(uid)); }
  upgradeCard(uid) { return this.execute((run) => run.upgradeCard(uid)); }
  nextContract() { return this.execute((run) => run.goToNextContract()); }

  // ---------- Interne ----------

  execute(command) {
    const result = command(this.run);
    if (result.ok) {
      this.persist();
      this.publish();
    }
    return result;
  }

  publish() {
    this.view = presentRun(this.run, { started: this.started });
    this.listeners.forEach((listener) => listener(this.view));
  }
}
