// Service applicatif : les actions du joueur (cas d'usage).
// Chaque action passe par la partie (le domaine), puis la sauvegarde et prévient l'interface.

import { Run } from "../domain/index.js";
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
    this.run = Run.fromSnapshot(repository.load()) ?? this.createRun();
    this.view = presentRun(this.run);
  }

  createRun(seed = this.seeds.next()) {
    const run = Run.start(seed);
    this.repository.save(run.toSnapshot());
    return run;
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

  placeCard(uid, cell) { return this.execute((run) => run.place(uid, cell)); }
  takeBack(cell) { return this.execute((run) => run.unplace(cell)); }
  discardCards(uids) { return this.execute((run) => run.discard(uids)); }
  deploy() { return this.execute((run) => run.deploy()); }
  openShop() { return this.execute((run) => run.openShop()); }
  buyOffer(index) { return this.execute((run) => run.buy(index)); }
  rerollShop() { return this.execute((run) => run.reroll()); }
  removeCard(uid) { return this.execute((run) => run.removeCard(uid)); }
  upgradeCard(uid) { return this.execute((run) => run.upgradeCard(uid)); }
  nextContract() { return this.execute((run) => run.goToNextContract()); }

  // ---------- Interne ----------

  execute(command) {
    const result = command(this.run);
    if (result.ok) {
      this.repository.save(this.run.toSnapshot());
      this.publish();
    }
    return result;
  }

  publish() {
    this.view = presentRun(this.run);
    this.listeners.forEach((listener) => listener(this.view));
  }
}
