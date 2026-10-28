# État du jeu et décisions

## 28/10 · Menu principal centré sur ordinateur, avec un onglet Paramètres

- Sur ordinateur, le menu est **centré** (titre, onglets, boutons), les cartes à puce flottent de chaque côté. Deux onglets : **Jouer** (nouvelle partie / reprendre, tutoriel) et **Paramètres**.
- Paramètre : **vitesse du jeu ×1, ×2 ou ×3** (avant : ×1, ×2, ×4 pendant l'animation seulement). Elle est gardée dans les préférences (`ui/gameSpeed.js`, clé `speed`) et appliquée à chaque déploiement ; les boutons de vitesse de l'animation en jeu la changent aussi et elle reste.
- Le menu du téléphone ne change pas.

## 28/10 · Le Terminal : 9 commandes à usage unique (comme les tarots de Balatro)

Pour des parties différentes : de quoi transformer son parc en cours de partie. Maquettes : canvas « Terminal des commandes » (7 artboards) et prototype animé. Décisions prises avec Nicolas le 28/10 (`consommables-terminal.md` dans le projet claude.ai).

- **Thème** : des commandes de terminal. 9 commandes, **pas de rareté**, couleur unique verte, un seul prix : **4 $** (`RULES.terminal.price`).
- **Terminal** : 2 emplacements au plus (`RULES.terminal.slots`). Une commande se consomme quand on l'utilise.
- **Comment on les obtient** : une offre de Plugin de la boutique peut devenir une commande (25 %, `RULES.shop.commandChance`) ; ou le **Pack Terminal** (3 $, un des types de l'arrivage) : **3 commandes tirées au hasard, on en garde une** (comme les autres boosters, avec l'animation d'ouverture). Il faut un emplacement libre pour l'acheter. Le Concierge (Plugin) rend les commandes de la boutique 1 $ moins chères (il remplace l'ancien « retrait gratuit »).
- **Le retrait de modules en boutique disparaît** (service, prix croissant, `removeCard`) : `rm` est le seul moyen d'amincir le parc.
- **Étapes** : **toutes les commandes se jouent depuis l'écran de jeu** (pendant un contrat) et à la boutique, sauf `ping` et `ssh` : leur bonus ne vaut que pour le contrat en cours (pas à la boutique). `!!` rejoue la dernière commande si elle s'utilise à cette étape. Pendant un contrat : `cp` met la copie dans la pioche (place au hasard), `rm` retire le module de la main, du plateau, de la pioche ou de la défausse (la main est complétée ; refusé si ça enlèverait la dernière carte jouable), `ln -s` dure jusqu'à la fin du contrat en cours.

| Commande | Effet |
|---|---|
| `ping` | +1 déploiement pour le contrat en cours |
| `ssh` | +1 module posé pour le contrat en cours |
| `!!` | Rejoue la dernière commande utilisée (nouvelle cible si elle en a une) |
| `ln -s` | Un module compte comme n'importe quel autre pour les architectures (joker), jusqu'à la fin du contrat (le prochain, si on l'utilise à la boutique) ; il garde ses propres effets |
| `cp` | Copie un module du parc (la copie est de niveau 1, `RULES.terminal.copyKeepsLevel`) |
| `rm` | Supprime jusqu'à 2 modules du parc (16 modules au moins) |
| `motherlode` | Double l'argent, +20 $ au plus |
| `mysqldump` | Double la Data, +10 ◆ au plus |
| `apt upgrade` | +1 niveau à l'architecture la plus jouée (à égalité, la jouée en dernier) |

- **Commandes ciblées** (`cp`, `rm`, `ln -s`) : le domaine tire une main de 8 modules au hasard dans le parc (`Run.useCommand`), le joueur en choisit 1 (2 pour `rm`) puis exécute (`Run.applyCommand`) ou renonce (`Run.cancelCommand`, la commande n'est pas consommée).
- **Moteur** : catalogue `domain/catalog/commands.js` (étapes, cibles), effets dans `domain/run/commandEffects.js`, état dans `Run` (`commandIds`, `lastCommand`, `commandSession`, `contractBonus`, `wildUid`, `architectureOrder`). Sauvegarde passée en version 6 (les anciennes parties ne se reprennent plus). `detectArchitecture` accepte une carte `wild`.
- **Interface** : fenêtre de terminal animée (`ui/terminal/TerminalModal.jsx` : tape la commande, sortie, effet), **plein écran avec une croix de fermeture sur téléphone** ; les modules de la main tirée gardent la tuile du jeu ; cartes de commande sans broches dorées (`CommandCard`) ; rail Terminal sous les Plugins en partie (`TerminalRail`, visible dès qu'on a une commande, toutes jouables) ; section « Ton terminal » en boutique ; Pack Terminal dans l'arrivage ; règles et tutoriel mis à jour.
- **Boutique sur ordinateur refaite** (`ui/screens/ShopDesktop.jsx`, `styles/28-shop-desktop.css`) : colonne de gauche (prochain contrat, gros boutons Relancer / Parc / Contrat suivant), puis trois étagères : Offres (vraies cartes de Plugin ou de commande, étiquette de prix dessous), Arrivage (les paquets posés en grand avec leur prix) et Ton terminal. La boutique du téléphone ne change pas.
- **Tests** : 22 tests de domaine sur le Terminal ; golden régénéré (le tirage de la boutique change). Le bot ne se sert pas encore du Terminal (il laisse le Pack Terminal).
- Bot (80 parties) : 0 % avec et 1 % sans (même ordre de grandeur : l'équilibre du bot est déjà bas depuis la Vague 4).
- **À régler au bot** : le prix unique (4 $), le Pack Terminal (3 $ pour 3 commandes au choix : moins cher qu'une commande seule, à revoir), le plafond de `motherlode` (20 $) très généreux dans une économie où un contrat paye 4 à 7 $, la fréquence d'une offre qui devient commande.
- **Écarté ou en attente** : `git revert`, `sudo` ; les commandes de réserve (`rm -rf`, `tar`, `alias`, `make`, `grep`, `sort`, `reboot`, `kill -9`, `fork`, `wget`, `touch`, `curl`, `docker run`, `nohup`, `rsync`, `systemctl restart`, `xargs`) ; les bonus permanents sur un module deviendront des **puces dans des sockets** (brainstorming à refaire) ; `chmod +x` reviendra avec les éditions.

## 26/10 · Vague 4 : 15 Plugins qui multiplient Scale et qui grandissent

Pour coller à la puissance de Balatro, les Plugins multiplient maintenant Scale à chaque rareté, et certains grandissent pendant la partie. On passe de 36 à 51 Plugins. Les ×Scale sont en rouge (couleur de Scale), jamais en jaune (réservé à l'argent).

| Rareté | Plugin | Effet |
|---|---|---|
| Commun | Ticket Jira | +0,1 Scale par déploiement joué dans la partie |
| Commun | Sprint | +4 Compute par déploiement déjà joué dans le contrat |
| Commun | Hotfix | +1 Scale au dernier déploiement du contrat |
| Peu commun | Load Balancer | Scale ×1,3 si 2 modules identiques ou plus |
| Peu commun | Certification | Scale ×1,25 si l'architecture n'est pas un Monolithe |
| Peu commun | Monitoring | Scale ×1,15 par module Ops posé |
| Peu commun | Conteneur | Scale ×1,3 si aucun module posé n'est isolé (2 posés au moins) |
| Rare | Hyperscaler | Scale ×(1 + 0,1 par contrat livré) |
| Rare | Autoscaling | Scale ×1,5, ou ×2 au dernier déploiement |
| Rare | Feature Flag | Scale ×1,2 à chaque réactivation d'un module |
| Rare | Montée en charge | Scale ×1,15 par déploiement déjà joué dans le contrat |
| Épique | Déploiement final | Scale ×3 s'il est le dernier Plugin à droite |
| Épique | Rachat de start-up | Scale ×(1 + 0,5 par Plugin épique ou légendaire) |
| Épique | Pivot | Scale ×(1 + 0,25 par famille différente posée) |
| Épique | Monorepo | Scale ×2,5 si 3 modules ou plus, tous différents |

- Moteur : l'environnement des Plugins de fin reçoit `deploysPlayed`, `deploysThisContract`, `isLastDeploy` et `isLastPlugin` (calculés par `Run.deployCounts`). Le contexte d'activation a `multiplyScale`. Un Plugin qui multiplie Scale porte `scaleTimes: true` : l'animation affiche « ×1,3 » et non l'écart.
- L'ordre compte comme dans Balatro : ce qui ajoute à gauche, ce qui multiplie à droite. Le bot range ses Plugins ainsi.
- Les badges sur les puces suivent la partie (déploiements, contrats livrés, plateau).
- Sprites dessinés pour les 15 (`ui/plugins/sprites.js`). Le test de couverture de la boutique passe à 300 graines.
- Golden régénéré (nouveaux Plugins dans le tirage, bot qui range ses Plugins).
- Bot (80 parties) : 0 % avant la Vague 4. Voir la section suivante pour les valeurs relevées.

## 26/10 · Plugins additifs relevés (façon Balatro)

Un Joker de Balatro donne souvent +4 Mult et des dizaines de jetons. Les anciens Plugins (+3 Compute, +0,3 Scale) ne se voyaient pas à côté des bases d'architecture. Toutes les valeurs additives sont relevées :

- **Compute** : Stagiaire +10 par module, Vétéran +10 par contrat livré, Mentor +20 par Plugin gris, Collectionneuse +1 par module du parc, Monétique +60, Testeur +40, Coin Café +25 par coin, Alternante +30 par famille, Tandem +40 par ligne, Clean Code +80, Sprint +20 par déploiement du contrat.
- **Scale** : Ingé Réseau +2 par module Réseau, Chef de produit +2 par module Business, Scrum Master +4, Relecteur +2, Pool de connexions +3 par ligne vide, SRE +2 par réactivation, Ticket Jira +0,5 par déploiement joué, Hotfix +6 au dernier déploiement.
- Les multiplicateurs, l'argent et les effets de position ne changent pas.
- Golden régénéré. Bot (80 parties) : **1 % de victoires** (0 % avant), et il va beaucoup plus loin : la plupart des défaites arrivent aux contrats 12 à 15 (boss des versions 4 et 5) au lieu de 9 à 12. Le bot ne choisit pas ses Plugins ni leur place : un vrai joueur fera mieux.

## 26/10 · Architectures alignées sur les mains de poker de Balatro

- Les architectures étaient déjà calquées sur les mains : Monolithe = carte haute (5 × 1), Redondance = paire (10 × 2), Double redondance = double paire (20 × 2), Cluster = brelan (30 × 3), Full-stack = suite (30 × 4), Stack = couleur (35 × 4), Haute dispo = full (40 × 4), Ferme = carré (60 × 7). Les gains par niveau sont aussi ceux de Balatro.
- Deux écarts corrigés : **Datacenter** (5 identiques = « Five of a Kind ») passe de 100 × 8 à **120 × 12** ; **Full-stack** (suite) gagne **+3 Scale par niveau** au lieu de +2.
- **Cinq neufs** (nouvelle, 10ᵉ architecture) : 3 identiques + 2 identiques, tous de la même famille. C'est le « Flush House » de Balatro : 140 × 14, +40 ⚡ +4 × par niveau, au-dessus du Datacenter. Nom : les « cinq neufs » (99,999 % de disponibilité), clin d'œil à une Haute dispo parfaite. Le tutoriel et la liste des architectures la montrent automatiquement.
- Test de référence régénéré.

## 26/10 · 8 versions et objectifs façon Balatro

- **8 versions × 3 contrats = 24 contrats** (`VERSIONS = 8`), comme les 8 antes de Balatro. 8 boss différents, un par version. 8 listes de clients (`CLIENT_NAMES`), de plus en plus gros.
- **Objectifs** : base de version `[150, 400, 1000, 2500, 5500, 10000, 17500, 25000]` (la courbe de Balatro divisée par 2), puis A ×1, B ×1,5, boss C ×2 (`VERSION_BASES`, `LETTER_FACTORS`). Le boss est toujours le plus dur : les règles de boss ne baissent plus l'objectif que de 5 % au plus. Variation de ±8 % par partie, comme avant.
- Dernier objectif : environ 50 000. Test de référence régénéré, graine du tutoriel changée (18).
- **Constat avec le bot (40 parties)** : 0 victoire, il tombe entre les contrats 7 et 12. Le moteur ne fait pas encore monter le score aussi vite que la courbe : il manque des sources de croissance (Plugins qui multiplient le Scale, légendaires, niveaux d'architectures). À équilibrer avant de distribuer aux testeurs.

## 26/10 · Parcs de 40 modules

- **Profondeur façon Balatro** : le parc de départ passe de 20 à 40 modules (`RULES.startParcSize`), pour une main de 7. Chaque profil est doublé en gardant son identité (au moins 14 modules Calcul). Minimum de parc : 16 (`minParcSize`).
- **La Collectionneuse** : +1 Compute par tranche de 2 modules du parc (même force qu'avant : 20 au départ).
- Partie du tutoriel : nouvelle graine (27), toujours deux paires de Calcul en main.
- Test de référence régénéré. Bot (80 parties) : 19 % de victoires (26 % avant). Équilibrage à revoir plus tard : coût d'amélioration des modules, prix de retrait, profils.
- Tests : le Plugin coverage passe à 150 graines, le test de retrait donne assez d'argent.

## 26/10 · Le Cache resserre son résultat aux réactivations

- Quand le Cache booste un producteur, le moteur retient le facteur pour cette case (`state.cached` dans `ScoringEngine`). Chaque réactivation de la même case, pendant le même déploiement, reprend ce facteur : un cache qui sert le même résultat. Vidé à chaque déploiement.
- Exemple : Serveur à 10 Compute, Cache ×2 avant lui, Worker après : 20 + 20 au lieu de 20 + 10.
- Le Plugin « Le Cache » (×1,5 sur un module réactivé) ne change pas et se cumule.
- Texte du module mis à jour. Test de référence régénéré (`npm run golden`). Deux tests ajoutés.
- À surveiller : Cache + Worker niveau 3 compte le bonus 4 fois. Équilibrage à revoir plus tard (bot 80 parties).

## 25/10 · Écran de victoire avec Loup Niel

- **Victoire** : titre doré, confettis, Loup Niel (pose « bravo ») et une réplique dans une bulle, chiffres de la partie (contrats, déploiements, modules, Plugins), Plugins du joueur, bouton « Nouvelle partie ». Composant `VictoryModal` (`ResultModals.jsx`), style `26-victory.css`.
- **Répliques** : `src/ui/mascot/repliques.js` (12 de victoire, 9 de défaite). Le choix dépend de la graine (`quoteFor`) : pas de hasard dans l'interface, la même partie dit la même chose. Ajouter une réplique = ajouter une ligne.
- La mascotte est maintenant dans `src/ui/mascot/` (`LoupNiel.jsx` et ses poses), partagée par le tutoriel et les écrans de fin.
- **Défaite** : même mise en page en rouge (`DefeatModal`) : Loup Niel inquiet, une réplique de défaite (dont « Quand je dis on fait du 80/20… »), barre de l'objectif manqué, chiffres, Plugins, bouton « Rejouer ».
- La case « meilleur score » de la maquette est remplacée par le nombre de Plugins (le jeu ne retient pas le meilleur déploiement).
- Captures : téléphone 390×844 et 360×740, ordinateur 1366×768 et 1776×1270.

## 24/10 · Tutoriel avec Loup Niel

- **Partie préparée** : graine fixe `RULES.tutorialSeed` (6). La main a deux paires de Calcul (Serveur et Serverless), donc une vraie Redondance. `GameService.startTutorial()` lance cette partie.
- **Scénario** : liste d'étapes dans `src/ui/tutorial/steps.js` (phase, zone éclairée, texte, fin automatique ou bouton « Suivant »). 17 étapes : présentation, contrat, familles, les 9 architectures, formule, défausse, amélioration (Data), déploiement, paie, boutique (arrivage, Booster de plans si présent, Plugins et raretés, services), contrat suivant, puis un bravo qui propose de lancer une vraie partie (le tutoriel s’arrête là, il ne dure pas jusqu’aux boss).
- **Écran** : `Tutorial.jsx` éclaire la zone utile (quatre panneaux qui bloquent les clics, sauf dans le trou quand l'étape demande d'agir). La bulle de Loup Niel passe en haut ou en bas selon la zone. « Quitter le tuto » est en haut de la bulle, loin de DÉPLOYER.
- **Lancement** : proposé au premier lancement (préférences `tutoSeen` et `rulesSeen`), rejouable depuis le bouton « Tutoriel » du menu. La fenêtre « Comment jouer » reste, accessible par « Règles ».
- Le tutoriel ne change aucune règle : il ne lit que la vue. Pas de test golden à régénérer. Mascotte : `tools/loup-niel-sprite.py --module` → `src/ui/tutorial/loupNielSprites.js`.
- Captures : téléphone 390×844 et 360×740, ordinateur 1366×768.

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
| Cinq neufs | 3 + 2 identiques, même famille | 140 ⚡ × 14 | +40 ⚡ +4 × |
| Datacenter | 5 identiques | 120 ⚡ × 12 | +35 ⚡ +3 × |
| Ferme de serveurs | 4 identiques | 60 ⚡ × 7 | +30 ⚡ +3 × |
| Haute dispo | 3 + 2 identiques | 40 ⚡ × 4 | +25 ⚡ +2 × |
| Stack | 5 de la même famille | 35 ⚡ × 4 | +15 ⚡ +2 × |
| Full-stack | les 5 familles | 30 ⚡ × 4 | +30 ⚡ +3 × |
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

## 28/10 — Écran de jeu desktop (maquette A2)
- Ordinateur : colonne HUD à gauche (300 px) ; au centre un bandeau fin (Plugins en petites cartes + Terminal vert avec bouton Utiliser), puis piles | plateau réduit (max 720 px) | liste des architectures, et la main en bas.
- La main garde des emplacements fixes : un module posé laisse un trou « posé », rien ne se décale (`HandRow`, `useStableHand`).
- Liste des architectures : base à ton niveau, nombre de parties jouées (`×N`), la formée en vert, et l'architecture que `apt upgrade` monterait en jaune (`view.nextUpgradeId`, via `mostPlayedArchitecture`).
- Mobile inchangé. Fichiers : `App.jsx` (branche desktop), `ArchitectureList.jsx`, `TerminalTray.jsx`, `29-game-desktop.css`.
- Reste : panneau « Détail module » avec Améliorer (pour l'instant la fiche s'ouvre au toucher).
