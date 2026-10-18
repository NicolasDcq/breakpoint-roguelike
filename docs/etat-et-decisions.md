# Breakpoint · état et décisions (mis à jour le 17/10/2026)

Complète [premiere-conversation.md](premiere-conversation.md). En cas de contradiction, ce document-ci est le plus récent. Les noms courts de l'ancienne version compilée (`wn`, `RwM`, `PbCalc`…) sont traduits dans [correspondance-des-noms.md](correspondance-des-noms.md).

## Adresse du jeu
https://breakpoint-roguelike.vercel.app/ (Vercel, publié à chaque push sur `main`). Les sauvegardes des joueurs sont liées à cette adresse : ne plus la changer.

## Bêta (17/10)
- Numéro de version en pastille ambre flottante à côté du titre du menu (« Bêta 0.86.0 », lu dans `package.json`).
- **Mode dev** masqué sur la version en ligne. Il reste présent en local (`npm run dev`) et sur les prévisualisations Vercel (branches). Sur la bêta, on peut le forcer en ajoutant `?dev` à l'adresse. Réglages : `src/config.js`.

## Vocabulaire
Les Jokers s'appellent désormais des **Plugins** (dans le jeu, les maquettes et les docs). Les anciens textes qui disent « Joker » doivent être lus comme « Plugin ». Dans le code, les noms techniques (`jokers`, `joker-*` en CSS) restent tels quels tant qu'ils ne sont pas visibles.

## Méthode
On avance par étapes, une à la fois. Pour chaque étape : maquette sur le canvas (sauf si l'utilisateur dit qu'elle n'est pas nécessaire), validation, intégration, tests et test au bot, publication. Les maquettes reprennent le format exact des éléments du jeu. Pour les retouches de mise en page, des captures du vrai jeu remplacent la maquette.

Le canvas est organisé **une page par type d'amélioration** : Tutoriel, Plugins · formes, Plugins · familles et niveaux, Colis de composants, Tiroir et boss trou, Économie · consommation, Sockets et puces, Fusion, Mises à jour, Plateau 5×5, Terrains, puis les pages existantes (Entreprises, Goodies, Écrans hybride, Explorations). Les frames sont numérotées à partir de 1 dans chaque page. Pour itérer sur un type, on travaille sur sa page seulement.

**Sources (depuis le 17/10)** : le code vit dans ce dépôt GitHub, reconstruit à partir de la v85 publiée (voir le README). On ne modifie plus de bundle à la main. Chaque changement : branche, `npm test`, captures sur téléphone et ordinateur, puis fusion dans `main`, qui publie sur Vercel.

Vérification visuelle : Playwright et Chromium, captures et parcours simulés (clics, glisser-déposer, achats) sur 1776×1270 (écran de l'utilisateur), 1366×768, 390×844, 375×667 et 360×740. Astuce : pour tester la fin de contrat, modifier `contractScore` (et vider `contracts[i].rules` si une contrainte bloque) dans `localStorage['breakpoint.run']` puis recharger ; dans les tests, l'action `TUTO_PATCH` fait la même chose. Leçon : ne plus publier de mise en page sans capture, et **vérifier chaque écran d'une partie sur téléphone** (la récompense de fin de version avait été oubliée).

## Étape 1 : niveaux de famille et paquets — INTÉGRÉE
Une famille entière monte d'un niveau, pour toute la partie, sans plafond. Paquet de mises à jour : 3 familles tirées, 1 gardée ou aucune, 5 $ + surcoût.

## Étape 2 : Plugins de forme et de famille + colis de composants — INTÉGRÉE (v72, renommée en Plugins)
- 55 Plugins ; les 15 nouveaux recalés sur 5×5 (Pilote Réseau : croix centrale ; Fou et Câbleur : 5 modules ; Ingé Clim : 4 coins).
- **Colis de composants intégré** :
  - L'arrivage a toujours 2 emplacements ; chacun est tiré au hasard à chaque contrat : **colis (45 %)** ou paquet de mises à jour (55 %). Les deux peuvent être du même type. Tirage fixé par la graine et le contrat ; la relance ne le renouvelle pas.
  - Colis : prix du paquet + 1 $ (**6 $** de base). 3 Plugins tirés selon la rareté (même tirage que la boutique), jamais un Plugin déjà possédé. La Recruteuse en montre 4.
  - Ouverture : carton qui tremble, toucher pour ouvrir, cutter qui coupe le ruban, rabats qui s'ouvrent, puis les Plugins montent sous leur vraie forme de carte. On en garde un ou on passe.
  - Emplacements pleins : impossible de garder (message), il faut passer.
  - Passer compte pour la Dev Hotfix. Déployer est bloqué tant qu'un colis est ouvert.
- Reste : équilibrage au bot (15 Plugins, arrivage, part des colis).

## Étape 3 : plateau 5×5 avec formes de départ — INTÉGRÉE ET VÉRIFIÉE
25 cases. Une forme parmi 8 au départ (5 cases). Achat : case voisine d'une case ouverte, 8 directions. Modules de départ posés sur les cases ouvertes. Récompense « +1 emplacement » : case achetable. Anciennes sauvegardes 4×4 refusées.

## Étape 4 : tiroir de pièces détachées — INTÉGRÉ ET VÉRIFIÉ
2 emplacements au départ, 6 au maximum. Glisser-déposer dans les deux sens, même tuile que le plateau. Extension : 20/40/70/110 $ + 1 goodie consommé (à confirmer). Fusion depuis le tiroir : faite avec la fusion hybride (18/10).

## Étape 4 bis : boss trou — INTÉGRÉ
Une case ouverte devient un trou au début du contrat ; son module part au tiroir ou est détruit si le tiroir est plein. Plafond : 1 (niveaux 1-7), 2 (incident), 4 (infini).

## Étape 5 (maquette seule) : consommation des modules — À VALIDER
Chaque module actif coûte de l'argent à la fin de chaque contrat ; tout reste utilisable. Les 3 premiers $ de consommation sont offerts. Un module rangé dans le tiroir ne consomme rien. Maquette : page « Économie · consommation ». Non intégré dans le jeu.

## Tutoriel avec Loup Niel — INTÉGRÉ (v76, 17/10)
Objectif : faire tester le jeu à des nouveaux joueurs sans les lancer dans le grand bain.
- **Partie d'entraînement à part, avant la vraie** (décision de l'utilisateur) : bouton au menu ; au premier lancement, encart « Première fois ? » avec Loup Niel et « Lancer le tutoriel » ; ensuite, bouton discret « Tutoriel avec Loup Niel » sous Jouer. Rien n'est enregistré pendant le tutoriel (pas de sauvegarde, pas de progression du profil). À la fin ou si on passe : retour au menu (ou reprise de la vraie partie sauvegardée s'il y en a une). Marqueur `localStorage['breakpoint.tutoDone']`.
- Partie fixée : graine 424242, Start-up, difficulté 1, premier Plugin imposé (le Stagiaire). Objectifs de la version 1 : A 30, B 40, C 45 (`TUTO_TARGETS`, validés par l'utilisateur le 17/10). La version 2 ne demande aucun déploiement : spécialisation, fusion, fin. Arrivage forcé « colis + paquet ». L'argent et la Data sont complétés juste ce qu'il faut aux étapes d'achat. **Cadeau de fusion (18/10)** : à la Version 2, un Serveur passe au niveau 3 (spécialisation à choisir) et un Abonnement SaaS niveau 3 « Freemium » est posé ; la Data est complétée jusqu'au coût d'une fusion. Le joueur fait une fusion hybride (Cloud managé) dans le nouvel atelier.
- **Guide : Loup Niel**, loup CTO de l'entreprise où le joueur vient d'être engagé. Style mascotte simple validé : dessin vectoriel rond façon Jimbo, gros contour noir, fourrure gris-bleu, lunettes rondes, sweat bleu nuit badge « CTO », **cheveux courts châtain clair**. 9 poses (neutre, salut, il explique, il réfléchit, bravo, inquiet, surpris, alerte boss, pause café), en SVG dans `src/tutorial/loupNielSprites.js`. Source : `tools/loup-niel-sprite.py` (fonction `svg(nom)`).
- Fonctionnement : le reste de l'écran s'assombrit, la zone expliquée reste éclairée (contour ambre qui pulse) et seule elle répond au toucher. Bulle en haut ou en bas selon la zone ; sur l'écran de récompense mobile, juste au-dessus de la barre du bas. Étapes « Suivant » et étapes « à faire » (détectées sur l'état du jeu). Quand le joueur doit jouer librement (déployer, choisir une récompense, fermer un écran), une petite bulle de consigne non bloquante s'affiche ; elle passe en haut quand un écran du jeu est ouvert (colis, paquet, fusion). Le tutoriel fait défiler jusqu'à la zone éclairée si elle est hors écran. En cas d'échec : Loup Niel inquiet, « Recommencer » ou « Terminer ».
- **22 étapes** : contrat A (accueil, objectif et 3 déploiements, ordre des numéros, 5 familles, fiche d'un module *, glisser *, Compute × Scale et prévu, Déployer *) · boutique après A (deux monnaies, colis *, acheter un module *, ouvrir une case *) · contrat B (Plugins et leur ordre, améliorer un module *) · boutique après B (paquet de mises à jour *) · contrat C (tiroir, contrainte du boss) · récompense de fin de version · goodies · Version 2 (spécialisation niveau 3 *, fusion *) · fin. (* = à faire.)
- Code : `src/tutorial/` — composant `TutorialOverlay` (portail sur `body`), tableau `TUTO_STEPS`, `startTutorial()`, `endTutorial()`, `fusionGift()` ; actions du reducer `TUTO_SET` et `TUTO_PATCH` ; drapeau `tuto` sur l'état (sauvegarde `saveRun` et profil ignorés). Styles `src/styles/14-tuto-style.css` (classes `tz-*`).
- **Corrections du 17/10** (retours de test) :
  - Étape 5 (fiche d'un module) : la fiche se refermait aussitôt ouverte et le tutoriel passait à l'étape 6. Maintenant la fiche reste ouverte, le texte change (« Voilà sa fiche… ») et on passe avec « Suivant ».
  - Une étape « à faire » se valide même si la situation a déjà changé (ex. : le déploiement livre le contrat d'un coup). Avant, le tutoriel restait muet.
  - Le tutoriel ne finissait jamais après la version 1. Cause probable : le raccourci de fusion sur la fiche niveau 3 fusionnait les deux Serveurs sans spécialisation ; l'étape « choisis sa spécialisation » ne pouvait plus se valider (plus de Serveur), et le joueur continuait à déployer en version 2 contre des objectifs normaux.
  - (18/10) La fiche d'un module n'a plus aucun raccourci de fusion : la fusion passe seulement par le bouton Fusion. La propriété `fusionShortcut` a disparu.
  - Vérifié par un parcours automatique complet (22 étapes) sur téléphone 390×844 et ordinateur 1366×768.
- **Pas encore fait** : bulles « la première fois » hors tutoriel (première fusion possible, édition, réactivation en chaîne, trou de boss, boutique fermée, entreprise débloquée) et le wiki de Loup Niel (une fiche par notion sur le bouton ?).
- Maquette : page « Tutoriel » du canvas.

## Fusion hybride — INTÉGRÉE (18/10, branche `fusion-hybride`)
Règles validées par l'utilisateur le 18/10 (maquettes : page « Fusion » du canvas, planches FU0 à FU5 et HY5 à HY8).
- **Deux modules niveau 3 quelconques** fusionnent, du plateau ou du tiroir. Deux modules identiques donnent toujours la 2.0 (Datacenter…). Deux modules différents donnent un **hybride**.
- L'hybride **garde les deux effets**, avec la spécialisation A/B de chaque parent : 4 versions par paire. Il **compte dans les deux familles** (bonus de famille, Marketplace, Pare-feu, Plugins de famille). Un hybride producteur + soutien produit puis agit (ex. Reverse Proxy : 1 ◆ → +26 Compute, puis le producteur suivant ×4).
- **190 noms** tirés du vrai monde informatique (`src/engine/hybrids.js`, brouillon dans le projet : `claude/hybrides-noms.md`). Texte d'ambiance provisoire : « X et Y dans la même baie ».
- **Coût qui monte (18/10, décision de l'utilisateur)** : 12 ◆ la première fusion de la partie, puis +6 ◆ à chaque fusion déjà faite (12, 18, 24…), hybride ou 2.0 (`fusionCost`, `src/engine/hybrids.js`). L'atelier affiche le prix de la suivante. Avant les hybrides : gratuite ; première version : 8 ◆ fixe, jugé trop bas pour le gain.
- **Éditions** : si les deux parents en ont une (différente), le joueur choisit laquelle garder ; sinon celle qui existe est gardée.
- Un hybride monte en 2.1, 2.2, 2.3 comme une 2.0. Prix de vente : moitié du prix des deux parents + 2 $.
- Interdit par le client : un hybride est bloqué si l'un de ses parents est interdit. Les Plugins de forme lisent sa première famille.
- **Interface** : atelier à deux cases en haut et le résultat en dessous ; toucher une case ouvre la liste des modules niveau 3 fusionnables (plateau et tiroir) ; puis choix de l'édition, case gardée, coût. Pastille du bouton Fusion = nombre de fusions faisables d'affilée (modules prêts ÷ 2, arrondi en dessous). Plus de fusion depuis la fiche d'un module. Tuile d'un hybride : bandeau à deux couleurs, deux icônes, badge « HYB ».
- Code : `hybrids.js` (noms, `FUSION_COST`, `moduleFamilies`, `isHybrid`), `moduleView` (vue combinée), `reducer.js` (`fuseModules`, `fusionResult`, `fusionCandidates`, `fusionCount`), `deploy.js` (familles multiples, produire puis agir), UI `src/ui/fusion/Fusion.jsx`, styles `21-fusion-hybride.css`. Sauvegarde : un hybride porte `partnerId` et `partnerBranch`.
- Référence des tests régénérée (coût de la fusion, nouveaux messages) ; 3 tests ajoutés.
- Bot : il essaie toutes les paires (`BOT_FUSION=all`, par défaut), seulement les paires identiques (`twins`) ou aucune (`none`).
- **Bot du 18/10** (6 graines × 8 entreprises × niveaux 1/4/8 = 144 parties par mode, 0 erreur, 0 partie bloquée) :

  | Mode | Niv. 1 | Niv. 4 | Niv. 8 | Fusions par partie |
  |---|---|---|---|---|
  | Toutes les paires (hybrides) | 35 % | 19 % | 10 % | 0,47 |
  | Seulement identiques | 33 % | 12 % | 4 % | 0,09 |
  | Aucune fusion | 33 % | 12 % | 2 % | 0 |

  Les hybrides aident un peu, surtout aux niveaux 4 et 8, sans écraser le jeu : pas de paire dominante (le plus fréquent apparaît dans 6 parties sur 144, 40 hybrides différents). Les fusions restent rares (moins d'une par partie) : il faut deux niveaux 3 et 8 ◆. Business reste à 2 % du plateau chez le bot, qui juge sur le score et pas sur l'argent. La prime de synergie (+30 %) n'est pas ajoutée.
- **Bot avec le coût qui monte** (même série) : 35 % / 12 % / 12 %, 0,40 fusion par partie. Écart dans le bruit de 48 parties : la fusion reste un bonus modeste, plus chère sans devenir inutile.

## Premier Plugin (décision du 16/10)
On **garde le choix** du premier Plugin parmi 3 tirés au hasard (plutôt qu'un Plugin imposé) : on s'adapte au tirage sans subir un départ raté. Si un Plugin est toujours pris, c'est un problème d'équilibre à corriger. Réglages possibles, **non décidés** : seulement des communs au départ ; 3 Plugins d'axes différents (économie, production, réactivations) ; tirage orienté selon l'entreprise.

## Interface
- Ordinateur, tout sur un écran : colonne de gauche (contrat, Déployer, journal sur la hauteur restante) ; colonne de droite (Plugins, plateau sur toute la hauteur, tiroir vertical à droite).
- **Téléphone, tout sur un écran (v74)** : la page ne défile plus. De haut en bas : bandeau contrat, formule Compute × Scale, Plugins, plateau (prend toute la hauteur restante), tiroir compact sur une ligne, barre Boutique / Fusion / Déployer. Pas de journal d'exécution sur téléphone (ni onglet). Petits écrans (hauteur ≤ 700 px) : la barre des goodies, les noms des Plugins et le mot « Ouvrir » des cases sont masqués.
- **Boutique sur téléphone : écran plein par-dessus le plateau** (même composant que la fenêtre ordinateur), en-tête Boutique + argent fixe, bas fixe avec Relancer et Retour au plateau. Version dense : arrivage en 2 colonnes, goodie compact, Plugins en 2 colonnes. Elle s'ouvre avec le bouton et automatiquement après chaque contrat, comme sur ordinateur. Les colis et paquets s'ouvrent par-dessus.
- **Choix du premier Plugin (v79)** : même disposition que l'ouverture du colis, sur ordinateur et téléphone. Les 3 Plugins en grandes cartes complètes, 3 de front sur ordinateur, 2 + 1 sur téléphone ; toucher une carte l'entoure en ambre ; bouton « Commencer avec : nom » dessous (collé en bas de l'écran sur téléphone). Pas de bouton Passer. Composant `PickStarter` (classes du colis `box-cards`, `box-card`, `pack-take`) + styles `pick-box`. Les styles `mobile-pick` restent utilisés par la récompense de fin de version (`RewardMobile`).
- **Récompense de fin de version sur téléphone (v77)** : écran plein, sans défilement. Titre du contrat livré, Performance et paiements en pastilles, prochain contrat, les 3 Plugins du recrutement côte à côte, les autres récompenses en tuiles, panneau de détail de la sélection, barre fixe « Ne rien prendre » / « Prendre ». Plugins pleins : avertissement et boutons « Vendre ». Composant `RewardMobile` (appelé par `RewardModal` quand l'écran fait 700 px de large ou moins), styles `mobile-reward`.
- **Fiche d'un module sur téléphone : panneau qui monte (18/10, remplace l'écran plein de la v80)**. Le plateau reste visible et assombri derrière ; poignée en haut ; module qui flotte (contour lumineux, broches dorées) ; nom, pastilles de famille, « Producteur · case n » et texte d'ambiance dans l'en-tête ; Data en haut à droite. Corps qui défile, bas fixe avec le bouton principal (améliorer, choisir A ou B, passer en 2.x ; plus de fusion), puis Vendre et **Retour au plateau**. Toucher le fond ferme la fiche. Composant `ModuleSheetMobile` (garde la classe `module-sheet` pour le tutoriel), styles `mobile-module`. Ordinateur : fenêtre au centre, `ModuleInspector`.
- **Chiffres des descriptions (v81)** : chaque chiffre suivi d'une ressource devient une pastille colorée : Compute cyan, Scale rouge (#ff5a6e), Data et ◆ violet, $ ambre. Fonction `FX(texte)` (`src/ui/fx.jsx`, styles `fx`). Pas encore : texte des éditions dans les offres de la boutique.
- **Achat d'un emplacement (v83)** : toucher une case « Ouvrir » ouvre une fenêtre de validation. Case grisée sans l'argent. Sur téléphone, prix masqué sur les cases. Composant `UnlockAsk`, styles `unlock-ask`.
- **Confirmation de nouvelle run (v84)** : Loup Niel inquiet, phrase tirée parmi 7 (`QUIT_LINES`), boutons « Je reste » et « Nouvelle run ». Composant `QuitConfirm`, styles `quit-modal`.
- **Vente d'un Plugin avec confirmation (17/10)** : sur la rangée, « Vendre » est petit et neutre (il était large et vert, et partait au premier clic). Toucher ouvre « Vendre *nom* ? » avec Annuler et « Vendre +N $ ». Même confirmation sur la fiche du Plugin et sur l'écran de récompense. Un seul composant, `SellConfirm` (`src/ui/plugins/SellConfirm.jsx`), affiché à la racine de `App` (z-index 70, au-dessus de la fiche). Fonction `askSell` dans `App.jsx`. Styles `18-sell-confirm.css`. Les modules se vendent encore sans confirmation (à valider).
- **Achat d'un module sans place (17/10, règle validée)** : un module acheté (ou reçu en récompense) va sur le plateau ; si le plateau est plein, il est **rangé dans le tiroir** (message « rangé dans le tiroir (plateau plein) »). Si le plateau et le tiroir sont pleins, les offres de modules sont grisées et un bandeau ambre dit « Plus de place : vends un module ou ouvre un emplacement. » Paquets, goodies et Plugins restent achetables. Fonctions `placeNewModule`, `hasRoomForModule`, `NO_ROOM_TEXT` (`src/engine/run.js`), propriété `noRoom` de la boutique, styles `19-shop-noroom.css`. Référence des tests régénérée (45 parties sur 96 changent, surtout le texte du message ; 3 changent d'issue car le joueur automatique remplit le tiroir).
- **Fiche d'un module sur ordinateur sans double cadre (17/10)** : la fenêtre autour de la fiche ne dessine plus rien ; la fiche (`.inspector`) prend le style « boîte » (bordure noire, ombre). Voile, clic à côté, Échap et croix inchangés. Styles dans `05-desktop-layout.css` (`.modal.module-modal`).
- **Pastille « amélioration possible » (17/10)** : deux chevrons empilés dans un rond **vert**, coin bas-droit d'une tuile du plateau (la fusion garde son rond violet, coin bas-gauche). Elle apparaît quand le module peut progresser maintenant : assez de Data (ou amélioration gratuite) pour un module niveau 1-2 ou fusionné pas encore en version finale. Un module niveau 3 sans spécialisation la reçoit aussi (« Spécialisation à choisir », gratuit). **Une seule pastille par tuile : la fusion est prioritaire.** Elle suit la Data : elle disparaît quand elle manque. Fonction pure `upgradeAvailability` (`src/engine/run.js`, même règle que l'action `UPGRADE`, testée), propriété `upgradable` du plateau, styles `20-upgrade-dot.css`. Affichage seulement : règles et référence des tests inchangées. Pas encore fait : rappel dans le tutoriel (étape « améliorer »).
- **Bulle du tutoriel sur le côté (17/10)** : quand la zone éclairée occupe plus de 60 % de la hauteur de l'écran (fiche d'un module sur ordinateur), la bulle de Loup Niel se place sur le côté le plus libre au lieu de recouvrir la fiche (elle cachait le bouton « Améliorer » depuis le passage à un seul cadre). Si la place latérale est inférieure à 260 px, ancien comportement. Téléphone et tablette inchangés. Classe `tz-card side`.
- **Valeur réelle avec une édition (v85)** : la fiche d'un module producteur montre sa vraie production avec l'édition (Machine Learning, Optimisée, Bêta) et la famille. Même ordre que le moteur : base, × édition (arrondi), × famille. Fonctions `productionBreakdown`, `fmtOutput`, `editionNote` (`src/ui/module/Production.jsx`).
- **Déplacement uniquement en glisser-déposer, ordinateur et téléphone.** Un clic/toucher sur un module ouvre sa fiche ; sur une case vide, la ferme.
- Boutique ouverte automatiquement après chaque contrat (A, B : après la pop ; C : après la récompense du boss), sauf « Boutique fermée ».
- Portable 1366×768 : la page défile un peu ; Déployer sort de l'écran (à traiter si besoin). Sur ordinateur, l'écran de fusion se ferme avec « Continuer », sur téléphone avec « Retour au plateau ».
- Petits restes : goodies invisibles en jeu sur petit écran. Écrans pas encore vérifiés sur téléphone : victoire et défaite de fin de partie, atelier de fusion avec beaucoup de modules.

## Points relevés pendant la reconstruction (17/10)
- **Dette technique** (`executeDeploy`, fin de déploiement) : le module détruit est cherché dans les cases 16 à 1 seulement, un reste du plateau 4×4. Sur le 5×5, les cases 17 à 25 ne sont jamais détruites. À corriger (règle à valider).
- Deux constantes ne servent plus : `DEFAULT_UNLOCKED` et `LEGACY_SLOTS` (`src/engine/run.js`).
- Le bot d'équilibrage d'origine est perdu. Le joueur automatique des tests (`tests/support/player.js`) peut servir de base pour le refaire.

## Ordre des étapes suivantes
1. ~~Niveaux de famille et paquets~~
2. ~~Plugins de formes et de familles, colis~~ — équilibrage au bot.
3. ~~Plateau 5×5~~
4. ~~Tiroir~~ — fusion depuis le tiroir.
5. ~~Boss trou~~
6. ~~Tutoriel avec Loup Niel~~ — retours des testeurs ; puis bulles « la première fois » et wiki de Loup Niel.
7. Consommation des modules (maquette à valider, puis intégration).
8. Sockets et puces (colis à étiquette violette).
9. ~~Fusion hybride~~ (18/10) — équilibrage au bot à poursuivre (voir la section dédiée).
10. Modules et Plugins manquants.
