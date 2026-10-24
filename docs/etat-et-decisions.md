# État du jeu et décisions

## 24/10 · 5 Plugins, valeur actuelle, animation et ordre des Plugins

- **5 emplacements de Plugin** de base (`RULES.maxPlugins`). L'Investisseuse monte à ×2,25 avec 5 Plugins.
- **Valeur actuelle** : chaque Plugin dont le chiffre change (ou qui est un multiplicateur de production) affiche un badge collé sous sa puce. Couleurs : Compute bleu, Scale rouge, réactivations vert, argent jaune, Data violet, multiplicateur pur de production blanc. Calcul dans le domaine (`catalog/pluginValues.js`, exposé par `Run.pluginValues` puis `RunPresenter.pluginValues`) ; l'écran ne fait que l'afficher. Les Plugins sans chiffre qui change n'ont pas de badge (Concierge, Responsable Sécu…). Le badge est aussi dans la fiche et dans l'infobulle.
- **Animation à l'activation** : le déploiement dit maintenant quels Plugins s'activent à chaque case (`events[].plugins`) et à la fin (`endEvents`). La puce saute et une bulle montre ce qu'elle apporte (« +15 ⚡ », « ×1,5 »). `prefers-reduced-motion` coupe le saut.
- **Glisser-déposer** : on glisse une puce sur une autre pour changer l'ordre (`Run.movePlugin`, `usePluginDrag`). L'ordre compte : les Plugins de fin agissent l'un après l'autre (Compute ×2 après +3 vaut plus que l'inverse). Un appui court ouvre toujours la fiche. Pas de glisser pendant un déploiement.
- Bot (80 parties) : 25 % de victoires. Test de référence régénéré.
- Captures : téléphone 390×844 et 360×740, ordinateur 1366×768 et 1776×1270.

## 24/10 · Cinq raretés de Plugins (façon Balatro) et Gros pack

- **Raretés** : commun (gris), peu commun (vert), rare (bleu), épique (violet), légendaire (doré). Réglages dans `rules.js` : `rarityWeights` (62 / 26 / 9 / 3 / 0 %) et `pluginPrice` (4 / 5 / 7 / 10 / 15 $). Le prix ne dépend plus du Plugin, seulement de sa rareté ; la revente rend la moitié.
- **Tirage** : on tire la rareté d'abord, puis un Plugin de cette rareté (avant, le poids était par Plugin). Le légendaire ne sort jamais en boutique.
- **Légendaire** : seulement dans les paquets. 0,5 % de chance dans le Pack de Plugins, 1,5 % dans le Gros pack. Aucun légendaire n'est encore codé (candidats : La Singularité, Le Grand Architecte, Le Boss Killer).
- **Gros pack de Plugins** : 9 $, 3 Plugins, un rare ou mieux au moins ; l'arrivage a donc 4 types de paquets, à chances égales.
- **Répartition des 28 Plugins** : communs (9) inchangés ; peu communs (6) : Ingé Réseau, Chef de produit, La Monétique, La SRE, La Collectionneuse, Le Minimaliste ; rares (6) : Architecte Cloud, Pair Programming, La Pipeline, Le Tandem, Le Symétrique, La Diagonale ; épiques (7) : Growth Hacker, L'Investisseuse, Le Clean Code, L'Overclocker, Le Capital-risqueur, Le Monopole, L'IA Générative.
- **8 nouveaux Plugins** : Le Testeur, Le Coin Café, Le Relecteur (communs) ; L'Alternante, La Revue de code, Le Pilier (peu communs) ; Le Cache, Le Pool de connexions (rares).
- À venir (besoin de nouveaux crochets du moteur) : Le Freelance, Le Quantum, Le Plateau Infini, Le Clone, puis les légendaires.
- Équilibrage : le bot gagne 13 % des parties (33 % avant ce changement). Avec moins de Plugins puissants et des prix plus hauts, c'est attendu. Essais : prix 3-4-5-6 donne 16 %, et des chances 40 / 30 / 20 / 10 donnent 26 %. À régler avec le joueur automatique avant de publier.
- Test de référence (`golden`) régénéré.

## 24/10 · Arrivage à 2 emplacements et Pack de Plugins

La boutique n'a plus que **2 emplacements de paquets** (avant : 2 colis + 2 boosters). À chaque boutique, chaque emplacement tire son type **au hasard**, à chances égales (`RULES.shop.packWeights`, 1/1/1). Le même type peut sortir deux fois.
- **Colis de composants** : 4 $, 3 modules, on en garde un pour le parc (inchangé).
- **Booster de plans** : 6 $, 3 plans, +1 niveau à l'architecture gardée (inchangé).
- **Pack de Plugins** (nouveau) : 5 $ (prix par défaut, à équilibrer), 2 Plugins différents que le joueur n'a pas, tirés selon la rareté (60/30/10). On en garde un, ou aucun.
- Plugins pleins (4/4) : garder un Plugin du pack ouvre « Plus de place » (prix 0 $) ; le Plugin remplacé est revendu à moitié prix. Si le joueur annule, le pack reste ouvert.
- La relance ne renouvelle pas l'arrivage. Les 2 Plugins directs de la boutique restent.
- Moteur : `Run.packSlots` remplace `packsLeft` ; `buyPack(indexEmplacement)`, `pickFromPack(choix, pluginRemplacé)` ; `drawPlugins` (catalogue des Plugins) sert à la boutique et au pack.
- **Sauvegarde version 5** : les anciennes parties en cours sont abandonnées.
- Test de référence (`golden`) régénéré. Bot (80 parties) : 33 % de victoires, contre 44 % avant : moins de paquets, donc moins de renforts. À regarder avant de toucher aux prix.
- Captures : téléphone 390×844 et 360×740, ordinateur 1366×768 et 1776×1270 (boutique, ouverture du pack, remplacement). Le bureau garde ses deux colonnes.

## 24/10 · Écran d'accueil (bêta)

Au lancement, le jeu s'ouvre sur un accueil (maquettes « PARC · Menu d’accueil ») : titre BREAKPOINT avec le numéro de bêta (`__APP_VERSION__`, tiré de `package.json`), cinq Plugins qui flottent, et les boutons.
- **Pas de partie lancée** : un seul bouton, NOUVELLE PARTIE.
- **Partie en cours** : REPRENDRE LA PARTIE (avec « Version X · contrat Y »), puis NOUVELLE PARTIE en plus petit. Si une partie est en cours, NOUVELLE PARTIE demande confirmation (« La partie en cours sera perdue. »).
- Une partie est **en cours** si le joueur l'a lancée et qu'elle n'est ni perdue ni gagnée (les 12 contrats livrés). Un visiteur qui n'a jamais lancé de partie ne voit donc pas de reprise : la partie n'est sauvegardée qu'au premier lancement (`GameService.started`).
- Les règles s'ouvrent à la première visite, après le clic sur le bouton de lancement.
- Moteur intact. La vue expose `inProgress` (`RunPresenter`) ; l'accueil n'appelle que `GameService` (`newRun`).
- Captures : téléphone 390×844 et 360×740, ordinateur 1366×768 et 1776×1270, sans débordement.
- Piste : un bouton « Accueil » dans la barre du haut pour revenir au menu sans recharger la page.

## 20/10 · 16 nouveaux Plugins (28 en tout)

Pour que les parties ne se ressemblent pas : plus de Plugins, avec des **conditions variées** (position, ordre, nombre de modules, défausses, autres Plugins) et des **×Scale**.
- **Communs** : Le Vétéran (+3 Compute par contrat déjà livré), La Mentor (+5 Compute par Plugin commun), Le Scrum Master (4 modules posés ou plus : +0,5 Scale), Le Responsable Sécu (+2 $ par contrat).
- **Peu communs** : Chef de produit (+0,3 Scale par Business), La Pipeline (un Ops réactive le module posé juste après), La Monétique (2 Business ou plus : +15 Compute), Le Symétrique (module en case miroir : ×2), Le Tandem (+10 Compute par ligne avec 2 modules de même famille), L'Investisseuse (Scale ×1,25 à ×2 selon le nombre de Plugins).
- **Rares** : Le Capital-risqueur (double la caisse en fin de contrat, +8 $ au plus), L'IA Générative (dernier module posé ×4), Le Monopole (3 modules ou plus d'une seule famille : Compute ×3 et Scale ×2), L'Overclocker (plateau plein : Scale ×2, suit la limite du boss), Le Clean Code (aucune défausse : +20 Compute et Scale ×1,5), La Diagonale (grandes diagonales ×2).
- Noms choisis pour ne pas gêner la reprise de `main-old` (pas de « Load Balancer » ni de « Senior »).
- Dessins : les personnages gardent **le visage du Stagiaire** (comme les Jokers de Balatro) ; seuls coiffure, accessoires et tenue changent. Les objets sont un seul objet simple.
- Moteur : `atEnd` reçoit `{ parcSize, pluginIds, contractsWon, maxPlaced, discardsUsed }` ; le contexte d'activation donne `cell()`, `cards`, `isLastPlaced()`, `nextFilledCell()`, `isRetrigger()`.
- Bot (200 parties) : 37 % de victoires (32 % avant). Parties de référence régénérées.

## 20/10 · Plugins en cartes à puce et écran « Plus de place »

- Les 12 Plugins ont leur dessin en pixel-art 16×16 (`ui/plugins/sprites.js`, rendu en SVG par `PixelSprite`). Carte à puce : code (ex. `CPT-05`), fenêtre avec le dessin, nom, effet, rareté, couleur de bord selon la rareté.
- Deux formats : `PluginCard`, la carte complète (fiche, et boutique sur téléphone), et `PluginMini`, la puce seule (rails, fin de partie, ordinateur).
- Sur ordinateur, **partout** (rail, boutique, « Plus de place ») : seulement la puce avec son dessin et son nom, toutes de la même taille (`PluginChip`). L'effet s'affiche **au survol** (infobulle aux couleurs de la puce, `PluginTip`). Dans le rail, un clic ouvre la fiche (carte complète). Dans « Plus de place », l'encadré « Tu gagnes » rappelle l'effet du nouveau Plugin.
- Sur téléphone (pas de survol) : la boutique et « Plus de place » gardent les cartes complètes.
- Nouvel écran « Plus de place » (maquettes RP1–RP3 du canvas) : la carte achetée flotte en haut, on touche le Plugin qui laisse sa place, l'encadré « Tu perds » rappelle son effet, et la caisse est détaillée (Caisse + Revente − Prix). Sur ordinateur : deux colonnes.

## 20/10 · Remplacer un Plugin quand les emplacements sont pleins

En boutique, si les 4 emplacements sont pleins, une offre de Plugin affiche « Remplacer · X $ ». On choisit le Plugin à revendre (moitié de son prix, au moins 1 $) : le nouveau prend sa place, et la revente compte dans le paiement (`Run.buy(offre, pluginRevendu)`, `pluginSellPrice`).

## 20/10 · Améliorer un module en partie

- L'amélioration quitte la boutique : on touche un module **en main ou posé** et on l'améliore depuis sa fiche (« Améliorer au niveau N · X ◆ »), en Data. Coûts inchangés : 3 ◆ puis 6 ◆.
- Un module posé amélioré compte tout de suite dans le score prévu.
- Pastille verte à deux chevrons sur les tuiles qu'on peut améliorer maintenant (Data suffisante), comme dans l'ancien jeu.
- Bot : il améliore les modules qu'il pose. 32 % de victoires (200 parties).

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
- Boutique : 4 modules, 2 Plugins (4 au plus), 2 boosters de plans d'architecture (6 $, 3 plans, 1 gardé),  retrait (2 $, +1 à chaque fois, 8 modules au moins), relance (1 $, +1).
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

- Effets qui multiplient le Scale (ils profiteront de la base de l'architecture).
- Reprendre de `main-old` ce qui a du sens : éditions, tutoriel, profil.
