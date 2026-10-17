# Consignes pour Claude

- L'utilisateur écrit en français ; répondre et documenter en français, phrases simples.
- Méthode : discuter, maquette (canvas claude.ai) si utile, validation, puis code. Ne rien coder tant que la règle n'est pas validée.
- `src/engine/` reste pur : aucune dépendance à React, au DOM ou à localStorage. Tout hasard passe par `Rng`.
- Avant de pousser : `npm test` et `npm run build`. Pour toute retouche visible, captures sur téléphone (390×844, 360×740) et ordinateur (1366×768, 1776×1270).
- Un changement de règles voulu fait échouer `tests/golden.test.js` : régénérer avec `node tests/support/update-golden.js` et le dire dans le commit.
- Notes de conception : `docs/etat-et-decisions.md` (à tenir à jour après chaque étape).
- Les variables locales encore nommées en une ou deux lettres sont des restes de la reconstruction : les renommer quand on retouche une fonction.
