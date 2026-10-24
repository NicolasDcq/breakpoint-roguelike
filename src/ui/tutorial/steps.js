// Le scénario du tutoriel : une liste d'étapes. Ajouter une étape = ajouter une entrée ici.
// phase : où l'étape s'affiche · when : condition en plus · target : zone éclairée (sélecteurs CSS)
// interactive : le joueur peut agir dans la zone éclairée · done : fin automatique (sinon bouton « Suivant »).

import { ARCHITECTURE_BY_ID, Phase, RULES } from "../../domain/index.js";

const archName = (view) => ARCHITECTURE_BY_ID[view.preview.architecture.id].name;
const hasPack = (id) => (view) => view.packSlots.some((slot) => slot.packId === id && !slot.sold);

export const TUTORIAL_STEPS = [
  { id: "objectif", phase: Phase.PLAY, target: [".topbar .contract"], pose: "explique",
    text: () => `Voilà ton <b>contrat</b> : atteins l’<b>objectif de Performance</b> avec <b>${RULES.deploysPerContract} déploiements</b> et <b>${RULES.discardsPerContract} défausses</b>. Un contrat livré te rapporte de l’argent.` },
  { id: "poser", phase: Phase.PLAY, target: [".board", ".hand-row"], interactive: true, pose: "explique",
    done: (view) => view.placedCount >= 2,
    text: () => "Pose <b>deux modules identiques</b> de ta main sur le plateau : touche-en un puis une case, ou glisse-le. Ils s’activent dans l’<b>ordre des numéros</b>." },
  { id: "familles", phase: Phase.PLAY, target: [".fam-bar", ".hand-row"], pose: "explique",
    text: () => "Il y a <b>5 familles</b> : Calcul (le <b>Compute</b>), Stockage (<b>Data</b>), Réseau, Business (<b>$</b>) et Ops (réactive les autres). Seul le Calcul fait du Compute." },
  { id: "architecture", phase: Phase.PLAY, target: [".arch-line"], pose: "bravo",
    text: (view) => `Tes modules forment une architecture : <b>${archName(view)}</b>. C’est la <b>base</b> du score, comme une main au poker.` },
  { id: "neuf", phase: Phase.PLAY, target: [".arch-line"], pose: "surpris",
    text: () => "Il y a <b>9 architectures</b> : Monolithe, Redondance, Cluster, Double redondance, Haute dispo, Full-stack, Stack, Ferme de serveurs, Datacenter. Plus elle est rare, plus sa <b>base</b> est forte. Touche cette ligne pour voir la liste." },
  { id: "formule", phase: Phase.PLAY, target: [".score-panel .formula"], pose: "explique",
    text: () => "<b>Compute × Scale</b> = ton score du déploiement. Les modules ajoutent du Compute ou du Scale ; les scores de chaque déploiement s’additionnent." },
  { id: "defausser", phase: Phase.PLAY, target: [".discard-btn"], pose: "reflechit",
    text: () => `Pas la bonne main ? <b>Défausse</b> pour viser une autre architecture. Tu as ${RULES.discardsPerContract} défausses par contrat.` },
  { id: "ameliorer", phase: Phase.PLAY, target: [".hand-row"], pose: "reflechit",
    text: () => `Touche un module : avec de la <b>Data ◆</b> (${RULES.cardUpgradeCost[1]} puis ${RULES.cardUpgradeCost[2]}) tu le passes <b>niveau 2 puis 3</b>. Il garde son niveau toute la partie.` },
  { id: "deployer", phase: Phase.PLAY, target: [".board", ".hand-row", ".deploy-row"], interactive: true, pose: "alerte",
    text: () => "<b>Déploie !</b> Si l’objectif n’est pas atteint, pose d’autres modules (jusqu’à 5) et déploie encore." },

  { id: "paie", phase: Phase.WON, target: [".end-modal"], interactive: true, pose: "bravo",
    text: () => "<b>Contrat livré !</b> Tu touches la <b>paie</b>, plus un bonus par déploiement non utilisé. Passe à la <b>boutique</b>." },

  { id: "arrivage", phase: Phase.SHOP, target: [".pack-arrivage"], pose: "explique",
    text: () => "L’<b>arrivage</b> : <b>2 emplacements</b> tirés au hasard parmi 4 paquets. Le <b>Colis</b> donne des modules, le <b>Booster de plans</b> monte une architecture, les <b>Packs de Plugins</b> donnent des Plugins. Tu gardes une carte par paquet." },
  { id: "booster", phase: Phase.SHOP, when: hasPack("booster"), target: [".pack-arrivage"], pose: "bravo",
    text: () => "Un <b>Booster de plans</b> est là ! Tu en gardes un et cette architecture gagne <b>+1 niveau</b> (base et gain plus forts). C’est <b>le</b> moyen de monter les architectures." },
  { id: "plugins", phase: Phase.SHOP, target: [".shop-jokers"], pose: "explique",
    text: () => `Les <b>Plugins</b> jouent à la fin de chaque déploiement, de gauche à droite (tu peux les glisser pour changer l’ordre). Cinq raretés : <b>gris, vert, bleu, violet, doré</b>. Plus c’est rare, plus c’est cher. ${RULES.maxPlugins} emplacements ; la revente rend la moitié.` },
  { id: "services", phase: Phase.SHOP, target: [".shop-services", ".fu-parc"], pose: "cafe",
    text: (view) => `<b>Retirer</b> un module (${view.removePrice} $) affine ton parc. <b>Relancer</b> (${view.rerollPrice} $) renouvelle les Plugins en vente, pas l’arrivage. Le <b>Parc</b> montre tous tes modules.` },
  { id: "suivant", phase: Phase.SHOP, target: [".fu-next"], interactive: true, pose: "salut",
    text: () => "Quand tu es prêt, passe au <b>contrat suivant</b>. Tes achats restent pour toute la partie." },

  { id: "fin", phase: Phase.PLAY, when: (view) => view.contractIndex >= 1, target: [], pose: "bravo", last: true,
    text: (view) => `Bravo, tu sais jouer ! Il faut livrer les <b>${view.contractCount} contrats</b> pour gagner, avec des <b>boss</b> qui changent une règle. Tu lances une <b>vraie partie</b> ?` },
];
