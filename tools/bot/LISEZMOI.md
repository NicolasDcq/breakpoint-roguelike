# Bot d'équilibrage

Joue des parties complètes avec le vrai moteur (`src/engine`), sans interface.

- `node tools/bot/bot.mjs <graine> <niveau> <entreprise>` : une partie, résumé affiché.
- `node tools/bot/run.mjs out.jsonl <worker> <nbWorkers> <niveaux> <entreprises|all> <a-b>` : une série (lancer 2 processus en parallèle avec worker 0 et 1).
- `python3 tools/bot/analyse.py out.jsonl` : victoires, contrats ratés, Plugins, colis, familles.

Le bot est glouton : il évalue chaque achat en simulant 3 déploiements, réorganise le plateau par échanges de cases, achète colis et paquets sans voir leur contenu. Il valorise surtout la production immédiate : il sous-estime les Plugins d'économie. Ses taux de victoire servent à **comparer avant/après un changement**, pas à mesurer un joueur humain.

Référence du 17/10/2026 (moteur v0.86, 25 graines × 8 entreprises) : victoires 36 % (niv. 1), 17 % (niv. 4), 3 % (niv. 8) ; ~2 s par partie.
