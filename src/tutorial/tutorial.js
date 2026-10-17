// Tutoriel : partie d'entraînement et étapes.

import { randomSeed } from "../engine/rng.js";
import { newRun } from "../engine/run.js";
import { loadRun } from "../save/storage.js";

const TUTO_SEED = 424242;

// Objectif de chaque contrat d’entraînement (le même pour A, B et C).
const TUTO_TARGET = 10;

const TUTO_KEY = "breakpoint.tutoDone";

export function isTutorialDone() {
  try {
    return localStorage.getItem(TUTO_KEY) === "1";
  } catch (e) {
    return false;
  }
}

export function setTutorialDone() {
  try {
    localStorage.setItem(TUTO_KEY, "1");
  } catch (e) { }
}

function tutoFamilies() {
  var F = [
    ["#3ee6f0", "Calcul", "Compute"],
    ["#b99bff", "Stockage", "Data"],
    ["#ff6b9a", "Réseau", "Scale"],
    ["#ffb020", "Business", "$"],
    ["#2bd96b", "Ops", "réactive les autres"],
  ];
  return "<span class=\"tz-fams\">" + F.map(function(f2) {
    return "<span class=\"tz-fam\" style=\"background:" + f2[0] + "\">" + f2[1] + " → " + f2[2] + "</span>";
  }).join("") + "</span>";
}

export function startTutorial() {
  var st2 = newRun(TUTO_SEED, 1, false, "startup");
  st2 = {
    ...st2,
    tuto: true,
    phase: "build",
    starterChoices: [],
    jokers: [{ uid: "j1", defId: "intern", counter: 0 }],
    contracts: st2.contracts.map(function(c, i) {
      // Objectif fixe et atteignable : la partie d’entraînement explique, elle ne fait pas grinder.
      return i < 3 ? { ...c, target: TUTO_TARGET } : c;
    }),
    notice: { text: "Partie d’entraînement : rien n’est enregistré.", tone: "info", id: 1 },
  };
  return st2;
}

export function endTutorial() {
  var k = null;
  try {
    k = loadRun();
  } catch (e) { }
  return k || newRun(randomSeed());
}

function sumFamilyLevels(t) {
  var s2 = 0;
  var f2 = t.familyLevels || {};
  for (var k in f2) {
    s2 += f2[k] | 0;
  }
  return s2;
}

function openSlotCount(t) {
  return t.unlocked.filter(Boolean).length;
}

export function tutoSnapshot(t) {
  return {
    board: t.board.map(function(m) {
      return m ? m.uid : null;
    }).join(","),
    bought: t.stats.modulesBought,
    lv: t.board.reduce(
      function(a, m) {
        return a + (m ? m.level : 0);
      },
      0,
    ),
    fam: sumFamilyLevels(t),
    open: openSlotCount(t),
    fus: t.stats.fusions,
    jok: t.jokers.length,
    deps: t.stats.deploys,
  };
}

function fusionGift(t) {
  var b2 = [...t.board];
  var srv = [];
  b2.forEach(function(m, i2) {
    if (m && m.defId === "server" && !m.fused) {
      srv.push(i2);
    }
  });
  var free = [];
  t.unlocked.forEach(function(u, i2) {
    if (u && !b2[i2] && !(t.holes || []).includes(i2)) {
      free.push(i2);
    }
  });
  while (srv.length < 2 && free.length) {
    var i = free.shift();
    b2[i] = { uid: "tzg" + i, defId: "server", level: 1 };
    srv.push(i);
  }
  if (srv.length < 2) {
    for (var j = b2.length - 1; j >= 0 && srv.length < 2; j--) {
      if (b2[j] && b2[j].defId !== "server") {
        b2[j] = { uid: "tzg" + j, defId: "server", level: 1 };
        srv.push(j);
      }
    }
  }
  srv.slice(0, 2).forEach(function(i2) {
    var m = b2[i2];
    b2[i2] = { uid: m.uid, defId: "server", level: 3, ...m.edition ? { edition: m.edition } : {} };
  });
  return { board: b2, tzGift: true };
}

export const TUTO_STEPS = [
  {
    id: "hello",
    when: function(c) {
      return c.t.phase === "build" && c.t.contractIndex === 0;
    },
    pose: "salut",
    hero: true,
    text: function(c) {
      return "<b>Salut, et bienvenue chez " + c.co + " !</b> Moi c’est <b>Loup Niel</b>, le CTO. C’est moi qui t’ai recruté, alors ne me fais pas regretter.<br><br>Un client attend déjà son logiciel. On fait une partie d’entraînement ensemble : je te montre tout, rien n’est enregistré.";
    },
    next: "C’est parti",
  },
  {
    id: "goal",
    when: function(c) {
      return c.t.phase === "build" && c.t.contractIndex === 0;
    },
    target: [".contract", ".topbar"],
    pose: "explique",
    text: function(c) {
      return "Chaque <b>contrat</b> a un objectif de <b>Performance</b> : ici " + c.ce.target + ". Tu as <b>3 déploiements</b> pour l’atteindre, et leurs scores s’additionnent.";
    },
  },
  {
    id: "board",
    when: function(c) {
      return c.t.phase === "build" && c.t.contractIndex === 0;
    },
    target: [".board"],
    pose: "explique",
    text: "Voici ton <b>architecture</b>. À chaque déploiement, les modules s’activent <b>dans l’ordre des numéros</b>, de 1 à 25. L’ordre compte, crois-moi.",
  },
  {
    id: "fams",
    when: function(c) {
      return c.t.phase === "build" && c.t.contractIndex === 0;
    },
    target: [".fam-bar", ".board"],
    pose: "reflechit",
    text: function() {
      return "Chaque module appartient à une <b>famille</b>, et chaque famille produit quelque chose :" + tutoFamilies() + "Mélanger les familles, c’est tout l’art du métier.";
    },
  },
  {
    id: "sheet",
    when: function(c) {
      return c.t.phase === "build" && c.t.contractIndex === 0;
    },
    target: function(c) {
      return c.sel != null ? [".module-sheet", ".module-modal"] : [".board"];
    },
    pose: "explique",
    text: function(c) {
      return c.sel != null
        ? "Voilà sa <b>fiche</b> : ce qu’il produit, sa famille, son niveau. Quand tu l’as lue, passe à la suite."
        : "Touche un module pour ouvrir sa <b>fiche</b> : ce qu’il produit, sa famille, son niveau.";
    },
    // Pas de « done » : la fiche reste ouverte jusqu’à ce que le joueur passe à la suite (Suivant).
    action: function(c) {
      return c.sel != null ? null : "Touche un module du plateau";
    },
  },
  {
    id: "drag",
    when: function(c) {
      return c.t.phase === "build" && c.t.contractIndex === 0;
    },
    enter: function(c) {
      c.closeSel();
    },
    target: [".board"],
    pose: "explique",
    text: "Tu peux réorganiser ton plateau quand tu veux, entre deux déploiements. Le <b>Serveur</b> produit plus quand il touche un autre Serveur.",
    action: "Glisse un module sur une autre case",
    done: function(c, s2) {
      return c.t.board.map(function(m) {
        return m ? m.uid : null;
      }).join(",") !== s2.board;
    },
  },
  {
    id: "formula",
    when: function(c) {
      return c.t.phase === "build" && c.t.contractIndex === 0;
    },
    target: [".formula", ".score-panel"],
    pose: "explique",
    text: "Les modules produisent du <b>Compute</b> et du <b>Scale</b>. Ta Performance, c’est <b>Compute × Scale</b>. Le chiffre <b>prévu</b> te dit ce que donnera le prochain déploiement.",
  },
  {
    id: "deploy",
    when: function(c) {
      return c.t.phase === "build" && c.t.contractIndex === 0 && !c.anim;
    },
    target: ["button.deploy"],
    pose: "explique",
    text: "Ton <b>Stagiaire</b> (ton premier Plugin, en haut) donne +3 Compute aux modules de niveau 1. Allez, on met en prod !",
    action: "Appuie sur Déployer",
    done: function(c, s2) {
      return c.t.stats.deploys > s2.deps;
    },
  },
  {
    id: "money",
    when: function(c) {
      return c.shop && c.t.contractIndex === 1;
    },
    target: [".shop-wallet"],
    pose: "bravo",
    wait: function(c) {
      return c.t.phase === "reward"
        ? "Contrat livré ! Passe au contrat suivant."
        : c.t.phase === "build" && c.t.contractIndex === 0
          ? "Continue à déployer jusqu’à " + c.ce.target + " de Performance."
          : "Ouvre la Boutique pour continuer.";
    },
    text: "Contrat livré, bravo ! Le client a payé. Tu as deux monnaies : le <b>$</b> pour acheter, et la <b>Data ◆</b> pour améliorer tes modules.",
  },
  {
    id: "box",
    when: function(c) {
      return c.shop && c.t.contractIndex === 1;
    },
    target: [".pack-sheet.box-sheet", ".pack-arrivage"],
    pose: "explique",
    enter: function(c) {
      c.ensure({ budget: 16 });
    },
    text: "Ce <b>colis</b> contient 3 <b>Plugins</b> : des collègues qui boostent toute ton architecture. Tu en gardes un. Tes Plugins s’affichent en haut du plateau.",
    action: "Achète le colis, ouvre-le et garde un Plugin",
    wait: function() {
      return "Rouvre la Boutique pour acheter le colis.";
    },
    done: function(c) {
      return !!c.t.arrTaken?.[0] && !c.t.boxChoices?.length;
    },
  },
  {
    id: "buy",
    when: function(c) {
      return c.shop && c.t.contractIndex === 1 && !c.t.boxChoices?.length;
    },
    target: [".shop-modules"],
    pose: "explique",
    enter: function(c) {
      c.ensure({ budget: 10 });
    },
    text: "Les <b>modules</b> s’achètent ici. Un module acheté s’installe tout seul sur une case libre du plateau.",
    action: "Achète un module",
    wait: function() {
      return "Rouvre la Boutique pour acheter un module.";
    },
    done: function(c, s2) {
      return c.t.stats.modulesBought > s2.bought;
    },
  },
  {
    id: "unlock",
    when: function(c) {
      return c.t.phase === "build" && c.t.contractIndex === 1 && !c.t.boxChoices?.length;
    },
    target: function(c) {
      return c.shop ? [".fu-back"] : [".unlock-ask", ".board"];
    },
    pose: "explique",
    enter: function(c) {
      c.ensure({ budget: 8 });
    },
    text: function(c) {
      return c.shop
        ? "Pour agrandir ton plateau, retourne d’abord au plateau."
        : "Ton plateau peut grandir : touche une case <b>Ouvrir</b> qui touche une case déjà ouverte. Ça coûte quelques $.";
    },
    action: function(c) {
      return c.shop ? "Appuie sur Retour au plateau" : "Ouvre une case";
    },
    done: function(c, s2) {
      return openSlotCount(c.t) > s2.open;
    },
  },
  {
    id: "plugins",
    when: function(c) {
      return c.t.phase === "build" && c.t.contractIndex === 1 && !c.shop;
    },
    target: [".joker-rail", ".chip-row"],
    pose: "reflechit",
    text: "Tes <b>Plugins</b> agissent <b>de gauche à droite</b>, après les modules. Sur ordinateur, tu peux changer leur ordre et les vendre depuis leur carte.",
  },
  {
    id: "upgrade",
    when: function(c) {
      return c.t.phase === "build" && c.t.contractIndex === 1 && !c.shop && !c.anim;
    },
    target: function(c) {
      return c.sel != null ? [".mm-foot", ".module-sheet", ".module-modal"] : [".board"];
    },
    pose: "explique",
    enter: function(c) {
      c.ensure({ data: 12 });
    },
    text: "La <b>Data ◆</b> sert à <b>améliorer</b> un module : il produit plus à chaque niveau. Un module a 3 niveaux.",
    action: "Touche un module, puis Améliorer",
    done: function(c, s2) {
      return c.t.board.reduce(
        function(a, m) {
          return a + (m ? m.level : 0);
        },
        0,
      ) > s2.lv;
    },
  },
  {
    id: "playB",
    when: function(c) {
      return c.shop && c.t.contractIndex === 2;
    },
    target: [".pack-sheet:not(.box-sheet)", ".pack-arrivage"],
    pose: "explique",
    enter: function(c) {
      c.ensure({ budget: 12 });
    },
    wait: function(c) {
      return c.t.phase === "reward"
        ? "Contrat livré ! Passe au contrat suivant."
        : c.t.phase === "build" && c.t.contractIndex === 1
          ? "À toi : déploie jusqu’à " + c.ce.target + " de Performance."
          : "Ouvre la Boutique pour continuer.";
    },
    text: "Le <b>paquet de mises à jour</b> monte une <b>famille entière</b> d’un niveau, pour toute la partie : tous ses modules, même ceux que tu achèteras plus tard.",
    action: "Achète le paquet et choisis une famille",
    done: function(c, s2) {
      return sumFamilyLevels(c.t) > s2.fam && !c.t.packChoices?.length;
    },
  },
  {
    id: "drawer",
    when: function(c) {
      return c.t.phase === "build" && c.t.contractIndex === 2 && !c.shop;
    },
    target: [".drawer-row"],
    pose: "explique",
    text: "Le <b>tiroir</b> : tu y ranges un module en le glissant dedans. Il ne produit plus rien, mais tu le gardes pour plus tard. Pratique quand le plateau est plein.",
  },
  {
    id: "boss",
    when: function(c) {
      return c.t.phase === "build" && c.t.contractIndex === 2 && !c.shop;
    },
    target: [".rule-chip", ".contract", ".topbar"],
    pose: "alerte",
    text: "Le contrat <b>C</b> de chaque version a une <b>contrainte</b> : lis-la bien avant de déployer. Et à la fin de chaque version, ça se corse encore.",
  },
  {
    id: "reward",
    when: function(c) {
      return c.t.phase === "reward" && c.t.contractIndex === 2;
    },
    float: true,
    pose: "bravo",
    wait: function(c) {
      return "À toi : déploie jusqu’à " + c.ce.target + " de Performance.";
    },
    text: "Version 1 livrée ! Après chaque contrat C, tu choisis une <b>récompense</b> : un module, un Plugin, de l’argent, une case… Prends celle qui va avec ton plateau.",
  },
  {
    id: "goodies",
    when: function(c) {
      return c.shop && c.t.contractIndex === 3;
    },
    target: [".goodie-sheet"],
    pose: "explique",
    wait: function(c) {
      return c.t.phase === "reward"
        ? "Choisis ta récompense, puis passe au contrat suivant."
        : "Ouvre la Boutique pour continuer.";
    },
    text: "Les <b>goodies</b> : un seul proposé par version. Leur effet est <b>permanent</b> pour toute la partie, et ils ont un niveau 2.",
  },
  {
    id: "branch",
    when: function(c) {
      return c.t.phase === "build" && c.t.contractIndex === 3 && !c.shop;
    },
    enter: function(c) {
      if (!c.t.tzGift) {
        c.patch(fusionGift(c.t));
      }
    },
    target: function(c) {
      return c.sel != null ? [".mm-foot", ".module-sheet", ".module-modal"] : [".board"];
    },
    pose: "surpris",
    text: "Cadeau de bienvenue : j’ai passé <b>deux Serveurs au niveau 3</b> ! Au niveau 3, un module choisit une <b>spécialisation</b> : A ou B, deux façons de jouer.",
    action: "Touche un Serveur et choisis sa spécialisation",
    done: function(c) {
      return c.t.board.some(function(m) {
        return m && m.defId === "server" && m.level === 3 && m.branch;
      });
    },
  },
  {
    id: "fuse",
    when: function(c) {
      return c.t.phase === "build" && c.t.contractIndex === 3;
    },
    target: function(c) {
      return c.sel != null ? [".mm-foot", ".module-sheet", ".module-modal"] : [".fusion-btn"];
    },
    pose: "surpris",
    text: "Le meilleur pour la fin : deux modules <b>identiques au niveau 3</b> peuvent <b>fusionner</b> en un module <b>2.0</b>, bien plus fort. Et ça libère une case !",
    action: "Appuie sur Fusion et fusionne tes Serveurs",
    done: function(c, s2) {
      return c.t.stats.fusions > s2.fus;
    },
  },
  {
    id: "end",
    when: function(c) {
      return c.t.phase === "build" && !c.fusion;
    },
    wait: function() {
      return "Joli Datacenter ! Ferme cet écran pour finir.";
    },
    pose: "cafe",
    hero: true,
    text: "Tu connais tout l’essentiel ! Pour le reste, je passerai une tête la première fois que tu croiseras une nouveauté, et le bouton <b>?</b> garde les règles sous la main.<br><br>Maintenant, va lancer ta vraie partie. À toi de jouer !",
    next: "Terminer le tutoriel",
    finish: true,
  },
];
