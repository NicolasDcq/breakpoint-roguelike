# Architecture du code

Le jeu suit l'architecture hexagonale (aussi appelée Clean Architecture). Le domaine est au centre et ne connaît rien du monde extérieur. Les dépendances vont toujours vers le centre.

```
ui (React)  →  application  →  domain
                    ↑
             infrastructure (adaptateurs des ports)
main.jsx branche le tout (racine de composition)
```

## Les couches

### `src/domain/` : les règles

Code pur et déterministe : aucun React, aucun DOM, aucun `localStorage`. Tout le hasard passe par `Rng`, qui a une graine.

| Dossier | Rôle |
|---|---|
| `shared/` | `Rng` (hasard à graine), `Result` (réussi / refusé avec un code), `levels` (valeur selon le niveau) |
| `catalog/` | données du jeu : familles, modules, Plugins, contrats (noms et objectifs), boss, profils de départ, architectures, `rules.js` (tous les chiffres réglables) |
| `parc/` | `Card` (objet valeur) et `Parc` (la collection du joueur) |
| `board/` | géométrie 4×4 (`grid.js`, taille réglable avec `GRID_SIZE`) et `Board` (objet valeur) |
| `round/` | `Round` : un contrat en cours (pioche, main, plateau, essais) |
| `scoring/` | `ScoringEngine` (calcul pur d'un déploiement) et `ActivationContext` (ce qu'un module a le droit de faire) |
| `shop/` | service de boutique : Plugins tirés selon leur rareté, prix du retrait (l'arrivage est dans `catalog/packs.js`) |
| `generation/` | `RunGenerator` : la recette d'une partie tirée de sa graine (profil de départ, contrats, boss) |
| `run/` | `Run` : la racine de l'agrégat. Toute commande passe par elle et rend un `Result` |

`domain/index.js` est la porte d'entrée : les autres couches n'importent que ce fichier (sauf les tests, qui testent aussi les pièces internes).

### `src/application/` : les cas d'usage

- `GameService` : les actions du joueur (poser, reprendre, défausser, déployer, ouvrir la boutique, acheter, relancer, retirer, améliorer, contrat suivant, nouvelle partie). Chaque action réussie est sauvegardée, puis l'interface est prévenue.
- `RunPresenter` : transforme la partie en une vue simple pour l'interface. L'interface ne touche jamais l'agrégat.
- `ports/` : les contrats que l'infrastructure doit remplir (`RunRepository`, `SeedSource`, `PreferenceStore`).

### `src/infrastructure/` : les adaptateurs

- `storage/` : `LocalStorageRunRepository`, `LocalPreferenceStore` (navigateur) et `MemoryRunRepository` (tests, bot) ;
- `random/` : graines au hasard, ou fixes pour les tests ;
- `audio/` : sons chiptune (Web Audio), et un adaptateur muet.

### `src/ui/` : l'interface React

- `App.jsx` : l'écran de jeu ; il lit la vue et appelle le service.
- `components/` : morceaux d'écran (barre du haut, panneau de score, rail des Plugins, plateau et main). `ModuleFace` dessine une tuile de module partout (plateau, main, parc, boutique).
- `screens/` : fenêtres (boutique, contrat livré, fin, parc, architectures, règles, nouvelle partie).
- `common/` : fenêtre, infobulle, icônes des modules (repris de l'ancien jeu).
- `hooks/` : animation de déploiement (vitesse, « Passer »), messages brefs, détection du téléphone.
- `styles/` : feuilles de l'ancien jeu (`00` à `21`) et `22-parc.css` pour la main, l'architecture et la boutique.
- `visuals.js` : couleurs, icônes et textes courts ; `messages.js` : textes des refus ; `format.js` et `fx.jsx` : nombres et pastilles.

## Les principes appliqués

- **SOLID**
  - *Responsabilité unique* : chaque fichier a un seul rôle (calculer un score, tenir la pioche, sauvegarder…).
  - *Ouvert / fermé* : ajouter un module, un Plugin, un boss ou une architecture = ajouter une entrée au catalogue. Le moteur ne change pas. Les Plugins agissent par « crochets » (`multiplier`, `afterActivation`, `onRetrigger`, `atEnd`, `contractInterest`).
  - *Inversion des dépendances* : le service dépend des ports, pas de `localStorage`. `main.jsx` choisit les adaptateurs.
  - *Ségrégation des interfaces* : un module ne voit que son `ActivationContext`, pas le moteur.
- **DDD** : agrégat `Run` (seule porte pour changer l'état), entités `Round` et `Parc`, objets valeur `Card` et `Board`, service de domaine `Shop`, langage du jeu dans le code (parc, contrat, architecture, déploiement).
- **DRY** : les chiffres sont dans `catalog/rules.js` et le catalogue ; les effets communs des modules sont fabriqués par des fonctions (`simpleCompute`, `costlyCompute`, `scalePerFamily`) ; le bot sert à la fois à l'équilibrage et au test de non-régression.

## Ajouter du contenu

- **Un module** : une entrée dans `domain/catalog/modules.js` (famille, prix, `lines`, `effect`).
- **Un Plugin** : une entrée dans `domain/catalog/plugins.js` avec ses crochets et sa rareté, et une icône dans `ui/visuals.js`.
- **Un genre de paquet** : une entrée dans `domain/catalog/packs.js` (prix, nombre par boutique, lot de cartes, récompense).
- **Une architecture** : une entrée dans `domain/catalog/architectures.js`, à sa place dans l'ordre de force.
- **Un boss** : une entrée dans `domain/catalog/bosses.js` ; le générateur le tirera tout seul.
- **Un profil de départ** : une entrée dans `domain/catalog/starters.js` (20 modules).
- **Un client** : un nom dans `CLIENT_NAMES` (`domain/catalog/contracts.js`).

Puis : `npm test`. Si les parties de référence changent et que c'est voulu, `npm run golden`.
