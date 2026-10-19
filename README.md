# Breakpoint · Le Parc

Roguelike deckbuilder en français, jouable dans le navigateur (d'abord sur téléphone), sur le thème de l'infrastructure informatique.

Ton **parc** de modules est ton paquet de cartes. À chaque contrat, tu pioches une main, tu poses jusqu'à 5 modules sur le plateau 4×4 et tu déploies. Les modules posés forment une **architecture** (Redondance, Cluster, Full-stack…), comme une main au poker : elle donne la base du score, puis chaque module l'améliore.

**Jouer : https://breakpoint-roguelike.vercel.app/**

L'ancienne version (fusions, entreprises, tutoriel) est gardée sur la branche `main-old` ; son plateau et son design ont été repris.

## Démarrer

Il faut Node.js 22 ou plus récent.

```bash
npm install
npm run dev        # http://localhost:5173, recharge à chaque modification
npm test           # règles, cas d'usage et parties de référence du bot
npm run build      # version de production dans dist/
npm run bot -- 80  # équilibrage : le bot joue 80 parties
```

`npm run build:single` produit un `dist/index.html` autonome (un seul fichier).

## Mise en ligne (Vercel)

Chaque push sur `main` met le jeu en ligne ; les autres branches reçoivent une adresse de prévisualisation. Les parties sont sauvegardées dans le navigateur du joueur.

## Organisation du code

Architecture hexagonale (Clean Architecture). Les dépendances vont toujours vers le centre : `ui` → `application` → `domain`. Le domaine ne dépend de rien.

```
src/
  domain/          règles du jeu, pures (aucun React, DOM ou localStorage)
  application/     cas d'usage (GameService), ports, présentateur
  infrastructure/  adaptateurs : sauvegarde localStorage, graines, sons
  ui/              interface React
  main.jsx         racine de composition : branche les adaptateurs
tests/             tests des règles et du service, parties de référence
tools/bot/         joueur automatique (équilibrage et non-régression)
```

Le détail est dans `docs/architecture.md`.
