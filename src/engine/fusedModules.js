// Modules fusionnés (2.0) et spécialisations A/B du niveau 3.

import { aboveBelow, columnMates } from "./grid.js";
import { moduleFamilies } from "./hybrids.js";
import { MODULES } from "./modules.js";
import { round2 } from "./util.js";

export const isServerAt = (e, t) => e[t]?.defId === "server";

export const FUSED_MODULES = {
  server: {
    name: "Datacenter",
    flavor: "Climatisé à 18 °C. Le badge d’accès est en panne.",
    usesNeighbors: true,
    text: "Produit +25 Compute, et +5 de plus pour chaque Serveur voisin (diagonales comprises).",
    preview: "+25 ⚡ (+5/Serveur)",
    produce: (e) => ({
      compute: 25 + 5 * [...e.neighbors(), ...e.diagonals()].filter((o) => isServerAt(e.board, o)).length,
    }),
  },
  micro: {
    name: "Plateforme Microservices",
    flavor: "312 services, un seul développeur d’astreinte.",
    usesNeighbors: true,
    text: "Produit +8 Compute, et +8 de plus pour chaque module voisin, quel que soit son type.",
    preview: "+8 ⚡ (+8/voisin)",
    produce: (e) => ({ compute: 8 + 8 * e.neighbors().length }),
  },
  api: {
    name: "API Gateway",
    flavor: "Une porte d’entrée unique. Avec un videur.",
    usesNeighbors: false,
    text: "Consomme 1 Data pour produire +28 Compute. Sans Data : +8 Compute quand même.",
    preview: "1◆ → +28 ⚡",
    produce: (e) => ({ compute: e.consumeData(1) ? 28 : 8 }),
  },
  gpu: {
    name: "Ferme de GPU",
    flavor: "On a dû déménager pour faire de la place.",
    usesNeighbors: false,
    text: "Dépense 2 $ pour produire +75 Compute. Sans Budget : +12 Compute quand même.",
    preview: "2$ → +75 ⚡",
    produce: (e) => ({ compute: e.consumeBudget(2) ? 75 : 12 }),
  },
  lambda: {
    name: "Edge Functions",
    flavor: "Du code qui s’exécute partout, sauf sur ta machine.",
    usesNeighbors: false,
    text: "Produit +6 Compute, et +7 de plus par emplacement ouvert vide.",
    preview: "+6 ⚡ (+7/vide)",
    produce: (e) => ({ compute: 6 + 7 * e.emptyOpenSlots() }),
  },
  database: {
    name: "Data Lake",
    flavor: "Personne ne sait ce qu’il contient. Il grossit quand même.",
    usesNeighbors: false,
    text: "Ajoute +8 Data, puis +0.5 Scale par tranche de 10 Data en stock.",
    preview: "+8 ◆, +0.5 × /10◆",
    produce: (e) => ({ data: 8, scale: 0.5 * Math.floor((e.dataStock() + 8) / 10) }),
  },
  analytics: {
    name: "Business Intelligence",
    flavor: "Le tableau de bord que le PDG ouvre une fois par trimestre.",
    usesNeighbors: false,
    text: "Consomme 2 Data pour ajouter +3.5 Scale. Sans Data : +1 Scale quand même.",
    preview: "2◆ → +3.5 ×",
    produce: (e) => ({ scale: e.consumeData(2) ? 3.5 : 1 }),
  },
  search: {
    name: "Moteur de Recherche",
    flavor: "Indexe le web entier. Et tes brouillons.",
    usesNeighbors: false,
    text: "Produit +3 Compute par Data en stock, sans la consommer.",
    preview: "+3 ⚡ /◆ stock",
    produce: (e) => ({ compute: 3 * Math.max(0, e.dataStock()) }),
  },
  backup: {
    name: "Réplication Multi-Région",
    flavor: "Tes données existent dans 6 pays. Bon courage pour les supprimer.",
    usesNeighbors: false,
    text: "Ajoute +3 Data et +0.5 Scale par module Stockage sur le plateau.",
    preview: "+3◆ +0.5× /Stockage",
    produce: (e) => {
      let t = e.familyCount("stockage");
      return { data: 3 * t, scale: 0.5 * t };
    },
  },
  cdn: {
    name: "Edge Network",
    flavor: "Des serveurs jusque dans les frigos connectés.",
    usesNeighbors: true,
    text: "Ajoute +1 Scale par module voisin, diagonales comprises.",
    preview: "+1 × /voisin (+diag.)",
    produce: (e) => ({ scale: e.neighbors().length + e.diagonals().length }),
  },
  firewall: {
    name: "Zero Trust",
    flavor: "Personne n’a confiance en personne. Ça marche étonnamment bien.",
    usesNeighbors: false,
    text: "Ajoute +1.5 Scale par module Réseau sur le plateau.",
    preview: "+1.5 × /Réseau",
    produce: (e) => ({ scale: 1.5 * e.familyCount("reseau") }),
  },
  balancer: {
    name: "Service Mesh",
    flavor: "Tout le monde parle à tout le monde. Par proxy.",
    usesNeighbors: true,
    text: "Réactive 2 fois chaque module producteur voisin, diagonales comprises.",
    preview: "↺ producteurs voisins ×2",
    run: (e) => {
      let t = [...e.neighbors(), ...e.diagonals()].sort((o, a) => o - a).filter((o) => {
        let a = e.board[o];
        return a !== null && MODULES[a.defId].kind === "producer";
      });
      if (t.length) {
        e.retrigger(t, 2 + e.retryBonus);
      }
    },
  },
  dns: {
    name: "Anycast",
    flavor: "La même adresse, partout à la fois.",
    usesNeighbors: true,
    text: "Réactive 2 fois tous les autres modules de sa colonne.",
    preview: "↺ colonne ×2",
    run: (e) => {
      let t = columnMates(e.board, e.slot);
      if (t.length) {
        e.retrigger(t, 2 + e.retryBonus);
      }
    },
  },
  saas: {
    name: "Licence Entreprise",
    flavor: "Facturée au siège. Même pour les sièges vides.",
    usesNeighbors: false,
    text: "Rapporte +4 $, puis +1 Scale par tranche de 10 $ en caisse.",
    preview: "+4 $, +1 × /10$",
    produce: (e) => ({ budget: 4, scale: Math.max(0, Math.floor((e.budget() + 4) / 10)) }),
  },
  adserver: {
    name: "Pub Programmatique",
    flavor: "Elle sait ce que tu veux acheter avant toi.",
    usesNeighbors: true,
    text: "Rapporte +2 $ et +6 Compute par module voisin, diagonales comprises.",
    preview: "+2$ +6⚡ /voisin (+diag.)",
    produce: (e) => {
      let t = e.neighbors().length + e.diagonals().length;
      return { budget: 2 * t, compute: 6 * t };
    },
  },
  marketplace: {
    name: "Super App",
    flavor: "Messagerie, banque, taxi et horoscope. Dans la même appli.",
    usesNeighbors: false,
    text: "Ajoute +1.5 Scale et +1 $ par module Business sur le plateau.",
    preview: "+1.5× +1$ /Business",
    produce: (e) => {
      let t = e.familyCount("business");
      return { scale: 1.5 * t, budget: t };
    },
  },
  cache: {
    name: "Cache Distribué",
    flavor: "Invalidé partout à la fois. En théorie.",
    usesNeighbors: false,
    text: "Les 2 prochains modules producteurs produisent ×3. S’additionne avec les autres Caches.",
    preview: "2 suivants ×3",
    run: (e) => e.armBoost(3, 2),
  },
  worker: {
    name: "Orchestrateur",
    flavor: "Il ne travaille pas. Il fait travailler les autres.",
    usesNeighbors: false,
    text: "Réactive les 2 modules placés juste avant lui, 2 fois chacun.",
    preview: "↺ 2 précédents ×2",
    run: (e) => {
      let t = [];
      for (let o = e.slot - 1; o >= 0 && t.length < 2; o--) {
        if (e.board[o]) {
          t.push(o);
        }
      }
      if (t.length) {
        e.retrigger(t.reverse(), 2 + e.retryBonus);
      }
    },
  },
  queue: {
    name: "Event Bus",
    flavor: "Tout est un événement. Même ce message.",
    usesNeighbors: false,
    text: "Les 4 prochains modules producteurs activés seront réactivés 2 fois.",
    preview: "↺ 4 suivants ×2",
    run: (e) => e.armQueue(4, 2),
  },
  monitoring: {
    name: "Observabilité",
    flavor: "On voit tout. On ne comprend rien. Mais on voit tout.",
    usesNeighbors: false,
    text: "Ajoute +0.3 Scale par activation déjà effectuée pendant ce déploiement.",
    preview: "+0.3 × /activation",
    produce: (e) => ({ scale: round2(0.3 * e.activationCount()) }),
  },
};

export const previousSlots = (e, t, o) => {
  let a = [];
  for (let r = t - 1; r >= 0 && a.length < o; r--) {
    if (e[r]) {
      a.push(r);
    }
  }
  return a.reverse();
};

export const BRANCHES = {
  server: {
    A: {
      name: "Haute fréquence",
      text: "Produit +20 Compute.",
      preview: "+20 ⚡",
      produce: () => ({ compute: 20 }),
    },
    B: {
      name: "Mutualisé",
      text: "Produit +14 Compute et +2 $.",
      preview: "+14 ⚡ +2 $",
      produce: () => ({ compute: 14, budget: 2 }),
    },
  },
  micro: {
    A: {
      name: "Essaim",
      text: "Produit +4 Compute, et +8 de plus pour chaque Microservice voisin.",
      preview: "+4 ⚡ (+8/Micro)",
      usesNeighbors: true,
      produce: (e) => ({ compute: 4 + 8 * e.neighbors().filter((t) => e.board[t]?.defId === "micro").length }),
    },
    B: {
      name: "Polyglotte",
      text: "Produit +4 Compute, et +5 de plus pour chaque module voisin, quel que soit son type.",
      preview: "+4 ⚡ (+5/voisin)",
      usesNeighbors: true,
      produce: (e) => ({ compute: 4 + 5 * e.neighbors().length }),
    },
  },
  api: {
    A: {
      name: "REST",
      text: "Consomme 1 Data pour produire +26 Compute. Sans Data : rien.",
      preview: "1◆ → +26 ⚡",
      produce: (e) => e.consumeData(1) ? { compute: 26 } : null,
    },
    B: {
      name: "Webhook",
      text: "Si une Base de données est voisine : +20 Compute sans consommer de Data. Sans Base voisine : rien.",
      preview: "+20 ⚡ (Base voisine)",
      usesNeighbors: true,
      produce: (e) => e.neighbors().some((t) => e.board[t]?.defId === "database") ? { compute: 20 } : null,
    },
  },
  gpu: {
    A: {
      name: "Turbo",
      text: "Dépense 2 $ pour produire +70 Compute. Sans Budget : rien.",
      preview: "2$ → +70 ⚡",
      produce: (e) => e.consumeBudget(2) ? { compute: 70 } : null,
    },
    B: {
      name: "Instance spot",
      text: "Produit +20 Compute sans rien dépenser.",
      preview: "+20 ⚡ gratuit",
      produce: () => ({ compute: 20 }),
    },
  },
  lambda: {
    A: {
      name: "Scale-to-zero",
      text: "Produit +2 Compute, et +6 de plus par emplacement ouvert vide.",
      preview: "+2 ⚡ (+6/vide)",
      produce: (e) => ({ compute: 2 + 6 * e.emptyOpenSlots() }),
    },
    B: {
      name: "Event-driven",
      text: "Produit +5 Compute, mais +25 quand il est réactivé.",
      preview: "+5 ⚡ / ↺ +25 ⚡",
      produce: (e) => ({ compute: e.isRetrigger ? 25 : 5 }),
    },
  },
  database: {
    A: {
      name: "Volume",
      text: "Ajoute +7 Data à ton stock.",
      preview: "+7 ◆",
      produce: () => ({ data: 7 }),
    },
    B: {
      name: "Relationnelle",
      text: "Ajoute +4 Data, et produit +4 Compute par module Calcul voisin.",
      preview: "+4 ◆ +4⚡/Calcul",
      usesNeighbors: true,
      produce: (e) => ({
        data: 4,
        compute: 4 * e.neighbors().filter((t) => e.board[t] && moduleFamilies(e.board[t]).includes("calcul")).length,
      }),
    },
  },
  analytics: {
    A: {
      name: "Big Data",
      text: "Consomme 4 Data pour ajouter +5 Scale. Sans Data : rien.",
      preview: "4◆ → +5 ×",
      produce: (e) => e.consumeData(4) ? { scale: 5 } : null,
    },
    B: {
      name: "Temps réel",
      text: "Consomme 1 Data pour ajouter +2.5 Scale. Sans Data : rien.",
      preview: "1◆ → +2.5 ×",
      produce: (e) => e.consumeData(1) ? { scale: 2.5 } : null,
    },
  },
  search: {
    A: {
      name: "Plein texte",
      text: "Produit +3 Compute par Data en stock, sans la consommer.",
      preview: "+3 ⚡ /◆ stock",
      produce: (e) => ({ compute: 3 * Math.max(0, e.dataStock()) }),
    },
    B: {
      name: "Sémantique",
      text: "Ajoute +1 Scale par tranche de 10 Data en stock, sans la consommer.",
      preview: "+1 × /10◆ stock",
      produce: (e) => ({ scale: Math.floor(Math.max(0, e.dataStock()) / 10) }),
    },
  },
  backup: {
    A: {
      name: "Snapshot",
      text: "Ajoute +3 Data par module Stockage sur le plateau (elle comprise).",
      preview: "+3 ◆ /Stockage",
      produce: (e) => ({ data: 3 * e.familyCount("stockage") }),
    },
    B: {
      name: "Archivage global",
      text: "Ajoute +1 Data par module sur le plateau, toutes familles.",
      preview: "+1 ◆ /module",
      produce: (e) => ({ data: e.board.filter(Boolean).length }),
    },
  },
  cdn: {
    A: {
      name: "Edge",
      text: "Ajoute +1.2 Scale pour chaque module voisin.",
      preview: "+1.2 × /voisin",
      usesNeighbors: true,
      produce: (e) => ({ scale: round2(1.2 * e.neighbors().length) }),
    },
    B: {
      name: "Vitrine",
      text: "Ajoute +0.8 Scale par module voisin, et ses voisins Business produisent ×1.5.",
      preview: "+0.8 × /voisin, Business ×1.5",
      usesNeighbors: true,
      produce: (e) => ({ scale: round2(0.8 * e.neighbors().length) }),
      aura: (e) => (e.families ?? [e.family]).includes("business") ? 1.5 : 1,
    },
  },
  firewall: {
    A: {
      name: "Strict",
      text: "Ajoute +1.2 Scale par module Réseau sur le plateau (lui compris).",
      preview: "+1.2 × /Réseau",
      produce: (e) => ({ scale: round2(1.2 * e.familyCount("reseau")) }),
    },
    B: {
      name: "Filtrage",
      text: "Ajoute +0.8 Scale par module Réseau, et ses voisins ignorent les pannes et les interdictions du client.",
      preview: "+0.8 × /Réseau, protège",
      usesNeighbors: true,
      shields: true,
      produce: (e) => ({ scale: round2(0.8 * e.familyCount("reseau")) }),
    },
  },
  balancer: {
    A: {
      name: "Sticky sessions",
      text: "Réactive 3 fois son meilleur voisin producteur (le plus haut niveau, puis le plus petit numéro).",
      preview: "↺ meilleur voisin ×3",
      usesNeighbors: true,
      run: (e) => {
        let t = e.neighbors().filter((o) => e.board[o] && MODULES[e.board[o].defId].kind === "producer").sort((o, a) => (e.board[a].fused ? 4 : e.board[a].level) - (e.board[o].fused ? 4 : e.board[o].level)
          || o - a)[0];
        if (t !== undefined) {
          e.retrigger([t], 3 + e.retryBonus);
        }
      },
    },
    B: {
      name: "Global",
      text: "Réactive chaque module producteur voisin, diagonales comprises.",
      preview: "↺ voisins + diagonales",
      usesNeighbors: true,
      run: (e) => {
        let t = [...e.neighbors(), ...e.diagonals()].sort((o, a) => o - a).filter((o) => e.board[o] && MODULES[e.board[o].defId].kind === "producer");
        if (t.length) {
          e.retrigger(t, 1 + e.retryBonus);
        }
      },
    },
  },
  dns: {
    A: {
      name: "TTL court",
      text: "Réactive 3 fois les modules situés juste au-dessus et juste en dessous.",
      preview: "↺ dessus + dessous ×3",
      usesNeighbors: true,
      run: (e) => {
        let { above, below } = aboveBelow(e.board, e.slot);
        let a = [above, below].filter((r) => r >= 0);
        if (a.length) {
          e.retrigger(a, 3 + e.retryBonus);
        }
      },
    },
    B: {
      name: "Round-robin",
      text: "Réactive 2 fois les modules juste au-dessus et juste en dessous, et une fois le reste de sa colonne.",
      preview: "↺ colonne (voisins ×2)",
      usesNeighbors: true,
      run: (e) => {
        let { above, below } = aboveBelow(e.board, e.slot);
        let a = [above, below].filter((n) => n >= 0);
        let r = columnMates(e.board, e.slot).filter((n) => !a.includes(n));
        if (a.length) {
          e.retrigger(a, 2 + e.retryBonus);
        }
        if (r.length) {
          e.retrigger(r, 1 + e.retryBonus);
        }
      },
    },
  },
  saas: {
    A: {
      name: "Premium",
      text: "Rapporte +5 $ de Budget.",
      preview: "+5 $",
      produce: () => ({ budget: 5 }),
    },
    B: {
      name: "Freemium",
      text: "Rapporte +1 $ et ajoute +0.5 Scale par module Business sur le plateau.",
      preview: "+1 $, +0.5 × /Business",
      produce: (e) => ({ budget: 1, scale: round2(0.5 * e.familyCount("business")) }),
    },
  },
  adserver: {
    A: {
      name: "Retargeting",
      text: "Rapporte +3 $ par module voisin.",
      preview: "+3 $ /voisin",
      usesNeighbors: true,
      produce: (e) => ({ budget: 3 * e.neighbors().length }),
    },
    B: {
      name: "Native ads",
      text: "Produit +10 Compute par module voisin, mais plus aucun $.",
      preview: "+10 ⚡ /voisin",
      usesNeighbors: true,
      produce: (e) => ({ compute: 10 * e.neighbors().length }),
    },
  },
  marketplace: {
    A: {
      name: "Commission",
      text: "Ajoute +1.5 Scale par module Business sur le plateau (elle comprise).",
      preview: "+1.5 × /Business",
      produce: (e) => ({ scale: round2(1.5 * e.familyCount("business")) }),
    },
    B: {
      name: "Écosystème",
      text: "Ajoute +0.5 Scale par module sur le plateau, toutes familles.",
      preview: "+0.5 × /module",
      produce: (e) => ({ scale: round2(0.5 * e.board.filter(Boolean).length) }),
    },
  },
  cache: {
    A: {
      name: "Large",
      text: "Le prochain module producteur activé après lui produit ×4.",
      preview: "suivant ×4",
      run: (e) => e.armBoost(4),
    },
    B: {
      name: "Multi-niveau",
      text: "Les 2 prochains modules producteurs activés après lui produisent ×2.5.",
      preview: "2 suivants ×2.5",
      run: (e) => e.armBoost(2.5, 2),
    },
  },
  worker: {
    A: {
      name: "Burst",
      text: "Réactive 4 fois le module placé juste avant lui (numéro inférieur).",
      preview: "↺ précédent ×4",
      run: (e) => {
        let t = previousSlots(e.board, e.slot, 1);
        if (t.length) {
          e.retrigger(t, 4 + e.retryBonus);
        }
      },
    },
    B: {
      name: "Pool",
      text: "Réactive une fois chacun des 3 modules placés juste avant lui.",
      preview: "↺ 3 précédents",
      run: (e) => {
        let t = previousSlots(e.board, e.slot, 3);
        if (t.length) {
          e.retrigger(t, 1 + e.retryBonus);
        }
      },
    },
  },
  queue: {
    A: {
      name: "Haute capacité",
      text: "Les 5 prochains modules producteurs activés seront réactivés une fois.",
      preview: "↺ 5 suivants",
      run: (e) => e.armQueue(5, 1),
    },
    B: {
      name: "Prioritaire",
      text: "Les 2 prochains modules producteurs activés seront réactivés 2 fois.",
      preview: "↺ 2 suivants ×2",
      run: (e) => e.armQueue(2, 2),
    },
  },
  monitoring: {
    A: {
      name: "Dashboards",
      text: "Ajoute +0.3 Scale par activation déjà effectuée pendant ce déploiement.",
      preview: "+0.3 × /activation",
      produce: (e) => ({ scale: round2(0.3 * e.activationCount()) }),
    },
    B: {
      name: "Alerting",
      text: "Ajoute +0.6 Scale par réactivation déjà effectuée pendant ce déploiement.",
      preview: "+0.6 × /réactivation",
      produce: (e) => ({ scale: round2(0.6 * e.retriggerCount()) }),
    },
  },
};
