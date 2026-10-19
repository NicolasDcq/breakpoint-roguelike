// Tests des règles (domaine) et des cas d'usage (application).

import { test } from "node:test";
import assert from "node:assert/strict";
import { Rng } from "../src/domain/shared/Rng.js";
import { CELL_COUNT, GRID_SIZE, neighborCells } from "../src/domain/board/grid.js";
import { detectArchitecture, architectureBase } from "../src/domain/catalog/architectures.js";
import { scoreDeployment } from "../src/domain/scoring/ScoringEngine.js";
import { createCard } from "../src/domain/parc/Card.js";
import { Run, Phase, Refusal, RULES, familyOf, OfferKind, Board } from "../src/domain/index.js";
import { GameService } from "../src/application/GameService.js";
import { MemoryRunRepository } from "../src/infrastructure/storage/MemoryRunRepository.js";
import { fixedSeedSource } from "../src/infrastructure/random/RandomSeedSource.js";

let uid = 0;
const cards = (...ids) => ids.map((id) => createCard(`t${++uid}`, id));
const board = (...ids) => {
  const placed = cards(...ids);
  return [...placed, ...Array(CELL_COUNT - placed.length).fill(null)];
};
const score = (cells, extra = {}) => scoreDeployment({
  cards: cells, pluginIds: [], dataStock: 0, money: 0, parcSize: 20,
  architectureLevels: {}, ...extra,
});

test("le hasard à graine se rejoue à l'identique", () => {
  const a = new Rng(7), b = new Rng(7);
  assert.deepEqual([a.next(), a.next()], [b.next(), b.next()]);
  assert.deepEqual(new Rng(3).shuffle([1, 2, 3, 4]), new Rng(3).shuffle([1, 2, 3, 4]));
});

test("les voisins d'une case sont haut, bas, gauche, droite", () => {
  const sorted = (cells) => [...cells].sort((a, b) => a - b);
  assert.deepEqual(sorted(neighborCells(5)), [1, 4, 6, 9]);
  assert.deepEqual(sorted(neighborCells(0)), [1, 4]);
  assert.deepEqual(sorted(neighborCells(3)), [2, 7]);
  assert.deepEqual(sorted(neighborCells(4)), [0, 5, 8]);
});

test("chaque architecture est reconnue, de la plus forte à la plus faible", () => {
  const cases = [
    [["server", "server", "server", "server", "server"], "datacenter"],
    [["server", "server", "server", "server", "cdn"], "ferme"],
    [["server", "server", "server", "cdn", "cdn"], "hautedispo"],
    [["server", "micro", "api", "gpu", "lambda"], "stack"],
    [["server", "database", "cdn", "saas", "cache"], "fullstack"],
    [["server", "server", "server", "cdn"], "cluster"],
    [["server", "server", "cdn", "cdn"], "double"],
    [["server", "server", "cdn"], "redondance"],
    [["server", "cdn"], "monolithe"],
  ];
  for (const [ids, expected] of cases) assert.equal(detectArchitecture(cards(...ids), familyOf).id, expected, ids.join(","));
});

test("une mise à jour monte la base d'une architecture", () => {
  assert.deepEqual(architectureBase("redondance", 1), { compute: 10, scale: 2 });
  assert.deepEqual(architectureBase("redondance", 3), { compute: 40, scale: 4 });
});

test("l'architecture donne la base, puis le plateau l'améliore", () => {
  const result = score(board("server", "server"));
  assert.equal(result.architecture.id, "redondance");
  assert.equal(result.compute, 10 + 8 + 8);
  assert.equal(result.scale, 2);
  assert.equal(result.score, 52);
});

test("seuls les modules Calcul produisent du Compute", () => {
  const result = score(board("database", "cdn"));
  assert.equal(result.compute, 5, "uniquement la base du Monolithe");
  assert.equal(result.data, 2);
});

test("un plateau vide ne marque rien", () => {
  assert.equal(score(Array(CELL_COUNT).fill(null)).score, 0);
});

test("la panne du boss empêche la case 6 de s'activer", () => {
  const cells = Array(CELL_COUNT).fill(null);
  cells[5] = cards("server")[0];
  const result = score(cells, { bossId: "broken" });
  assert.equal(result.events[0].failure, "Panne");
  assert.equal(result.compute, 5);
});

test("le Cache booste le producteur suivant", () => {
  const result = score(board("cache", "server"));
  assert.equal(result.compute, 5 + 16);
});

test("un Plugin de fin agit après le plateau", () => {
  const result = score(board("server"), { pluginIds: ["intern"] });
  assert.equal(result.compute, 5 + 8 + 3);
  assert.deepEqual(result.fired, ["intern"]);
});

const service = (seed = 11) => new GameService({ repository: new MemoryRunRepository(), seeds: fixedSeedSource(seed) });

test("une nouvelle partie pioche 7 cartes sans remélange", () => {
  const run = Run.start(5);
  assert.equal(run.round.hand.length, RULES.handSize);
  assert.equal(run.round.drawPile.length, RULES.startParc.length - RULES.handSize);
  run.discard(run.round.hand.slice(0, 3));
  assert.equal(run.round.drawPile.length, RULES.startParc.length - RULES.handSize - 3);
  assert.equal(run.round.discardPile.length, 3);
});

test("on ne pose pas plus de 5 modules", () => {
  const run = Run.start(5);
  const hand = [...run.round.hand];
  hand.slice(0, 5).forEach((uid, cell) => assert.ok(run.place(uid, cell).ok));
  assert.deepEqual(run.place(hand[5], 5), { ok: false, reason: Refusal.BOARD_FULL });
});

test("un contrat livré paie et ouvre la boutique", () => {
  const run = Run.start(5);
  run.round.score = run.contract.target - 1;
  run.place(run.round.hand[0], 0);
  const result = run.deploy();
  assert.ok(result.ok);
  assert.equal(run.phase, Phase.WON);
  assert.equal(run.lastPay.pay, RULES.contractPay.A);
  assert.ok(run.openShop().ok);
  assert.equal(run.phase, Phase.SHOP);
  assert.equal(run.offers.length, 8);
});

test("la boutique vend les mises à jour d'architecture, et refuse sans argent", () => {
  const run = Run.start(5);
  run.phase = Phase.SHOP;
  run.offers = [{ kind: OfferKind.ARCHITECTURE, id: "cluster", price: 3, sold: false }];
  run.money = 2;
  assert.equal(run.buy(0).reason, Refusal.NOT_ENOUGH_MONEY);
  run.money = 3;
  assert.ok(run.buy(0).ok);
  assert.equal(run.architectureLevels.cluster, 2);
  assert.equal(run.buy(0).reason, Refusal.ALREADY_SOLD);
});

test("améliorer coûte de la Data, retirer garde 8 modules au moins", () => {
  const run = Run.start(5);
  run.phase = Phase.SHOP;
  const card = run.parc.cards[0];
  assert.equal(run.upgradeCard(card.uid).reason, Refusal.NOT_ENOUGH_DATA);
  run.data = 3;
  assert.ok(run.upgradeCard(card.uid).ok);
  assert.equal(run.card(card.uid).level, 2);
  run.money = 100;
  while (run.parc.size > RULES.minParcSize) assert.ok(run.removeCard(run.parc.cards[0].uid).ok);
  assert.equal(run.removeCard(run.parc.cards[0].uid).reason, Refusal.PARC_TOO_SMALL);
});

test("une partie sauvegardée se recharge à l'identique", () => {
  const run = Run.start(9);
  run.place(run.round.hand[0], 4);
  const copy = Run.fromSnapshot(JSON.parse(JSON.stringify(run.toSnapshot())));
  assert.deepEqual(copy.toSnapshot(), run.toSnapshot());
  assert.equal(copy.preview().score, run.preview().score);
  assert.equal(Run.fromSnapshot({ version: 0 }), null);
});

test("le service sauvegarde après chaque action réussie et prévient l'interface", () => {
  const game = service();
  let calls = 0;
  game.subscribe(() => calls++);
  const before = JSON.stringify(game.repository.load());
  assert.ok(game.placeCard(game.getView().hand[0].uid, 0).ok);
  assert.equal(calls, 1);
  assert.notEqual(JSON.stringify(game.repository.load()), before);
  assert.equal(game.deploy().ok, true);
  assert.equal(game.placeCard("inconnu", 0).ok, false);
  assert.equal(calls, 2, "une action refusée ne prévient pas");
});

test("le service reprend la partie sauvegardée", () => {
  const first = service(21);
  first.placeCard(first.getView().hand[0].uid, 2);
  const again = new GameService({ repository: first.repository, seeds: fixedSeedSource(99) });
  assert.equal(again.getView().seed, 21);
  assert.equal(again.getView().placedCount, 1);
});

test("le Serverless compte les cases vides autour de lui", () => {
  const cells = Array(CELL_COUNT).fill(null);
  cells[5] = cards("lambda")[0];
  cells[6] = cards("server")[0];
  const result = score(cells);
  assert.equal(result.compute, 5 + (5 + 3 * 3) + 8);
});

test("le DNS réactive la case juste en dessous (une rangée plus loin)", () => {
  const cells = Array(CELL_COUNT).fill(null);
  cells[0] = cards("dns")[0];
  cells[GRID_SIZE] = cards("server")[0];
  const result = score(cells);
  assert.equal(result.compute, 5 + 8 + 8);
});

test("le plateau est un objet valeur", () => {
  const empty = Board.empty();
  const one = empty.with(0, "x");
  assert.equal(empty.placedCount, 0);
  assert.equal(one.placedCount, 1);
});
