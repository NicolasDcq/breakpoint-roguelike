# Consignes pour Claude

- L'utilisateur écrit en français ; répondre et documenter en français, phrases simples.
- Méthode : discuter, maquette (canvas claude.ai) si utile, validation, puis code. Ne rien coder tant que la règle n'est pas validée.
- Architecture hexagonale, à respecter (détail : `docs/architecture.md`) :
  - `src/domain/` reste pur : aucune dépendance à React, au DOM ou à localStorage. Tout hasard passe par `Rng`. Toute modification d'état passe par l'agrégat `Run` et rend un `Result`.
  - `src/application/` ne dépend que du domaine et des ports. L'interface ne lit que la vue du `RunPresenter` et n'appelle que le `GameService`.
  - `src/infrastructure/` implémente les ports ; `src/main.jsx` branche les adaptateurs.
  - SOLID, DDD, DRY : un rôle par fichier ; le contenu (modules, Plugins, boss, architectures) s'ajoute au catalogue sans toucher au moteur ; les chiffres réglables sont dans `domain/catalog/rules.js`.
- Avant de pousser : `npm test` et `npm run build`. Pour toute retouche visible, captures sur téléphone (390×844, 360×740) et ordinateur (1366×768, 1776×1270).
- Un changement de règles voulu fait échouer `tests/golden.test.js` : régénérer avec `npm run golden` et le dire dans le commit.
- Équilibrer avec le bot : `npm run bot -- 80`.
- Notes de conception : `docs/etat-et-decisions.md` (à tenir à jour après chaque étape).
- L'ancien jeu est sur la branche `main-old` (ne pas la modifier).
