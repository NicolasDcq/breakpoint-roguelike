// Tests des règles (domaine) et des cas d'usage (application).

import { test } from "node:test";
import assert from "node:assert/strict";
import { Rng } from "../src/domain/shared/Rng.js";
import { CELL_COUNT, GRID_SIZE, neighborCells } from "../src/domain/board/grid.js";
import { generateRun } from "../src/domain/generation/RunGenerator.js";
import { mostPlayedArchitecture } from "../src/domain/run/commandEffects.js";
import { STARTERS } from "../src/domain/catalog/starters.js";
import { detectArchitecture, architectureBase } from "../src/domain/catalog/architectures.js";
import { scoreDeployment } from "../src/domain/scoring/ScoringEngine.js";
import { createCard } from "../src/domain/parc/Card.js";
import { Run, Phase, Refusal, RULES, familyOf, OfferKind, Board, PACKS, PACK_IDS, PLUGINS, pluginSellPrice, RARITIES, drawPlugins, drawPluginPack, MODULE_IDS, CardPlace, COMMANDS, COMMAND_IDS } from "../src/domain/index.js";
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
const round2 = (value) => Math.round(value * 100) / 100;
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
    [["server", "server", "server", "micro", "micro"], "cinqneufs"],
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
  assert.equal(result.compute, 5 + 8 + 10);
  assert.deepEqual(result.fired, ["intern"]);
});

const service = (seed = 11) => new GameService({ repository: new MemoryRunRepository(), seeds: fixedSeedSource(seed) });

test("le parc de départ est le parc standard : 37 modules, 13 Calcul, chaque module en 2 exemplaires (3 pour Serveur, Microservice et API)", () => {
  assert.deepEqual(Object.keys(STARTERS), ["standard"]);
  const { parc } = STARTERS.standard;
  assert.equal(parc.length, RULES.startParcSize);
  assert.equal(parc.filter((id) => familyOf(id) === "calcul").length, 13);
  const copies = (id) => parc.filter((other) => other === id).length;
  for (const id of new Set(parc)) assert.equal(copies(id), ["server", "micro", "api"].includes(id) ? 3 : 2, id);
  assert.equal(new Set(parc).size, 17, "les 17 modules sont là");
});

test("une partie est générée par sa graine : même graine, même partie", () => {
  assert.deepEqual(generateRun(new Rng(42)), generateRun(new Rng(42)));
  const recipes = [1, 2, 3, 4, 5, 6, 7, 8].map((seed) => generateRun(new Rng(seed)));
  assert.equal(new Set(recipes.map((recipe) => recipe.starterId)).size, 1, "le parc de départ est toujours le même");
  recipes.forEach((recipe) => assert.deepEqual(recipe.startParc, STARTERS.standard.parc));
  assert.ok(new Set(recipes.map((recipe) => recipe.contracts[2].boss)).size > 1, "les boss changent");
});

test("une partie a 24 contrats et 8 boss différents sur les contrats C", () => {
  const { contracts } = generateRun(new Rng(7));
  assert.equal(contracts.length, 24);
  const bosses = contracts.filter((contract) => contract.letter === "C").map((contract) => contract.boss);
  assert.equal(new Set(bosses).size, 8);
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
  assert.deepEqual(run.activePluginIds, [], "un seul Plugin : il est coupé");
});

test("boss Audit de sécurité : un Plugin est coupé, le suivant à chaque déploiement (de gauche à droite)", () => {
  const run = Run.start(3);
  run.contracts = run.contracts.map((contract, index) => (index === 0 ? { ...contract, boss: "noPlugins" } : contract));
  run.startRound();
  run.pluginIds = ["intern", "doublon", "failover"];
  assert.equal(run.cutPluginId, "intern");
  assert.deepEqual(run.activePluginIds, ["doublon", "failover"]);
  const placeAndDeploy = () => {
    const [uid] = run.round.hand;
    run.place(uid, 0);
    assert.ok(run.deploy().ok);
  };
  placeAndDeploy();
  assert.equal(run.cutPluginId, "doublon", "2e déploiement : le 2e Plugin");
  assert.deepEqual(run.activePluginIds, ["intern", "failover"]);
  placeAndDeploy();
  assert.equal(run.cutPluginId, "failover");
  // Hors boss : rien n'est coupé ; à la boutique non plus.
  run.contracts = run.contracts.map((contract) => ({ ...contract, boss: null }));
  assert.equal(run.cutPluginId, null);
  assert.deepEqual(run.activePluginIds, run.pluginIds);
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
  assert.equal(run.packSlots.length, RULES.shop.packSlots);
  run.packSlots.forEach((slot) => { assert.equal(slot.sold, false); assert.ok(PACK_IDS.includes(slot.packId)); });
});

/** Force l'arrivage pour tester un type de paquet précis. */
const forceSlots = (run, ...packIds) => { run.packSlots = packIds.map((packId) => ({ packId, sold: false })); };

test("un booster montre 3 plans d'architecture ; on en garde un, ou aucun", () => {
  const run = Run.start(5);
  run.phase = Phase.WON;
  run.openShop();
  forceSlots(run, "booster", "booster");
  run.money = PACKS.booster.price - 1;
  assert.equal(run.buyPack(0).reason, Refusal.NOT_ENOUGH_MONEY);
  run.money = 100;
  assert.ok(run.buyPack(0).ok);
  assert.equal(new Set(run.openPack.choices).size, PACKS.booster.choices);
  assert.equal(run.buy(0).reason, Refusal.PACK_PENDING, "on choisit avant de continuer ses achats");
  assert.equal(run.pickFromPack("inconnue").reason, Refusal.NOT_IN_PACK);
  const chosen = run.openPack.choices[0];
  assert.ok(run.pickFromPack(chosen).ok);
  assert.equal(run.architectureLevels[chosen], 2);
  assert.ok(run.buyPack(1).ok);
  assert.ok(run.pickFromPack(null).ok, "on peut passer sans rien prendre");
  assert.equal(run.buyPack(1).reason, Refusal.NO_PACK_LEFT);
  assert.equal(run.buyPack(2).reason, Refusal.UNKNOWN_PACK);
  const slots = JSON.stringify(run.packSlots);
  run.reroll();
  assert.equal(JSON.stringify(run.packSlots), slots, "la relance ne renouvelle pas l'arrivage");
});

test("un colis montre 3 modules ; celui qu'on garde rejoint le parc", () => {
  const run = Run.start(6);
  run.phase = Phase.WON;
  run.openShop();
  forceSlots(run, "colis", "colis");
  run.money = 100;
  assert.ok(run.buyPack(0).ok);
  const chosen = run.openPack.choices[1];
  const before = run.parc.size;
  assert.ok(run.pickFromPack(chosen).ok);
  assert.equal(run.parc.size, before + 1);
  assert.equal(run.parc.cards.at(-1).moduleId, chosen);
});

test("tous les modules peuvent sortir d'un colis, et tous les Plugins en boutique", () => {
  const seenModules = new Set();
  const seenPlugins = new Set();
  for (let seed = 1; seed <= 300; seed++) {
    const run = Run.start(seed);
    run.phase = Phase.WON;
    run.openShop();
    run.money = 1000;
    const note = (offer) => { if (offer.kind === OfferKind.PLUGIN) seenPlugins.add(offer.id); };
    run.offers.forEach(note);
    for (let roll = 0; roll < 5; roll++) { run.reroll(); run.offers.forEach(note); }
    forceSlots(run, "colis", "colis");
    run.buyPack(0);
    run.openPack.choices.forEach((id) => seenModules.add(id));
    run.pickFromPack(null);
  }
  assert.equal(seenModules.size, MODULE_IDS.length);
  assert.equal(seenPlugins.size, Object.keys(PLUGINS).length);
});

test("le Gros pack montre 4 Plugins dont un rare ou mieux, et coûte plus cher", () => {
  assert.ok(PACKS.gros.price > PACKS.plugins.price);
  assert.equal(PACKS.gros.choices, 4);
  const rank = (id) => RARITIES.indexOf(PLUGINS[id].rarity);
  for (let seed = 1; seed <= 200; seed++) {
    const choices = drawPluginPack(new Rng(seed), [], 4, { guaranteeRare: true });
    assert.equal(new Set(choices).size, 4);
    assert.ok(choices.some((id) => rank(id) >= RARITIES.indexOf("rare")), `graine ${seed}`);
  }
  const run = Run.start(11);
  run.phase = Phase.WON;
  run.openShop();
  forceSlots(run, "gros", "plugins");
  run.money = 100;
  assert.ok(run.buyPack(0).ok);
  assert.equal(run.money, 100 - PACKS.gros.price);
  assert.equal(run.openPack.choices.length, 4);
});

test("le légendaire ne sort que d'un paquet, avec une petite chance", () => {
  const legends = Object.values(PLUGINS).filter((plugin) => plugin.rarity === "legendary");
  const rng = new Rng(5);
  let drops = 0;
  for (let roll = 0; roll < 4000; roll++) {
    if (drawPluginPack(rng, [], 2, { legendaryChance: 0.05 }).some((id) => PLUGINS[id].rarity === "legendary")) drops++;
  }
  if (!legends.length) return assert.equal(drops, 0);
  assert.ok(drops > 80 && drops < 320, `${drops} légendaires sur 4000`);
});

test("chaque boutique a 2 emplacements de paquets ; tous les types peuvent sortir, et la première boutique a un Pack de Plugins", () => {
  const seen = new Set();
  for (let seed = 1; seed <= 300; seed++) {
    const run = Run.start(seed);
    run.phase = Phase.WON;
    run.openShop();
    assert.equal(run.packSlots.length, 2);
    assert.ok(run.packSlots.some((slot) => slot.packId === "plugins"), `première boutique, graine ${seed}`);
    run.packSlots.forEach((slot) => seen.add(slot.packId));
  }
  assert.deepEqual([...seen].sort(), [...PACK_IDS].sort());
});

test("un Pack de Plugins montre 2 Plugins différents qu'on n'a pas ; on en garde un", () => {
  const run = Run.start(7);
  run.phase = Phase.WON;
  run.openShop();
  forceSlots(run, "plugins", "plugins");
  run.money = 100;
  assert.ok(run.buyPack(0).ok);
  assert.equal(run.money, 100 - PACKS.plugins.price);
  const { choices } = run.openPack;
  assert.equal(new Set(choices).size, PACKS.plugins.choices);
  choices.forEach((id) => assert.ok(!run.pluginIds.includes(id)));
  assert.ok(run.pickFromPack(choices[0]).ok);
  assert.ok(run.pluginIds.includes(choices[0]));
  assert.equal(run.openPack, null);
});

test("Plugins pleins : le Pack de Plugins demande lequel remplacer, et le rembourse à moitié", () => {
  const run = Run.start(8);
  run.phase = Phase.WON;
  run.openShop();
  forceSlots(run, "plugins", "plugins");
  run.money = 100;
  const owned = Object.keys(PLUGINS).slice(0, RULES.maxPlugins);
  run.pluginIds = [...owned];
  run.buyPack(0);
  const chosen = run.openPack.choices[0];
  assert.equal(run.pickFromPack(chosen).reason, Refusal.NO_PLUGIN_SLOT);
  assert.ok(run.openPack, "le paquet reste ouvert après un refus");
  assert.equal(run.pickFromPack(chosen, "inconnu").reason, Refusal.UNKNOWN_PLUGIN);
  const before = run.money;
  assert.ok(run.pickFromPack(chosen, owned[0]).ok);
  assert.ok(run.pluginIds.includes(chosen));
  assert.ok(!run.pluginIds.includes(owned[0]));
  assert.equal(run.money, before + pluginSellPrice(owned[0]));
  assert.equal(run.pluginIds.length, RULES.maxPlugins);
});

test("les raretés sortent comme prévu ; le légendaire ne sort pas en boutique", () => {
  const counts = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };
  const rng = new Rng(9);
  for (let roll = 0; roll < 3000; roll++) drawPlugins(rng, [], 2).forEach((id) => counts[PLUGINS[id].rarity]++);
  assert.equal(counts.legendary, 0);
  assert.ok(counts.common > counts.uncommon && counts.uncommon > counts.rare && counts.rare > counts.epic, JSON.stringify(counts));
  assert.ok(counts.common > counts.rare * 4, JSON.stringify(counts));
  assert.equal(new Set(drawPlugins(new Rng(1), [], 4)).size, 4);
});

test("le prix d'un Plugin ne dépend que de sa rareté, et la revente en rend la moitié", () => {
  Object.values(PLUGINS).forEach((plugin) => {
    assert.equal(plugin.price, RULES.pluginPrice[plugin.rarity], plugin.id);
    assert.ok(RARITIES.includes(plugin.rarity), plugin.id);
  });
  assert.ok(RULES.pluginPrice.common < RULES.pluginPrice.uncommon && RULES.pluginPrice.rare < RULES.pluginPrice.epic && RULES.pluginPrice.epic < RULES.pluginPrice.legendary);
  assert.equal(pluginSellPrice("intern"), 2);
});

test("les nouveaux Plugins de la vague 3 font ce qu'ils disent", () => {
  const card = (moduleId, level = 1) => createCard(`n${++uid}`, moduleId, level);
  const withPlugin = (id, cells) => score(cells, { pluginIds: [id] });
  const cells = (entries) => Array.from({ length: CELL_COUNT }, (_, index) => entries[index] ?? null);
  const one = cells({ 0: card("server") });
  const base = score(one).compute;
  assert.equal(withPlugin("corner", one).compute, base + 25, "un module dans un coin");
  assert.equal(withPlugin("corner", cells({ 5: card("server") })).compute, base, "pas dans un coin");
  assert.equal(withPlugin("alternate", one).compute, base + 30);
  assert.equal(withPlugin("pool", one).scale, score(one).scale + 3 * (GRID_SIZE - 1));
  assert.equal(withPlugin("proofreader", cells({ 0: card("server", 2) })).scale, score(cells({ 0: card("server", 2) })).scale + 2);
  assert.equal(withPlugin("tester", one).compute, base, "pas d'Ops posé");
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
  run.pluginIds = ["intern", "dba", "caffeine", "janitor", "veteran"];
  run.offers = [{ kind: OfferKind.PLUGIN, id: "growth", price: 6, sold: false }];
  run.money = 4;
  assert.equal(run.buy(0).reason, Refusal.NO_PLUGIN_SLOT);
  assert.equal(run.buy(0, "sre").reason, Refusal.UNKNOWN_PLUGIN);
  assert.ok(run.buy(0, "dba").ok, "4 $ + 2 $ de revente = 6 $");
  assert.deepEqual(run.pluginIds, ["intern", "growth", "caffeine", "janitor", "veteran"], "il prend la place de l'ancien");
  assert.equal(run.money, 0);
});

test("la valeur actuelle des Plugins suit la partie et le plateau", () => {
  const run = Run.start(4);
  run.pluginIds = ["veteran", "hoarder", "investor", "intern", "cloudarch", "janitor"].slice(0, RULES.maxPlugins);
  run.contractIndex = 3;
  const values = run.pluginValues;
  assert.deepEqual(values.veteran, { kind: "compute", amount: 30, mode: "add" });
  assert.deepEqual(values.hoarder, { kind: "compute", amount: run.parc.size, mode: "add" });
  assert.deepEqual(values.investor, { kind: "scale", amount: 1 + 0.25 * run.pluginIds.length, mode: "times" });
  assert.deepEqual(values.cloudarch, { kind: "mult", amount: 1.5, mode: "times" });
  assert.equal(values.janitor, undefined, "pas de badge quand le chiffre ne change jamais");
  assert.equal(values.intern.amount, 10 * run.round.board.placedCount, "suit le plateau en cours");
});

test("le déploiement dit quels Plugins s'activent à chaque case et à la fin", () => {
  const cardsOn = Array.from({ length: CELL_COUNT }, (_, index) => (index === 0 ? createCard("c1", "server") : null));
  const result = score(cardsOn, { pluginIds: ["cloudarch", "intern", "corner"] });
  assert.deepEqual(result.events[0].plugins.map((entry) => entry.id), ["cloudarch"]);
  assert.equal(result.events[0].plugins[0].mult, 1.5);
  const end = Object.fromEntries(result.endEvents.map((entry) => [entry.id, entry.compute]));
  assert.deepEqual(end, { intern: 10, corner: 25 });
});

test("on réordonne les Plugins par glisser-déposer, et l'ordre change le score", () => {
  const run = Run.start(6);
  run.pluginIds = ["intern", "minimal", "dba"];
  assert.ok(run.movePlugin(2, 0).ok);
  assert.deepEqual(run.pluginIds, ["dba", "intern", "minimal"]);
  assert.ok(run.movePlugin(1, 1).ok);
  assert.equal(run.movePlugin(0, 3).reason, Refusal.UNKNOWN_PLUGIN);
  assert.equal(run.movePlugin(-1, 0).reason, Refusal.UNKNOWN_PLUGIN);
  const board = Array.from({ length: CELL_COUNT }, (_, index) => (index === 0 ? createCard("o1", "server") : null));
  const before = score(board, { pluginIds: ["intern", "minimal"] }).compute;
  const after = score(board, { pluginIds: ["minimal", "intern"] }).compute;
  assert.ok(before > after, "Compute ×2 après +3 vaut plus que l'inverse");
});

// ---------- Le Terminal : commandes à usage unique ----------

/** Une partie à la boutique, avec ces commandes dans le Terminal et assez d'argent. */
const shopWith = (commands, seed = 5) => {
  const run = Run.start(seed);
  run.phase = Phase.WON;
  run.openShop();
  run.commandIds = [...commands];
  run.money = 50;
  return run;
};

test("le Terminal : 9 commandes, 2 emplacements, un seul prix, pas de rareté", () => {
  assert.equal(COMMAND_IDS.length, 9);
  assert.equal(RULES.terminal.slots, 2);
  COMMAND_IDS.forEach((id) => assert.equal(COMMANDS[id].rarity, undefined));
  const run = Run.start(1);
  run.phase = Phase.WON;
  for (let seed = 1; seed <= 200; seed++) {
    const shop = Run.start(seed);
    shop.phase = Phase.WON;
    shop.openShop();
    shop.offers.filter((offer) => offer.kind === OfferKind.COMMAND).forEach((offer) => {
      assert.equal(offer.price, RULES.terminal.price);
      assert.ok(COMMAND_IDS.includes(offer.id));
    });
  }
});

test("une offre de la boutique peut devenir une commande : elle prend un emplacement du Terminal", () => {
  let found = null;
  for (let seed = 1; seed <= 300 && !found; seed++) {
    const run = Run.start(seed);
    run.phase = Phase.WON;
    run.openShop();
    const index = run.offers.findIndex((offer) => offer.kind === OfferKind.COMMAND);
    if (index >= 0) found = { run, index };
  }
  assert.ok(found, "au moins une offre est une commande");
  const { run, index } = found;
  run.money = 10;
  const id = run.offers[index].id;
  assert.ok(run.buy(index).ok);
  assert.deepEqual(run.commandIds, [id]);
  assert.equal(run.money, 10 - RULES.terminal.price);
  assert.equal(run.pluginIds.length, 0, "ce n'est pas un Plugin");
  assert.equal(run.buy(index).reason, Refusal.ALREADY_SOLD);
});

test("le Terminal plein refuse une commande de plus, et l'argent ne part pas", () => {
  const run = shopWith(["cp", "rm"]);
  run.offers = [{ kind: OfferKind.COMMAND, id: "ping", price: 4, sold: false }];
  assert.equal(run.buy(0).reason, Refusal.NO_COMMAND_SLOT);
  assert.equal(run.money, 50);
  assert.equal(run.offers[0].sold, false);
});

test("Le Concierge rend les commandes de la boutique 1 $ moins chères", () => {
  const run = shopWith([]);
  run.pluginIds = ["janitor"];
  run.offers = [{ kind: OfferKind.COMMAND, id: "ping", price: 4, sold: false }];
  assert.equal(run.priceOfOffer(run.offers[0]), 3);
  assert.equal(presentRun(run).offers[0].price, 3);
  run.money = 3;
  assert.ok(run.buy(0).ok);
  assert.equal(run.money, 0);
});

test("le Pack Terminal propose 3 commandes : on en garde une, comme les autres boosters", () => {
  assert.equal(PACKS.terminal.choices, 3);
  const seen = new Set();
  for (let seed = 1; seed <= 300; seed++) {
    const run = shopWith([], seed);
    run.packSlots = [{ packId: "terminal", sold: false }, { packId: "terminal", sold: false }];
    assert.ok(run.buyPack(0).ok);
    assert.equal(run.money, 50 - PACKS.terminal.price);
    const { choices } = run.openPack;
    assert.equal(new Set(choices).size, 3, "3 commandes différentes");
    assert.deepEqual(run.commandIds, [], "rien n'est gardé avant le choix");
    assert.equal(run.buyPack(1).reason, Refusal.PACK_PENDING, "le paquet ouvert doit être choisi d'abord");
    assert.ok(run.pickFromPack(choices[1]).ok);
    assert.deepEqual(run.commandIds, [choices[1]]);
    assert.equal(run.openPack, null);
    choices.forEach((id) => seen.add(id));
  }
  assert.equal(seen.size, COMMAND_IDS.length, "toutes les commandes peuvent sortir d'un pack");
  const skip = shopWith([]);
  skip.packSlots = [{ packId: "terminal", sold: false }];
  skip.buyPack(0);
  assert.ok(skip.pickFromPack(null).ok);
  assert.deepEqual(skip.commandIds, [], "on peut ne rien prendre");
  const full = shopWith(["cp", "rm"]);
  full.packSlots = [{ packId: "terminal", sold: false }];
  assert.equal(full.buyPack(0).reason, Refusal.NO_COMMAND_SLOT);
  assert.equal(full.money, 50, "refusé : l'argent ne part pas");
  assert.equal(full.packSlots[0].sold, false);
});

test("ping : +1 déploiement pendant le contrat, pas à la boutique", () => {
  const run = Run.start(3);
  run.commandIds = ["ping", "ping"];
  const before = run.round.deploysLeft;
  assert.ok(run.useCommand(0).ok);
  assert.equal(run.round.deploysLeft, before + 1);
  assert.equal(run.limits.deploys, RULES.deploysPerContract + 1);
  assert.deepEqual(run.commandIds, ["ping"], "la commande est consommée");
  const shop = shopWith(["ping"]);
  assert.equal(shop.useCommand(0).reason, Refusal.COMMAND_NOT_NOW);
  assert.deepEqual(shop.commandIds, ["ping"], "refusée : pas consommée");
  run.goToNextContract?.();
});

test("ssh : +1 module posé pour le contrat en cours seulement", () => {
  const run = Run.start(4);
  run.commandIds = ["ssh"];
  for (let cell = 0; cell < RULES.maxPlaced; cell++) assert.ok(run.place(run.round.hand[0], cell).ok);
  assert.equal(run.place(run.round.hand[0], RULES.maxPlaced).reason, Refusal.BOARD_FULL);
  assert.ok(run.useCommand(0).ok);
  assert.equal(run.limits.maxPlaced, RULES.maxPlaced + 1);
  assert.ok(run.place(run.round.hand[0], RULES.maxPlaced).ok);
  run.startRound();
  assert.equal(run.limits.maxPlaced, RULES.maxPlaced, "le bonus ne dure pas au contrat suivant");
});

test("motherlode double l'argent (20 $ au plus), mysqldump double la Data (10 ◆ au plus)", () => {
  const run = shopWith(["motherlode", "motherlode"]);
  run.money = 7;
  assert.ok(run.useCommand(0).ok);
  assert.equal(run.money, 14);
  run.money = 35;
  assert.ok(run.useCommand(0).ok);
  assert.equal(run.money, 55, "plafond : +20 $");
  const dump = shopWith(["mysqldump", "mysqldump"]);
  dump.data = 4;
  assert.ok(dump.useCommand(0).ok);
  assert.equal(dump.data, 8);
  dump.data = 30;
  assert.ok(dump.useCommand(0).ok);
  assert.equal(dump.data, 40, "plafond : +10 ◆");
});

test("cp, rm et ln -s tirent une main de modules du parc et ne visent que ces modules", () => {
  const run = shopWith(["cp"]);
  const result = run.useCommand(0);
  assert.ok(result.ok);
  assert.equal(result.value.hand.length, RULES.terminal.handSize);
  assert.equal(new Set(result.value.hand).size, RULES.terminal.handSize);
  assert.ok(result.value.hand.every((uid) => run.card(uid)));
  assert.deepEqual(run.commandIds, ["cp"], "pas consommée avant le choix");
  const outside = run.parc.uids().find((uid) => !result.value.hand.includes(uid));
  assert.equal(run.applyCommand([outside]).reason, Refusal.BAD_TARGETS);
  assert.equal(run.applyCommand([]).reason, Refusal.BAD_TARGETS);
  assert.equal(run.applyCommand(result.value.hand.slice(0, 2)).reason, Refusal.BAD_TARGETS, "cp vise un seul module");
  const source = run.card(result.value.hand[0]);
  const before = run.parc.size;
  assert.ok(run.applyCommand([source.uid]).ok);
  assert.equal(run.parc.size, before + 1);
  assert.equal(run.parc.cards.at(-1).moduleId, source.moduleId);
  assert.equal(run.parc.cards.at(-1).level, 1, "la copie est de niveau 1");
  assert.deepEqual(run.commandIds, []);
  assert.equal(run.commandSession, null);
  assert.equal(run.applyCommand([source.uid]).reason, Refusal.NO_COMMAND_SESSION);
});

test("toutes les commandes se jouent pendant un contrat, sauf ping et ssh à la boutique", () => {
  COMMAND_IDS.filter((id) => id !== "!!" && id !== "apt upgrade").forEach((id) => {
    const run = Run.start(7);
    run.commandIds = [id];
    run.architecturePlays = { redondance: 1 };
    run.architectureOrder = ["redondance"];
    assert.ok(run.useCommand(0).ok, `${id} en contrat`);
  });
  const run = Run.start(7);
  run.architecturePlays = { redondance: 2 };
  run.architectureOrder = ["redondance"];
  run.commandIds = ["apt upgrade"];
  assert.ok(run.useCommand(0).ok, "apt upgrade en contrat");
  ["ping", "ssh"].forEach((id) => assert.equal(shopWith([id]).useCommand(0).reason, Refusal.COMMAND_NOT_NOW, `${id} à la boutique`));
  COMMAND_IDS.filter((id) => !["ping", "ssh", "!!"].includes(id)).forEach((id) => {
    const shop = shopWith([id]);
    shop.architecturePlays = { redondance: 1 };
    shop.architectureOrder = ["redondance"];
    assert.ok(shop.useCommand(0).ok, `${id} à la boutique`);
  });
});

test("cp pendant un contrat : la copie rejoint la pioche", () => {
  const run = Run.start(8);
  run.commandIds = ["cp"];
  const source = run.round.hand[0];
  run.useCommand(0);
  const drawBefore = run.round.drawPile.length;
  const parcBefore = run.parc.size;
  assert.ok(run.applyCommand([run.commandSession.hand[0]]).ok);
  assert.equal(run.parc.size, parcBefore + 1);
  assert.equal(run.round.drawPile.length, drawBefore + 1);
  assert.ok(run.round.drawPile.includes(run.parc.cards.at(-1).uid));
  assert.ok(source, "la main n'a pas bougé");
});

test("rm pendant un contrat : le module disparaît de la main, du plateau et de la pioche", () => {
  const run = Run.start(9);
  run.commandIds = ["rm"];
  const inHand = run.round.hand[0];
  const onBoard = run.round.hand[1];
  run.place(onBoard, 0);
  const inDraw = run.round.drawPile[0];
  run.round.hand = run.round.hand.slice();
  run.useCommand(0);
  run.commandSession.hand = [inHand, onBoard];
  assert.ok(run.applyCommand([inHand, onBoard]).ok);
  [inHand, onBoard].forEach((uid) => {
    assert.equal(run.card(uid), null);
    assert.ok(!run.round.hand.includes(uid) && !run.round.board.cells.includes(uid) && !run.round.drawPile.includes(uid));
  });
  assert.equal(run.round.hand.length + run.round.board.placedCount, run.limits.handSize, "la main est complétée");
  assert.ok(inDraw);
  const last = Run.start(10);
  last.commandIds = ["rm"];
  last.round.drawPile = [];
  last.round.hand = [last.round.hand[0]];
  last.round.board = last.round.board.constructor.empty();
  last.useCommand(0);
  last.commandSession.hand = [last.round.hand[0]];
  assert.equal(last.applyCommand([last.round.hand[0]]).reason, Refusal.WOULD_LOSE, "on ne se retire pas la dernière carte jouable");
});

test("renoncer à une commande ciblée ne la consomme pas", () => {
  const run = shopWith(["rm"]);
  run.useCommand(0);
  assert.ok(run.cancelCommand().ok);
  assert.deepEqual(run.commandIds, ["rm"]);
  assert.equal(run.commandSession, null);
});

test("rm supprime jusqu'à 2 modules, mais le parc garde son minimum", () => {
  const run = shopWith(["rm", "rm"]);
  const { hand } = run.useCommand(0).value;
  assert.equal(run.applyCommand(hand.slice(0, 3)).reason, Refusal.BAD_TARGETS, "2 modules au plus");
  const before = run.parc.size;
  assert.ok(run.applyCommand(hand.slice(0, 2)).ok);
  assert.equal(run.parc.size, before - 2);
  assert.ok(hand.slice(0, 2).every((uid) => !run.card(uid)));
  const small = shopWith(["rm"]);
  while (small.parc.size > RULES.minParcSize + 1) small.parc.remove(small.parc.cards[0].uid);
  const picked = small.useCommand(0).value.hand.slice(0, 2);
  assert.equal(small.applyCommand(picked).reason, Refusal.PARC_TOO_SMALL);
  assert.deepEqual(small.commandIds, ["rm"], "refusée : pas consommée");
  assert.ok(small.applyCommand(picked.slice(0, 1)).ok, "un seul module passe");
});

test("ln -s : un module compte comme n'importe quel autre pour l'architecture, et garde ses effets", () => {
  const plain = board("server", "server", "server", "server", "cdn");
  assert.equal(detectArchitecture(plain.filter(Boolean), familyOf).id, "ferme");
  const wildCards = [...cards("server", "server", "server", "server"), { ...createCard("w1", "cdn"), wild: true }];
  assert.equal(detectArchitecture(wildCards, familyOf, MODULE_IDS).id, "datacenter", "le joker devient un Serveur");
  const mixed = [...cards("server", "cdn", "database", "saas"), { ...createCard("w2", "cache"), wild: true }];
  assert.equal(detectArchitecture(mixed, familyOf, MODULE_IDS).id, "fullstack", "le joker apporte la famille qui manque");
  const cells = [...wildCards, ...Array(CELL_COUNT - 5).fill(null)];
  const result = score(cells);
  assert.equal(result.architecture.id, "datacenter");
  const asCdn = score([...cards("server", "server", "server", "server"), createCard("w1", "cdn"), ...Array(CELL_COUNT - 5).fill(null)]);
  assert.notEqual(asCdn.architecture.id, "datacenter", "sans la commande, c'est une Ferme");
});

test("ln -s dure jusqu'à la fin du prochain contrat", () => {
  const run = shopWith(["ln -s"]);
  const { hand } = run.useCommand(0).value;
  assert.ok(run.applyCommand([hand[0]]).ok);
  assert.equal(run.wildUid, hand[0]);
  run.goToNextContract();
  assert.equal(run.wildUid, hand[0], "toujours là pendant le contrat");
  run.place(run.round.hand[0], 0);
  run.round.score = run.contract.target;
  assert.ok(run.deploy().ok);
  assert.equal(run.wildUid, null, "contrat livré : le joker disparaît");
});

test("apt upgrade monte l'architecture la plus jouée, à égalité la dernière jouée", () => {
  const none = shopWith(["apt upgrade"]);
  assert.equal(none.useCommand(0).reason, Refusal.NO_ARCHITECTURE_PLAYED);
  assert.deepEqual(none.commandIds, ["apt upgrade"]);
  const run = shopWith(["apt upgrade", "apt upgrade"]);
  run.architecturePlays = { redondance: 3, cluster: 3, monolithe: 1 };
  run.architectureOrder = ["cluster", "redondance"];
  const result = run.useCommand(0);
  assert.ok(result.ok);
  assert.equal(result.value.architectureId, "redondance", "à égalité : la jouée en dernier");
  assert.equal(run.architectureLevels.redondance, 2);
  run.architecturePlays = { redondance: 3, cluster: 5 };
  assert.equal(run.useCommand(0).value.architectureId, "cluster");
});

test("un déploiement note l'ordre des architectures jouées", () => {
  const run = Run.start(6);
  run.place(run.round.hand[0], 0);
  assert.ok(run.deploy().ok);
  assert.equal(run.architectureOrder.length, 1);
  assert.equal(run.architectureOrder[0], Object.keys(run.architecturePlays)[0]);
});

test("!! rejoue la dernière commande, si elle s'utilise à cette étape", () => {
  const empty = shopWith(["!!"]);
  assert.equal(empty.useCommand(0).reason, Refusal.NO_LAST_COMMAND);
  const run = shopWith(["motherlode", "!!"]);
  run.money = 5;
  run.useCommand(0);
  assert.equal(run.money, 10);
  assert.equal(run.lastCommand, "motherlode");
  assert.ok(run.useCommand(0).ok, "!! est maintenant en emplacement 0");
  assert.equal(run.money, 20);
  assert.deepEqual(run.commandIds, []);
  const wrong = shopWith(["!!"]);
  wrong.lastCommand = "ping";
  assert.equal(wrong.useCommand(0).reason, Refusal.COMMAND_NOT_NOW, "ping ne se rejoue pas à la boutique");
  const targeted = shopWith(["cp", "!!"]);
  targeted.useCommand(0);
  targeted.applyCommand([targeted.commandSession.hand[0]]);
  const second = targeted.useCommand(0);
  assert.ok(second.ok);
  assert.equal(second.value.commandId, "cp", "!! rejoue cp avec une nouvelle main");
  assert.equal(second.value.hand.length, RULES.terminal.handSize);
});

test("le Terminal se sauvegarde avec la partie", () => {
  const run = shopWith(["cp", "!!"]);
  run.useCommand(0);
  run.wildUid = run.parc.cards[0].uid;
  run.lastCommand = "motherlode";
  const copy = Run.fromSnapshot(JSON.parse(JSON.stringify(run.toSnapshot())));
  assert.deepEqual(copy.toSnapshot(), run.toSnapshot());
  assert.deepEqual(copy.commandSession, run.commandSession);
  assert.equal(copy.wildUid, run.wildUid);
});

test("le présentateur montre le Terminal : commandes, emplacements, main tirée", () => {
  const run = shopWith(["cp"]);
  run.useCommand(0);
  const view = presentRun(run);
  assert.deepEqual(view.commands, ["cp"]);
  assert.equal(view.commandSlots, 2);
  assert.equal(view.commandSession.commandId, "cp");
  assert.equal(view.commandSession.hand.length, RULES.terminal.handSize);
});

test("le service lance, applique et annule les commandes, et les sauvegarde", () => {
  const game = service();
  game.run.commandIds = ["ping", "cp"];
  assert.ok(game.useCommand(0).ok);
  assert.deepEqual(game.getView().commands, ["cp"]);
  assert.ok(game.useCommand(0).ok, "cp aussi s'utilise depuis l'écran de jeu");
  assert.equal(game.getView().commandSession.commandId, "cp");
  assert.ok(game.cancelCommand().ok);
  assert.deepEqual(game.getView().commands, ["cp"], "renoncer ne consomme pas");
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
  assert.equal(g.with.compute - g.without.compute, 30, "Vétéran : +10 par contrat livré");
  g = gain(four, ["mentor", "intern", "growth"]);
  assert.equal(g.with.compute - score(four, { pluginIds: ["intern", "growth"] }).compute, 40, "Mentor : 2 communs");
  g = gain(four, ["scrum"]);
  assert.equal(Math.round((g.with.scale - g.without.scale) * 10) / 10, 4, "Scrum : 4 modules posés");
  assert.ok(!gain(board("server", "server", "saas"), ["scrum"]).fired.includes("scrum"));
  g = gain(four, ["monetique"]);
  assert.equal(g.with.compute - g.without.compute, 60, "Monétique : 2 Business");
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
  assert.equal(tandem.with.compute - tandem.without.compute, 40, "seule la 1re ligne a 2 Calcul");
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

test("tutoriel : la partie préparée donne toujours deux paires de calcul et un premier contrat sans boss", () => {
  const game = new GameService({ repository: new MemoryRunRepository(), seeds: fixedSeedSource(99) });
  game.startTutorial();
  const view = game.getView();
  assert.equal(view.seed, RULES.tutorialSeed);
  assert.equal(view.contract.boss, null);
  const counts = {};
  for (const card of view.hand) counts[card.moduleId] = (counts[card.moduleId] ?? 0) + 1;
  const pairs = Object.entries(counts).filter(([id, n]) => n >= 2 && familyOf(id) === "calcul");
  assert.ok(pairs.length >= 2, "deux paires de modules Calcul en main");
  const [first, second] = view.hand.filter((card) => card.moduleId === pairs[0][0]);
  assert.ok(game.placeCard(first.uid, 0).ok && game.placeCard(second.uid, 1).ok);
  assert.equal(game.getView().preview.architecture.id, "redondance");
});

test("tutoriel : chaque étape a une phase, un texte et une pose connue", async () => {
  const { TUTORIAL_STEPS } = await import("../src/ui/tutorial/steps.js");
  const { LOUP_SVG } = await import("../src/ui/mascot/loupNielSprites.js");
  const game = new GameService({ repository: new MemoryRunRepository(), seeds: fixedSeedSource(99) });
  game.startTutorial();
  for (const step of TUTORIAL_STEPS) {
    assert.ok(Object.values(Phase).includes(step.phase), step.id);
    assert.ok(LOUP_SVG[step.pose], step.id);
    assert.ok(step.text(game.getView()).length > 10, step.id);
  }
});

test("répliques de Loup Niel : même graine, même réplique, toujours dans la liste", async () => {
  const { VICTORY_QUOTES, DEFEAT_QUOTES, quoteFor } = await import("../src/ui/mascot/repliques.js");
  for (const seed of [0, 1, 48213, -7, 2 ** 31 - 1]) {
    assert.equal(quoteFor(VICTORY_QUOTES, seed), quoteFor(VICTORY_QUOTES, seed));
    assert.ok(VICTORY_QUOTES.includes(quoteFor(VICTORY_QUOTES, seed)));
    assert.ok(DEFEAT_QUOTES.includes(quoteFor(DEFEAT_QUOTES, seed)));
  }
});

test("Cache : une brique réactivée ressert le résultat mis en cache", () => {
  const plain = score(board("server", "worker"));
  const cached = score(board("cache", "server", "worker"));
  const server = score(board("server"));
  const unit = server.compute - 5; // ce que produit le Serveur (la base du Monolithe est 5)
  assert.ok(unit > 0);
  assert.equal(plain.compute, 5 + 2 * unit); // activation + réactivation
  assert.equal(cached.compute, 5 + 2 * (2 * unit)); // les deux activations profitent du Cache ×2
});

test("Cache : le cache ne sert qu'à la case qui en a profité", () => {
  const other = score(board("cache", "server", "micro", "worker"));
  const base = score(board("server", "micro", "worker"));
  // le Worker réactive le Micro (non boosté) : seul le Serveur gagne le ×2
  const server = score(board("server")).compute - 5;
  assert.equal(other.compute - base.compute, server);
});

// ---------- Vague 4 : Plugins qui multiplient Scale et qui grandissent ----------
/** Le Scale sans puis avec les Plugins donnés, pour le même plateau. */
const scaleWith = (cells, pluginIds, extra = {}) => [score(cells, extra).scale, score(cells, { pluginIds, ...extra }).scale];
const placeAt = (cells) => { const out = Array(CELL_COUNT).fill(null); Object.entries(cells).forEach(([cell, id]) => { out[cell] = cards(id)[0]; }); return out; };

test("les Plugins qui grandissent suivent les déploiements joués", () => {
  const cells = board("server", "cdn");
  assert.equal(round2(score(cells, { pluginIds: ["ticketjira"], deploysPlayed: 12 }).scale - score(cells).scale), 6);
  assert.equal(score(cells, { pluginIds: ["ticketjira"] }).scale, score(cells).scale);
  assert.equal(score(cells, { pluginIds: ["sprint"], deploysThisContract: 3 }).compute - score(cells).compute, 60);
  assert.equal(score(cells, { pluginIds: ["hotfix"], isLastDeploy: true }).scale - score(cells).scale, 6);
  assert.equal(score(cells, { pluginIds: ["hotfix"], isLastDeploy: false }).scale, score(cells).scale);
});

test("Load Balancer : ×1,3 avec deux modules identiques", () => {
  const [before, after] = scaleWith(board("server", "server", "cdn"), ["loadbalancer"]);
  assert.equal(after, round2(before * 1.3));
  const [same, none] = scaleWith(board("server", "cdn"), ["loadbalancer"]);
  assert.equal(none, same);
});

test("Certification : ×1,25 sauf pour un Monolithe", () => {
  const [before, after] = scaleWith(board("server", "server", "cdn"), ["certification"]);
  assert.equal(after, round2(before * 1.25));
  const [mono, monoAfter] = scaleWith(board("server", "cdn"), ["certification"]);
  assert.equal(monoAfter, mono);
});

test("Monitoring : ×1,15 par module Ops", () => {
  const [before, after] = scaleWith(board("server", "cache", "worker"), ["monitoring"]);
  assert.equal(after, round2(before * 1.15 ** 2));
  const [none, noneAfter] = scaleWith(board("server", "cdn"), ["monitoring"]);
  assert.equal(noneAfter, none);
});

test("Conteneur : ×1,3 si aucun module n'est isolé", () => {
  const [before, after] = scaleWith(board("server", "cdn", "cache"), ["conteneur"]);
  assert.equal(after, round2(before * 1.3));
  const apart = placeAt({ 0: "server", 15: "cdn" });
  const [alone, aloneAfter] = scaleWith(apart, ["conteneur"]);
  assert.equal(aloneAfter, alone);
});

test("Hyperscaler, Autoscaling et Montée en charge grandissent avec la partie", () => {
  const cells = board("server", "cdn");
  const [base, hyper] = scaleWith(cells, ["hyperscaler"], { contractsWon: 10 });
  assert.equal(hyper, round2(base * 2));
  const [, last] = scaleWith(cells, ["autoscaling"], { isLastDeploy: true });
  const [, usual] = scaleWith(cells, ["autoscaling"]);
  assert.equal(last, round2(base * 2));
  assert.equal(usual, round2(base * 1.5));
  const [, climb] = scaleWith(cells, ["montee"], { deploysThisContract: 2 });
  assert.equal(climb, round2(base * 1.15 ** 2));
});

test("Feature Flag multiplie Scale à chaque réactivation", () => {
  let scale = 3;
  PLUGINS.featureflag.onRetrigger({ multiplyScale: (factor) => { scale *= factor; } });
  assert.equal(round2(scale), 3.6);
  const cells = board("server", "micro", "worker");
  const [base, flagged] = scaleWith(cells, ["featureflag"]);
  assert.equal(flagged, round2(base * 1.2));
});

test("Déploiement final ne joue qu'à droite de la rangée", () => {
  const cells = board("server", "cdn");
  const [base, right] = scaleWith(cells, ["pivot", "deploiementfinal"]);
  const [, left] = scaleWith(cells, ["deploiementfinal", "pivot"]);
  const pivot = scaleWith(cells, ["pivot"])[1];
  assert.equal(right, round2(pivot * 3));
  assert.equal(left, pivot);
  assert.ok(base < pivot);
});

test("Rachat de start-up compte les Plugins épiques, Pivot les familles, Monorepo les modules différents", () => {
  const cells = board("server", "cdn", "cache");
  const [base, bought] = scaleWith(cells, ["rachat", "pivot"]);
  const withPivot = scaleWith(cells, ["pivot"])[1];
  assert.equal(bought, round2(withPivot * 2));
  assert.equal(withPivot, round2(base * (1 + 0.25 * 3)));
  const [, mono] = scaleWith(cells, ["monorepo"]);
  assert.equal(mono, round2(base * 2.5));
  const [dupBase, dup] = scaleWith(board("server", "server", "cdn"), ["monorepo"]);
  assert.equal(dup, dupBase);
});

test("les badges des Plugins de la vague 4 suivent la partie", () => {
  const run = Run.start(5);
  run.pluginIds = ["ticketjira", "deploiementfinal", "hyperscaler"];
  run.architecturePlays = { monolithe: 4 };
  run.contractIndex = 6;
  const values = run.pluginValues;
  assert.equal(values.ticketjira.amount, 2);
  assert.equal(values.hyperscaler.amount, 1.6);
  assert.equal(values.deploiementfinal.amount, 1);
  run.pluginIds = ["hyperscaler", "deploiementfinal"];
  assert.equal(run.pluginValues.deploiementfinal.amount, 3);
});

test("la vitesse du jeu : ×1 par défaut, ×2 et ×3 gardés, une valeur inconnue est ignorée", async () => {
  const { SPEEDS, loadSpeed, saveSpeed } = await import("../src/ui/gameSpeed.js");
  const store = new Map();
  const preferences = { get: (key) => store.get(key) ?? null, set: (key, value) => store.set(key, value) };
  assert.deepEqual(SPEEDS, [1, 2, 3]);
  assert.equal(loadSpeed(preferences), 1);
  saveSpeed(preferences, 3);
  assert.equal(loadSpeed(preferences), 3);
  saveSpeed(preferences, 4);
  assert.equal(loadSpeed(preferences), 3, "×4 n'existe plus : on garde ×3");
  store.set("speed", "banane");
  assert.equal(loadSpeed(preferences), 1);
  assert.equal(loadSpeed(undefined), 1);
});

test("le compteur des architectures jouées est propre à la partie : une nouvelle partie repart à 0", () => {
  const first = Run.start(6);
  first.place(first.round.hand[0], 0);
  assert.ok(first.deploy().ok);
  assert.equal(Object.values(first.architecturePlays).reduce((a, b) => a + b, 0), 1);
  const second = Run.start(6);
  assert.deepEqual(second.architecturePlays, {});
  assert.deepEqual(second.architectureOrder, []);
  assert.equal(mostPlayedArchitecture(second), null);
});

// ---------- Vague 5 : Plugins d'architecture, de petite main et de cœur de jeu ----------

const pluginGain = (cells, pluginId) => {
  const sans = score(cells);
  const avec = score(cells, { pluginIds: [pluginId] });
  return { compute: avec.compute - sans.compute, scale: round2(avec.scale - sans.scale), fired: avec.fired.includes(pluginId), sans, avec };
};

test("Plugins d'architecture : ils se déclenchent quand la main visée est posée, et seulement alors", () => {
  const cases = [
    // [Plugin, plateau qui déclenche, plateau qui ne déclenche pas, effet]
    ["doublon", board("server", "server"), board("server", "micro"), { scale: 4 }],
    ["failover", board("server", "server"), board("server", "micro"), { compute: 50 }],
    ["binome", board("server", "server", "micro", "micro"), board("server", "server", "micro"), { scale: 6 }],
    ["planreprise", board("server", "server", "micro", "micro"), board("server", "server", "micro"), { compute: 70 }],
    ["triplet", board("server", "server", "server"), board("server", "server", "micro"), { scale: 8 }],
    ["testcharge", board("server", "server", "server"), board("server", "server", "micro"), { compute: 90 }],
    ["pilecomplete", board("server", "database", "cdn", "saas", "cache"), board("server", "database", "cdn", "saas"), { scale: 8 }],
    ["devfullstack", board("server", "database", "cdn", "saas", "cache"), board("server", "database", "cdn", "saas"), { compute: 90 }],
    ["specialiste", board("server", "micro", "api", "gpu", "lambda"), board("server", "micro", "api", "gpu", "database"), { scale: 6 }],
    ["monotechno", board("server", "micro", "api", "gpu", "lambda"), board("server", "micro", "api", "gpu", "database"), { compute: 70 }],
  ];
  for (const [id, yes, no, effect] of cases) {
    const hit = pluginGain(yes, id);
    assert.ok(hit.fired, `${id} se déclenche`);
    assert.equal(hit.compute, effect.compute ?? 0, `${id} : Compute`);
    assert.equal(hit.scale, effect.scale ?? 0, `${id} : Scale`);
    assert.ok(!pluginGain(no, id).fired, `${id} ne se déclenche pas sans la main`);
  }
});

test("Plugins d'architecture : les ×Scale multiplient Scale (la Haute dispo contient une Redondance)", () => {
  const pair = pluginGain(board("server", "server"), "duo");
  assert.equal(round2(pair.avec.scale), round2(pair.sans.scale * 2));
  const fullHouse = pluginGain(board("server", "server", "server", "micro", "micro"), "duo");
  assert.ok(fullHouse.fired, "une Haute dispo contient une Redondance");
  assert.equal(round2(pluginGain(board("server", "server", "micro", "micro"), "quatuor").avec.scale), round2(pluginGain(board("server", "server", "micro", "micro"), "quatuor").sans.scale * 2.5));
  assert.equal(round2(pluginGain(board("server", "server", "server"), "trio").avec.scale), round2(pluginGain(board("server", "server", "server"), "trio").sans.scale * 3));
  assert.ok(!pluginGain(board("server", "micro"), "duo").fired);
  assert.ok(pluginGain(board("server", "database", "cdn", "saas", "cache"), "ordre").fired);
  assert.ok(pluginGain(board("server", "micro", "api", "gpu", "lambda"), "tribu").fired);
});

test("Plugins de petite main : Monolithe, 3 modules ou moins, une seule famille", () => {
  const mono = pluginGain(board("server", "database"), "dettetech");
  assert.ok(mono.fired);
  assert.equal(mono.compute, 40);
  assert.equal(mono.scale, 6);
  assert.ok(!pluginGain(board("server", "server"), "dettetech").fired, "une Redondance n'est pas un Monolithe");
  const assume = pluginGain(board("server", "database"), "monolitheassume");
  assert.equal(round2(assume.avec.scale), round2(assume.sans.scale * 3));
  assert.ok(!pluginGain(board("server", "server"), "monolitheassume").fired);
  const degrade = pluginGain(board("server", "database", "cdn"), "modedegrade");
  assert.equal(round2(degrade.avec.scale), round2(degrade.sans.scale * 1.5));
  assert.ok(!pluginGain(board("server", "database", "cdn", "saas"), "modedegrade").fired, "4 modules : trop");
  const mono1 = pluginGain(board("server", "micro"), "monometier");
  assert.equal(mono1.avec.compute, mono1.sans.compute * 2);
  assert.ok(!pluginGain(board("server", "database"), "monometier").fired, "deux familles : rien");
});

test("Moins de modules producteurs, plus de production : Refactoring, Sobriété, Zéro dépendance", () => {
  // Le facteur appliqué à chaque module Calcul posé (les cases dans l'ordre), selon les Plugins.
  const factors = (cells, ...pluginIds) => score(cells, { pluginIds }).events.filter((event) => event.output).slice(0, cells.filter((card) => card && familyOf(card.moduleId) === "calcul").length).map((event) => event.multiplier);
  const one = board("server", "database");
  const two = board("server", "micro", "database");
  const three = board("server", "micro", "lambda", "database");
  const four = board("server", "micro", "lambda", "server");
  assert.deepEqual(factors(one, "zerodep"), [4], "un seul Calcul : ×4");
  assert.deepEqual(factors(two, "zerodep"), [1, 1], "deux Calcul : rien");
  assert.deepEqual(factors(two, "sobriete"), [2, 2], "deux Calcul : ×2 pour chacun");
  assert.deepEqual(factors(three, "sobriete"), [1, 1, 1], "trois Calcul : rien");
  assert.deepEqual(factors(three, "refactoring"), [1.5, 1.5, 1.5]);
  assert.deepEqual(factors(four, "refactoring"), [1, 1, 1, 1], "quatre Calcul : rien");
  assert.deepEqual(factors(one, "zerodep", "sobriete", "refactoring"), [12], "les trois se cumulent : ×12");
  const sans = score(one).compute, avec = score(one, { pluginIds: ["zerodep"] }).compute;
  assert.equal(avec - sans, 8 * 3, "le Serveur (8) produit ×4 : +24");
  assert.ok(!score(board("database", "cdn"), { pluginIds: ["zerodep"] }).fired.includes("zerodep"), "sans module Calcul, rien ne produit");
});

test("Vague 5 : chaque Plugin a un dessin, une rareté et une valeur affichable", async () => {
  const { SPRITES, PUCE_LOOK } = await import("../src/ui/plugins/sprites.js");
  const { PLUGIN_VALUES } = await import("../src/domain/catalog/pluginValues.js");
  const news = "doublon failover duo binome planreprise quatuor triplet testcharge trio pilecomplete devfullstack ordre specialiste monotechno tribu dettetech monolitheassume modedegrade monometier refactoring sobriete zerodep".split(" ");
  assert.equal(news.length, 22);
  for (const id of news) {
    assert.ok(PLUGINS[id], id);
    assert.equal(SPRITES[id].length, 16, `${id} : 16 lignes`);
    assert.ok(SPRITES[id].every((row) => row.length === 16), `${id} : 16 colonnes`);
    assert.ok(PUCE_LOOK[id]?.code, id);
    assert.equal(typeof PLUGIN_VALUES[id], "function", id);
  }
});

test("rm à la boutique : la carte supprimée disparaît aussi du contrat fini (la vue n'a plus de carte fantôme)", () => {
  const run = Run.start(5);
  run.phase = Phase.WON;
  run.openShop();
  run.commandIds = ["rm"];
  const [, hand] = [null, run.round.hand.slice()];
  const target = hand[0];
  assert.ok(run.useCommand(0).ok);
  run.commandSession = { ...run.commandSession, hand: [target] };
  assert.ok(run.applyCommand([target]).ok);
  assert.ok(!run.round.hand.includes(target), "la main du contrat fini ne garde pas la carte");
  const view = presentRun(run, { started: true });
  assert.ok(view.hand.every(Boolean), "aucune carte vide dans la vue");
  assert.equal(view.parc.length, run.parc.size);
});
