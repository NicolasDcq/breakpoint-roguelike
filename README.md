# Breakpoint

Roguelike deckbuilder en français, jouable dans le navigateur (d'abord sur téléphone). Thème infrastructure informatique, inspiré de Balatro avec une identité « carte mère » : on pose des modules sur un plateau 5×5, on les déploie, et on doit atteindre l'objectif de chaque contrat.

## Démarrer

Il faut Node.js 22 ou plus récent.

```bash
npm install
npm run dev        # http://localhost:5173, recharge à chaque modification
npm test           # tests du moteur, dont 96 parties de référence
npm run build      # version de production dans dist/
```

`npm run build:single` produit un `dist/index.html` autonome (tout dans un seul fichier), pratique pour un artifact ou une page itch.io.

## Mise en ligne (Vercel)

Le dépôt est prêt pour Vercel, réglages compris (`vercel.json`) :

1. Sur vercel.com, **Add New → Project**, puis choisir ce dépôt GitHub.
2. Laisser les réglages proposés : Vercel lit `vercel.json` (installation, `npm test && npm run build`, dossier `dist`).
3. Chaque push sur `main` met le jeu en ligne. Chaque autre branche ou pull request reçoit sa propre adresse de prévisualisation.

Si un test échoue, le déploiement est bloqué et la version en ligne ne change pas.

Les sauvegardes des joueurs sont stockées dans leur navigateur, **par adresse**. Une fois la bêta ouverte, il faut garder la même adresse (ou le même domaine), sinon les parties en cours sont perdues.

## Organisation du code

```
src/
  engine/      moteur pur, sans React ni navigateur : règles, déploiement, reducer
  save/        sauvegarde de la partie et du profil (localStorage)
  audio/       sons chiptune générés (Web Audio)
  ui/          interface React : plateau, boutique, écrans, fiches
  tutorial/    tutoriel avec Loup Niel
  styles/      feuilles de style, chargées dans l'ordre de styles/index.css
  main.jsx     point d'entrée
tests/         tests (node:test) et joueur automatique
docs/          notes de conception et historique
tools/         scripts annexes (dessin de Loup Niel)
scripts/       construction et serveur de développement (esbuild)
```

Règle principale : **`src/engine` ne dépend jamais de l'interface.** Le moteur se teste et se simule en ligne de commande, sans navigateur. Toute la partie passe par une seule fonction, `runReducer(état, action)` (`src/engine/reducer.js`), et un déploiement est calculé par `executeDeploy` (`src/engine/deploy.js`).

Le hasard passe toujours par `Rng` (`src/engine/rng.js`), un générateur à graine : la même graine donne la même partie.

## Tests

- `tests/engine.test.js` : plateau, hasard, catalogue, nouvelle partie, déploiement, sauvegarde, profil.
- `tests/golden.test.js` : un joueur automatique (`tests/support/player.js`) joue 96 parties (8 entreprises, 8 difficultés, mode infini) et l'empreinte de chaque état est comparée à la référence `tests/golden/v85.json`.

Après un changement de règles **voulu**, le test de référence échouera, c'est normal. On régénère alors la référence avec `node tests/support/update-golden.js` et on explique le changement dans le commit.

## Historique

Jusqu'à la v85 (17/10/2026), le jeu était développé directement dans un artifact claude.ai sous forme d'un seul fichier compilé, et les sources d'origine ont été perdues. Ce dépôt a été reconstruit à partir de ce fichier :

- découpage en 65 fichiers, noms lisibles, retour au JSX ;
- vérification que le moteur reconstruit joue **exactement** comme l'original (96 parties, 9 461 états comparés, aucune différence) ;
- vérification visuelle : 166 captures comparées au pixel près (4 tailles d'écran, 7 moments de partie, tutoriel, déploiement, menus), aucune différence.

Les noms courts de l'ancienne version (`wn`, `RwM`, `PbCalc`…) cités dans les notes sont traduits dans [docs/correspondance-des-noms.md](docs/correspondance-des-noms.md). Une partie des variables locales a encore des noms d'une ou deux lettres : on les renomme au fur et à mesure qu'on retouche chaque fichier.

Notes de conception : [docs/etat-et-decisions.md](docs/etat-et-decisions.md) (le plus récent) et [docs/premiere-conversation.md](docs/premiere-conversation.md).
