// Les commandes du Terminal : des consommables à usage unique, façon tarots de Balatro.
// Le joueur en garde 2 au plus. Toutes coûtent le même prix, et il n'y a pas de rareté.
// Chaque commande dit dans quelle étape elle s'utilise (`phases`) et si elle vise des modules :
// `targets: { min, max }` tire une main de modules du parc, et le joueur en choisit entre min et max.
// Les effets sont dans `run/commandEffects.js` (ils changent la partie, donc ils passent par `Run`).

import { Phase } from "../run/Phase.js";

// Toutes les commandes s'utilisent depuis l'écran de jeu (pendant un contrat) et à la boutique,
// sauf ping et ssh : leur bonus ne vaut que pour le contrat en cours.
const IN_CONTRACT = [Phase.PLAY];
const ANYTIME = [Phase.PLAY, Phase.SHOP];

const DEFINITIONS = {
  ping: { name: "ping", text: "+1 déploiement pour le contrat en cours.", phases: IN_CONTRACT },
  ssh: { name: "ssh", text: "+1 module posé sur le plateau, pour le contrat en cours.", phases: IN_CONTRACT },
  "!!": { name: "!!", text: "Rejoue la dernière commande utilisée.", phases: ANYTIME, repeats: true },
  "ln -s": { name: "ln -s", text: "Un module compte comme n'importe quel autre pour les architectures, jusqu'à la fin du contrat.", phases: ANYTIME, targets: { min: 1, max: 1 } },
  cp: { name: "cp", text: "Copie un module du parc (la copie est de niveau 1).", phases: ANYTIME, targets: { min: 1, max: 1 } },
  rm: { name: "rm", text: "Supprime jusqu'à 2 modules du parc.", phases: ANYTIME, targets: { min: 1, max: 2 } },
  motherlode: { name: "motherlode", text: "Double ton argent, +20 $ au plus.", phases: ANYTIME },
  mysqldump: { name: "mysqldump", text: "Double ta Data, +10 ◆ au plus.", phases: ANYTIME },
  "apt upgrade": { name: "apt upgrade", text: "+1 niveau à l'architecture la plus jouée de la partie.", phases: ANYTIME },
};

export const COMMANDS = Object.freeze(Object.fromEntries(Object.entries(DEFINITIONS).map(([id, command]) => [id, Object.freeze({ id, ...command })])));
export const COMMAND_IDS = Object.keys(COMMANDS);
