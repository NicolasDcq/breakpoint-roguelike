// Tests des règles (domaine) et des cas d'usage (application).

import { test } from "node:test";
import assert from "node:assert/strict";
import { Rng } from "../src/domain/shared/Rng.js";
import { CELL_COUNT, GRID_SIZE, neighborCells } from "../src/domain/board/grid.js";
import { generateRun } from "../src/domain/generation/RunGenerator.js";
import { STARTERS } from "../src/domain/catalog/starters.js";
import { detectArchitecture, architectureBase } from "../src/domain/catalog/architectures.js";
import { scoreDeployment } from "../src/domain/scoring/ScoringEngine.js";
import { createCard } from "../src/domain/parc/Card.js";
import { Run, Phase, Refusal, RULES, familyOf, OfferKind, Board, PACKS, PLUGINS, MODULE_IDS, CardPlace } from "../src/domain/index.js";
import { GameService } from "../src/application/GameService.js";
import { presentRun } from "../src/application/RunPresenter.js";
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

test("chaque profil de départ a 20 modules, dont 7 Calcul au moins", () => {
  for (const starter of Object.values(STARTERS)) {
    assert.equal(starter.parc.length, RULES.startParcSize, starter.id);
    assert.ok(starter.parc.filter((id) => familyOf(id) === "calcul").length >= 7, starter.id);
  }
});

test("une partie est générée par sa graine : même graine, même partie", () => {
  assert.deepEqual(generateRun(new Rng(42)), generateRun(new Rng(42)));
  const recipes = [1, 2, 3, 4, 5, 6, 7, 8].map((seed) => generateRun(new Rng(seed)));
  assert.ok(new Set(recipes.map((recipe) => recipe.starterId)).size > 1, "les profils changent");
  assert.ok(new Set(recipes.map((recipe) => recipe.contracts[2].boss)).size > 1, "les boss changent");
});

test("une partie a 12 contrats et 4 boss différents sur les contrats C", () => {
  const { contracts } = generateRun(new Rng(7));
  assert.equal(contracts.length, 12);
  const bosses = contracts.filter((contract) => contract.letter === "C").map((contract) => contract.boss);
  assert.equal(new Set(bosses).size, 4);
  assert.ok(contracts.filter((contract) => contract.letter !== "C").every((contract) => !contract.boss));
});

test("les boss changent les limites : main réduite, pas de défausse, Plugins coupés", () => {
  const run = Run.start(3);
  run.contracts = run.contracts.map((contract, index) => (index === 0 ? { ...contract, boss: "smallHand" } : contract));
  run.startRound();
  assert.equal(run.round.hand.length, 5);
  run.contracts = run.contracts.map((contract, index) => (index === 0 ? { ...contract, boss: "noDiscard" } : contract));
  run.startRound();
  assert.equal(run.round.discardsLeft, 0);
  run.contracts = run.contracts.map((contract, index) => (index === 0 ? { ...contract, boss: "noPlugins" } : contract));
  run.pluginIds = ["intern"];
  assert.deepEqual(run.activePluginIds, []);
});

test("une nouvelle partie pioche 7 cartes sans remélange", () => {
  const run = Run.start(5);
  assert.equal(run.round.hand.length, RULES.handSize);
  assert.equal(run.round.drawPile.length, RULES.startParcSize - RULES.handSize);
  run.discard(run.round.hand.slice(0, 3));
  assert.equal(run.round.drawPile.length, RULES.startParcSize - RULES.handSize - 3);
  assert.equal(run.round.discardPile.length, 3);
});

test("on sait où est chaque carte du parc : pioche, main, plateau ou utilisée", () => {
  const run = Run.start(5);
  const [placed, discarded, kept] = run.round.hand;
  run.place(placed, 0);
  run.discard([discarded]);
  assert.equal(run.round.whereIs(placed), CardPlace.BOARD);
  assert.equal(run.round.whereIs(discarded), CardPlace.USED);
  assert.equal(run.round.whereIs(kept), CardPlace.HAND);
  assert.equal(run.round.whereIs(run.round.drawPile[0]), CardPlace.DRAW);
});

test("on ne pose pas plus de 5 modules", () => {
  const run = Run.start(5);
  const hand = [...run.round.hand];
  hand.slice(0, 5).forEach((uid, cell) => assert.ok(run.place(uid, cell).ok));
  assert.deepEqual(run.place(hand[5], 5), { ok: false, reason: Refusal.BOARD_FULL });
});

test("on déplace un module posé, et deux modules échangent leur place", () => {
  const run = Run.start(5);
  const [first, second] = run.round.hand;
  run.place(first, 0);
  run.place(second, 1);
  assert.ok(run.moveCard(0, 7).ok);
  assert.equal(run.round.board.at(7), first);
  assert.equal(run.round.board.at(0), null);
  assert.ok(run.moveCard(7, 1).ok);
  assert.equal(run.round.board.at(1), first);
  assert.equal(run.round.board.at(7), second);
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
  assert.equal(run.offers.length, RULES.shop.plugins);
  assert.deepEqual(run.packsLeft, { colis: PACKS.colis.perShop, booster: PACKS.booster.perShop });
});

test("un booster montre 3 plans d'architecture ; on en garde un, ou aucun", () => {
  const run = Run.start(5);
  run.phase = Phase.WON;
  run.openShop();
  run.money = PACKS.booster.price - 1;
  assert.equal(run.buyPack("booster").reason, Refusal.NOT_ENOUGH_MONEY);
  run.money = 100;
  assert.ok(run.buyPack("booster").ok);
  assert.equal(new Set(run.openPack.choices).size, PACKS.booster.choices);
  assert.equal(run.buy(0).reason, Refusal.PACK_PENDING, "on choisit avant de continuer ses achats");
  assert.equal(run.pickFromPack("inconnue").reason, Refusal.NOT_IN_PACK);
  const chosen = run.openPack.choices[0];
  assert.ok(run.pickFromPack(chosen).ok);
  assert.equal(run.architectureLevels[chosen], 2);
  assert.ok(run.buyPack("booster").ok);
  assert.ok(run.pickFromPack(null).ok, "on peut passer sans rien prendre");
  assert.equal(run.buyPack("booster").reason, Refusal.NO_PACK_LEFT);
  run.reroll();
  assert.equal(run.packsLeft.booster, 0, "la relance ne renouvelle pas l'arrivage");
});

test("un colis montre 3 modules ; celui qu'on garde rejoint le parc", () => {
  const run = Run.start(6);
  run.phase = Phase.WON;
  run.openShop();
  run.money = 100;
  assert.ok(run.buyPack("colis").ok);
  const chosen = run.openPack.choices[1];
  const before = run.parc.size;
  assert.ok(run.pickFromPack(chosen).ok);
  assert.equal(run.parc.size, before + 1);
  assert.equal(run.parc.cards.at(-1).moduleId, chosen);
});

test("tous les modules peuvent sortir d'un colis, et tous les Plugins en boutique", () => {
  const seenModules = new Set();
  const seenPlugins = new Set();
  for (let seed = 1; seed <= 60; seed++) {
    const run = Run.start(seed);
    run.phase = Phase.WON;
    run.openShop();
    run.money = 1000;
    run.offers.forEach((offer) => seenPlugins.add(offer.id));
    for (let roll = 0; roll < 3; roll++) { run.reroll(); run.offers.forEach((offer) => seenPlugins.add(offer.id)); }
    run.buyPack("colis");
    run.openPack.choices.forEach((id) => seenModules.add(id));
    run.pickFromPack(null);
  }
  assert.equal(seenModules.size, MODULE_IDS.length);
  assert.equal(seenPlugins.size, Object.keys(PLUGINS).length);
});

test("les Plugins rares sortent moins souvent que les communs", () => {
  const counts = { common: 0, rare: 0 };
  const rng = new Rng(9);
  for (let roll = 0; roll < 400; roll++) {
    rng.weightedSample(Object.keys(PLUGINS), (id) => RULES.rarityWeights[PLUGINS[id].rarity], 1).forEach((id) => {
      if (PLUGINS[id].rarity in counts) counts[PLUGINS[id].rarity]++;
    });
  }
  assert.ok(counts.common > counts.rare * 3, JSON.stringify(counts));
});

test("on ne voit que les contrats de la version en cours, puis la suivante après le boss", () => {
  const run = Run.start(4);
  assert.deepEqual([...new Set(run.visibleContracts.map((contract) => contract.version))], [1]);
  run.contractIndex = 2;
  run.phase = Phase.WON;
  assert.deepEqual([...new Set(run.visibleContracts.map((contract) => contract.version))], [1, 2]);
});

test("la boutique refuse un Plugin sans argent, puis un Plugin déjà acheté", () => {
  const run = Run.start(5);
  run.phase = Phase.SHOP;
  run.offers = [{ kind: OfferKind.PLUGIN, id: "intern", price: 4, sold: false }];
  run.money = 3;
  assert.equal(run.buy(0).reason, Refusal.NOT_ENOUGH_MONEY);
  run.money = 4;
  assert.ok(run.buy(0).ok);
  assert.deepEqual(run.pluginIds, ["intern"]);
  assert.equal(run.buy(0).reason, Refusal.ALREADY_SOLD);
});

test("on améliore un module en partie, en main ou posé, avec de la Data", () => {
  const run = Run.start(5);
  const [inHand, onBoard] = run.round.hand;
  run.place(onBoard, 0);
  assert.equal(run.upgradeCard(inHand).reason, Refusal.NOT_ENOUGH_DATA);
  run.data = 9;
  const before = run.preview().score;
  assert.ok(run.upgradeCard(onBoard).ok);
  assert.equal(run.card(onBoard).level, 2);
  assert.ok(run.preview().score >= before, "un module posé amélioré compte tout de suite");
  assert.ok(run.upgradeCard(inHand).ok);
  assert.equal(run.data, 3);
  assert.equal(run.upgradeCard(run.round.drawPile[0]).reason, Refusal.NOT_AT_HAND, "pas un module encore dans la pioche");
  run.phase = Phase.SHOP;
  assert.equal(run.upgradeCard(inHand).reason, Refusal.WRONG_PHASE, "plus en boutique");
});

test("Plugins pleins : on en revend un pour le remplacer, la revente aide à payer", () => {
  const run = Run.start(5);
  run.phase = Phase.SHOP;
  run.pluginIds = ["intern", "dba", "caffeine", "janitor"];
  run.offers = [{ kind: OfferKind.PLUGIN, id: "growth", price: 6, sold: false }];
  run.money = 4;
  assert.equal(run.buy(0).reason, Refusal.NO_PLUGIN_SLOT);
  assert.equal(run.buy(0, "sre").reason, Refusal.UNKNOWN_PLUGIN);
  assert.ok(run.buy(0, "dba").ok, "4 $ + 2 $ de revente = 6 $");
  assert.deepEqual(run.pluginIds, ["intern", "growth", "caffeine", "janitor"], "il prend la place de l'ancien");
  assert.equal(run.money, 0);
});

test("retirer un module garde 8 modules au moins", () => {
  const run = Run.start(5);
  run.phase = Phase.SHOP;
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

// ---------- Plugins de la vague 2 ----------

const at = (placements) => {
  const cells = Array(CELL_COUNT).fill(null);
  for (const [cell, id] of Object.entries(placements)) cells[cell] = cards(id)[0];
  return cells;
};
const gain = (cells, pluginIds, extra = {}) => {
  const without = score(cells, extra);
  const withPlugins = score(cells, { pluginIds, ...extra });
  return { without, with: withPlugins, fired: withPlugins.fired };
};

test("Plugins à condition de fin : Vétéran, Mentor, Scrum Master, Monétique, Clean Code", () => {
  const four = board("server", "server", "saas", "saas");
  let g = gain(four, ["veteran"], { contractsWon: 3 });
  assert.equal(g.with.compute - g.without.compute, 9, "Vétéran : +3 par contrat livré");
  g = gain(four, ["mentor", "intern", "growth"]);
  assert.equal(g.with.compute - score(four, { pluginIds: ["intern", "growth"] }).compute, 10, "Mentor : 2 communs");
  g = gain(four, ["scrum"]);
  assert.equal(Math.round((g.with.scale - g.without.scale) * 10) / 10, 0.5, "Scrum : 4 modules posés");
  assert.ok(!gain(board("server", "server", "saas"), ["scrum"]).fired.includes("scrum"));
  g = gain(four, ["monetique"]);
  assert.equal(g.with.compute - g.without.compute, 15, "Monétique : 2 Business");
  assert.ok(gain(four, ["cleancode"]).with.score > gain(four, ["cleancode"]).without.score);
  assert.ok(!gain(four, ["cleancode"], { discardsUsed: 1 }).fired.includes("cleancode"), "Clean Code : aucune défausse");
});

test("Monopole, Overclocker et Investisseuse multiplient le Scale", () => {
  const mono = board("server", "micro", "api");
  let g = gain(mono, ["monopoly"]);
  assert.equal(g.with.compute, g.without.compute * 3);
  assert.equal(g.with.scale, g.without.scale * 2);
  assert.ok(!gain(board("server", "micro", "cdn"), ["monopoly"]).fired.includes("monopoly"), "deux familles : rien");
  const full = board("server", "micro", "api", "gpu", "cdn");
  g = gain(full, ["overclock"], { maxPlaced: 5 });
  assert.equal(g.with.scale, g.without.scale * 2);
  assert.ok(gain(mono, ["overclock"], { maxPlaced: 3 }).fired.includes("overclock"), "boss à 3 modules : 3 suffisent");
  g = gain(mono, ["investor", "intern", "dba", "caffeine"]);
  assert.ok(g.fired.includes("investor"));
});

test("Plugins de position : IA Générative, Diagonale, Symétrique, Tandem", () => {
  const two = at({ 0: "server", 9: "server" });
  const genai = score(two, { pluginIds: ["genai"] });
  assert.equal(genai.events.find((e) => e.cell === 9).multiplier, 4, "le dernier posé ×4");
  assert.equal(genai.events.find((e) => e.cell === 0).multiplier, 1);
  const diag = score(at({ 0: "server", 1: "server", 6: "server" }), { pluginIds: ["diagonal"] });
  assert.equal(diag.events.find((e) => e.cell === 0).multiplier, 2);
  assert.equal(diag.events.find((e) => e.cell === 1).multiplier, 1);
  const sym = score(at({ 0: "server", 3: "server", 5: "server" }), { pluginIds: ["symmetric"] });
  assert.equal(sym.events.find((e) => e.cell === 0).multiplier, 2, "0 et 3 sont miroirs : ×2");
  assert.equal(sym.events.find((e) => e.cell === 3).multiplier, 2);
  assert.equal(sym.events.find((e) => e.cell === 5).multiplier, 1, "5 sans miroir en 6 : rien");
  const tandem = gain(at({ 0: "server", 2: "micro", 4: "server", 9: "cdn", 10: "saas" }), ["tandem"]);
  assert.equal(tandem.with.compute - tandem.without.compute, 10, "seule la 1re ligne a 2 Calcul");
});

test("La Pipeline : un module Ops réactive le module posé juste après", () => {
  const cells = at({ 0: "worker", 2: "server" });
  const plain = score(cells).events.filter((e) => e.cell === 2).length;
  const piped = score(cells, { pluginIds: ["pipeline"] });
  assert.equal(piped.events.filter((e) => e.cell === 2).length, plain + 1);
  assert.ok(piped.fired.includes("pipeline"));
});

test("Fin de contrat : Responsable Sécu +2 $, Capital-risqueur double la caisse (+8 $ au plus)", () => {
  assert.equal(PLUGINS.secuchief.contractInterest(0), 2);
  assert.equal(PLUGINS.vc.contractInterest(5), 5);
  assert.equal(PLUGINS.vc.contractInterest(30), 8);
});

test("l'écran d'accueil : une partie neuve est en cours, une partie perdue ou gagnée ne l'est plus", () => {
  const run = Run.start(11);
  assert.equal(presentRun(run).inProgress, true);
  run.phase = Phase.WON;
  assert.equal(presentRun(run).inProgress, true);
  run.phase = Phase.LOST;
  assert.equal(presentRun(run).inProgress, false);
  run.phase = Phase.VICTORY;
  assert.equal(presentRun(run).inProgress, false);
});

test("l'accueil ne propose de reprendre qu'une partie que le joueur a lancée", () => {
  const repository = new MemoryRunRepository();
  const first = new GameService({ repository, seeds: fixedSeedSource(5) });
  assert.equal(first.getView().inProgress, false, "visiteur neuf : rien à reprendre");
  first.newRun();
  assert.equal(first.getView().inProgress, true, "partie lancée : on peut la reprendre");
  const again = new GameService({ repository, seeds: fixedSeedSource(99) });
  assert.equal(again.getView().inProgress, true, "après rechargement, la partie est toujours là");
});
