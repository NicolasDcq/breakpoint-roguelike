# État du jeu et décisions

## 19/10 · Ce qui reste vraiment dans le parc

Fenêtre « Ton parc » pendant un contrat : compteurs (dans la pioche, en main, utilisés), les modules joués ou défaussés sont **grisés**, ceux de la main portent la pastille **« En main »** et ceux du plateau **« Posé »**. Ordre : pioche, puis main et plateau, puis utilisés. La règle est dans le domaine (`Round.whereIs`).

## 19/10 · Colis de modules, Plugins par rareté, boss à découvrir

Retour de Nicolas sur les parties procédurales : tout montrer d'avance revient à ne pas jouer la partie.
- **Boss à découvrir** (comme Balatro) : on ne voit que les contrats de la version en cours ; ceux de la version suivante (et son boss) apparaissent une fois le boss passé (`Run.visibleContracts`). L'écran « Ta partie » est supprimé.
- **Plus de marché** : tous les Plugins peuvent sortir en boutique, tirés selon leur **rareté** (commun 60, peu commun 30, rare 10) ; on ajoutera des Plugins de plusieurs raretés pour varier.
- **Modules dans des colis** : la boutique ne vend plus de modules au choix. L'arrivage propose **2 colis de composants** (4 $ : 3 modules tirés parmi tous, on en garde un) et **2 boosters de plans** (6 $). Ouverture avec la boîte en carton de l'ancien jeu (`catalog/packs.js`).
- **Profil de départ aléatoire** gardé.
- Objectifs revus : 150, 215, 265, 415, 550, 720, 940, 1210, 1610, 2100, 2740, 3200. Bot (200 parties) : 32 % de victoires (Data lab le plus dur, 10 %).

## 19/10 · Parties procédurales

Chaque partie est tirée de sa graine (`domain/generation/RunGenerator.js`) :
- **Profil de départ** (6 profils, `catalog/starters.js`) : Start-up classique, Architecture microservices, Data lab, Hébergeur réseau, Agence e-commerce, Tout serverless. 20 modules chacun, 7 Calcul au moins.
- **Marché** : la boutique ne vend qu'environ 65 % des modules de chaque famille (11 sur 17) et 8 Plugins sur 12.
- **Contrats** : noms de clients tirés par version (7 par version), objectif ± 8 %, et 4 boss différents tirés parmi 8 pour les contrats C.
- **Boss** (`catalog/bosses.js`) : Client pressé (3 déploiements), Panne (case 6), Panne de courant (Serveurs), Budget serré (3 modules), Réseau saturé (Réseau), Équipe réduite (main de 5), Gel des changements (0 défausse), Audit de sécurité (Plugins coupés). Chacun ajuste un peu l'objectif (`targetFactor`).
- Écran **« Ta partie »** au début de chaque partie (et bouton dans la barre du haut) : profil, marché, contrats et boss.
- Objectifs de référence revus : 155, 230, 285, 445, 595, 775, 1010, 1300, 1730, 2260, 2950, 3450.
- Bot (160 parties) : 38 % de victoires. Par profil : microservices 48 %, serverless 47 %, classique 38 %, e-commerce 35 %, réseau 30 %, data lab 23 %.

## 19/10 · Plans lisibles d'un coup d'œil

Le nom d'une architecture ne parle qu'aux joueurs qui connaissent le jeu. Chaque plan **dessine** maintenant la pose à faire : de petites tuiles de modules (même module = même icône, couleur de la famille ; « + » entre deux groupes), avec la phrase courte en dessous (« 3 fois le même module »).
- Carte de booster : bandeau (niveau ➜ niveau, nom), dessin, phrase, gain (« +20 ⚡ · +2 × ») et nouvelle base.
- Même dessin dans la liste des architectures.

## 19/10 · Boosters de plans d'architecture

Comme les paquets de mises à jour de famille de l'ancien jeu :
- La boutique a un **arrivage de 2 boosters** (la relance ne les renouvelle pas), à **6 $** chacun.
- Un booster s'ouvre avec la même animation que les anciens paquets et montre **3 plans** d'architectures différentes, tirées au hasard. On en garde **un** (+1 niveau à cette architecture), ou aucun.
- Tant qu'un booster ouvert n'est pas choisi, les autres achats attendent.
- Les mises à jour d'architecture vendues une par une disparaissent.
- Bot : 38 % de victoires (120 parties), contre 28 % avant. Choisir parmi 3 plans est plus fort qu'acheter un plan imposé. À 7 $, le bot retombe à 29 %. On garde 6 $ en attendant tes essais.

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
- Boutique : 4 modules, 2 Plugins (4 au plus), 2 boosters de plans d'architecture (6 $, 3 plans, 1 gardé), amélioration en ◆ (3 puis 6), retrait (2 $, +1 à chaque fois, 8 modules au moins), relance (1 $, +1).
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
