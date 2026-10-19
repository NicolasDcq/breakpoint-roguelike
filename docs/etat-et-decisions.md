# État du jeu et décisions

## 19/10 · Glisser-déposer et fiche de module

- On **glisse** une carte de la main sur une case pour la poser (sur une case prise, l'ancien module retourne en main).
- On glisse un module posé sur une autre case pour le déplacer ; sur une case prise, les deux **échangent** leur place (`Run.moveCard`).
- On glisse un module posé vers la main pour le **reprendre**.
- **Toucher** une tuile (main ou plateau) ouvre sa **fiche** (style de l'ancien jeu) : ce qu'il fait, son prochain niveau, sa famille. Depuis la fiche : « Poser sur la case N », « Reprendre en main », « À défausser ».
- Défausse en deux temps : on appuie sur « Défausser », on touche les cartes à jeter (entourées de rouge), le bouton devient « Confirmer (n) », et la défausse n'a lieu qu'à la confirmation. « Confirmer » sans carte choisie annule. Pendant ce temps, toucher une carte la choisit au lieu d'ouvrir sa fiche.

## 19/10 · Plateau 4×4

Pour gagner de la place : le plateau passe en 4×4 (16 cases). La taille vient d'une seule constante (`GRID_SIZE` dans `domain/board/grid.js`) ; le dessin et les styles la suivent (`--grid`).
- Sur téléphone, la main récupère la place gagnée : ses cartes sont plus grandes et lisibles.
- Panne du boss V2C : case 6.
- Bot : 28 % de victoires (60 parties). Parties de référence régénérées.

## 19/10 · Retour du plateau 5×5 et du design de l'ancien jeu

À la demande de Nicolas : on garde le fonctionnement du Parc, mais sur l'ancien plateau 5×5 et avec le design de `main-old`.
- Plateau 5×5, cases 1 à 25, pistes et numéros comme avant. Toutes les cases sont ouvertes ; on pose toujours 5 modules au plus.
- La main prend la place du tiroir de pièces détachées (sous le plateau sur téléphone, à droite sur ordinateur).
- L'architecture (la base) s'affiche en haut du panneau de score ; le bouton Fusion devient « Parc » (avec le nombre de cartes dans la pioche), le bouton Boutique devient « Défausser ».
- Boutique, fenêtres, Plugins (cartes et puces), barre du haut : styles de l'ancien jeu repris tels quels (`src/ui/styles/00` à `21`), plus `22-parc.css` pour les nouveautés.
- Règles adaptées au 5×5 :
  - le Serverless compte les cases vides **autour de lui** (et plus celles du plateau entier, qui seraient 20) ;
  - le DNS réactive les cases juste au-dessus et au-dessous (5 cases plus loin) ;
  - la panne du boss V2C touche la case 13, au centre.
- Bot : 27 % de victoires (60 parties), comme avant. Parties de référence régénérées.

## 19/10 · Le Parc devient le jeu principal

L'ancien jeu (plateau 5×5, fusions, hybrides, entreprises, tutoriel) est gardé sur la branche `main-old`. `main` repart du prototype « Le Parc », validé en jeu, réécrit en architecture hexagonale (voir `architecture.md`).

### Pourquoi
Avec un plateau fixe, chaque déploiement donnait le même résultat : pas de vraie décision. Avec une main piochée, chaque tour demande de réfléchir, et les architectures donnent une structure, comme les mains au poker.

### Règles actuelles
- Parc de départ : 20 modules (4 Serveurs, 3 Bases, 3 Microservices, 2 CDN, 2 SaaS, Pare-feu, Analytics, 2 Caches, Worker, File).
- Par contrat : main de 7, 5 modules posés au plus sur le plateau 4×4, 4 déploiements, 3 défausses. Pas de remélange : une carte jouée ou défaussée revient au contrat suivant. Pioche vide : contrat perdu.
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
