# État du jeu et décisions

## 19/10 · Le Parc devient le jeu principal

L'ancien jeu (plateau 5×5, fusions, hybrides, entreprises, tutoriel) est gardé sur la branche `main-old`. `main` repart du prototype « Le Parc », validé en jeu, réécrit en architecture hexagonale (voir `architecture.md`).

### Pourquoi
Avec un plateau fixe, chaque déploiement donnait le même résultat : pas de vraie décision. Avec une main piochée, chaque tour demande de réfléchir, et les architectures donnent une structure, comme les mains au poker.

### Règles actuelles
- Parc de départ : 20 modules (4 Serveurs, 3 Bases, 3 Microservices, 2 CDN, 2 SaaS, Pare-feu, Analytics, 2 Caches, Worker, File).
- Par contrat : main de 7, 5 modules posés au plus, 4 déploiements, 3 défausses. Pas de remélange : une carte jouée ou défaussée revient au contrat suivant. Pioche vide : contrat perdu.
- Score : l'architecture donne la base (Compute et Scale de départ), puis chaque case s'active dans l'ordre et l'améliore, puis les Plugins de fin.
- Seuls les modules Calcul produisent du Compute (sauf effet écrit : Régie Pub, Index).
- Boutique : 4 modules, 2 Plugins (4 au plus), 2 mises à jour d'architecture (3 $), amélioration en ◆ (3 puis 6), retrait (2 $, +1 à chaque fois, 8 modules au moins), relance (1 $, +1).
- 12 contrats : 150, 220, 270, 420, 560, 730, 950, 1230, 1630, 2130, 2780, 3000. Les contrats C ont une contrainte.

| Architecture | Condition | Base niv. 1 | Par niveau |
|---|---|---|---|
| Datacenter | 5 identiques | 100 ⚡ × 8 | +35 ⚡ +3 × |
| Ferme de serveurs | 4 identiques | 60 ⚡ × 7 | +30 ⚡ +3 × |
| Haute dispo | 3 + 2 identiques | 40 ⚡ × 4 | +25 ⚡ +2 × |
| Stack | 5 de la même famille | 35 ⚡ × 4 | +15 ⚡ +2 × |
| Full-stack | les 5 familles | 30 ⚡ × 4 | +30 ⚡ +2 × |
| Cluster | 3 identiques | 30 ⚡ × 3 | +20 ⚡ +2 × |
| Double redondance | 2 + 2 identiques | 20 ⚡ × 2 | +20 ⚡ +1 × |
| Redondance | 2 identiques | 10 ⚡ × 2 | +15 ⚡ +1 × |
| Monolithe | rien | 5 ⚡ × 1 | +10 ⚡ +1 × |

### Équilibrage (bot, `npm run bot -- 60`)
- Le bot vise les architectures et achète leurs mises à jour : 28 % de victoires. La moitié de ses défaites arrive au boss final (3 modules au plus).

### Nouveautés par rapport au prototype
- La partie est sauvegardée dans le navigateur et reprend au rechargement.
- Sons de l'ancien jeu réutilisés.

### Pistes en attente
- Plugins en cartes à puce avec dessins en pixel art (maquettes validées en idée sur le canvas, page « Plugins · cartes à puce »).
- Effets qui multiplient le Scale (ils profiteront de la base de l'architecture).
- Reprendre de `main-old` ce qui a du sens : éditions, tutoriel, profil.
