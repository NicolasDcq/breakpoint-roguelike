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
2 emplacements au départ, 6 au maximum. Glisser-déposer dans les deux sens, même tuile que le plateau. Extension : 20/40/70/110 $ + 1 goodie consommé (à confirmer). Non fait : fusion depuis le tiroir.

## Étape 4 bis : boss trou — INTÉGRÉ
Une case ouverte devient un trou au début du contrat ; son module part au tiroir ou est détruit si le tiroir est plein. Plafond : 1 (niveaux 1-7), 2 (incident), 4 (infini).

## Étape 5 (maquette seule) : consommation des modules — À VALIDER
Chaque module actif coûte de l'argent à la fin de chaque contrat ; tout reste utilisable. Les 3 premiers $ de consommation sont offerts. Un module rangé dans le tiroir ne consomme rien. Maquette : page « Économie · consommation ». Non intégré dans le jeu.

## Tutoriel avec Loup Niel — INTÉGRÉ (v76, 17/10)
Objectif : faire tester le jeu à des nouveaux joueurs sans les lancer dans le grand bain.
- **Partie d'entraînement à part, avant la vraie** (décision de l'utilisateur) : bouton au menu ; au premier lancement, encart « Première fois ? » avec Loup Niel et « Lancer le tutoriel » ; ensuite, bouton discret « Tutoriel avec Loup Niel » sous Jouer. Rien n'est enregistré pendant le tutoriel (pas de sauvegarde, pas de progression du profil). À la fin ou si on passe : retour au menu (ou reprise de la vraie partie sauvegardée s'il y en a une). Marqueur `localStorage['breakpoint.tutoDone']`.
- Partie fixée : graine 424242, Start-up, difficulté 1, premier Plugin imposé (le Stagiaire). Objectifs abaissés : A 30, B 40, C 45 (un joueur qui n'optimise rien passe à 48). Arrivage forcé « colis + paquet ». L'argent et la Data sont complétés juste ce qu'il faut aux étapes d'achat. **Cadeau de fusion** : à la Version 2, deux Serveurs passent au niveau 3 (créés s'il en manque) pour faire une vraie fusion.
- **Guide : Loup Niel**, loup CTO de l'entreprise où le joueur vient d'être engagé. Style mascotte simple validé : dessin vectoriel rond façon Jimbo, gros contour noir, fourrure gris-bleu, lunettes rondes, sweat bleu nuit badge « CTO », **cheveux courts châtain clair**. 9 poses (neutre, salut, il explique, il réfléchit, bravo, inquiet, surpris, alerte boss, pause café), en SVG dans `src/tutorial/loupNielSprites.js`. Source : `tools/loup-niel-sprite.py` (fonction `svg(nom)`).
- Fonctionnement : le reste de l'écran s'assombrit, la zone expliquée reste éclairée (contour ambre qui pulse) et seule elle répond au toucher. Bulle en haut ou en bas selon la zone ; sur l'écran de récompense mobile, juste au-dessus de la barre du bas. Étapes « Suivant » et étapes « à faire » (détectées sur l'état du jeu). Quand le joueur doit jouer librement (déployer, choisir une récompense, fermer un écran), une petite bulle de consigne non bloquante s'affiche ; elle passe en haut quand un écran du jeu est ouvert (colis, paquet, fusion). Le tutoriel fait défiler jusqu'à la zone éclairée si elle est hors écran. En cas d'échec : Loup Niel inquiet, « Recommencer » ou « Terminer ».
- **22 étapes** : contrat A (accueil, objectif et 3 déploiements, ordre des numéros, 5 familles, fiche d'un module *, glisser *, Compute × Scale et prévu, Déployer *) · boutique après A (deux monnaies, colis *, acheter un module *, ouvrir une case *) · contrat B (Plugins et leur ordre, améliorer un module *) · boutique après B (paquet de mises à jour *) · contrat C (tiroir, contrainte du boss) · récompense de fin de version · goodies · Version 2 (spécialisation niveau 3 *, fusion *) · fin. (* = à faire.)
- Code : `src/tutorial/` — composant `TutorialOverlay` (portail sur `body`), tableau `TUTO_STEPS`, `startTutorial()`, `endTutorial()`, `fusionGift()` ; actions du reducer `TUTO_SET` et `TUTO_PATCH` ; drapeau `tuto` sur l'état (sauvegarde `saveRun` et profil ignorés). Styles `src/styles/14-tuto-style.css` (classes `tz-*`).
- **Pas encore fait** : bulles « la première fois » hors tutoriel (première fusion possible, édition, réactivation en chaîne, trou de boss, boutique fermée, entreprise débloquée) et le wiki de Loup Niel (une fiche par notion sur le bouton ?).
- Maquette : page « Tutoriel » du canvas.

## Premier Plugin (décision du 16/10)
On **garde le choix** du premier Plugin parmi 3 tirés au hasard (plutôt qu'un Plugin imposé) : on s'adapte au tirage sans subir un départ raté. Si un Plugin est toujours pris, c'est un problème d'équilibre à corriger. Réglages possibles, **non décidés** : seulement des communs au départ ; 3 Plugins d'axes différents (économie, production, réactivations) ; tirage orienté selon l'entreprise.

## Interface
- Ordinateur, tout sur un écran : colonne de gauche (contrat, Déployer, journal sur la hauteur restante) ; colonne de droite (Plugins, plateau sur toute la hauteur, tiroir vertical à droite).
- **Téléphone, tout sur un écran (v74)** : la page ne défile plus. De haut en bas : bandeau contrat, formule Compute × Scale, Plugins, plateau (prend toute la hauteur restante), tiroir compact sur une ligne, barre Boutique / Fusion / Déployer. Pas de journal d'exécution sur téléphone (ni onglet). Petits écrans (hauteur ≤ 700 px) : la barre des goodies, les noms des Plugins et le mot « Ouvrir » des cases sont masqués.
- **Boutique sur téléphone : écran plein par-dessus le plateau** (même composant que la fenêtre ordinateur), en-tête Boutique + argent fixe, bas fixe avec Relancer et Retour au plateau. Version dense : arrivage en 2 colonnes, goodie compact, Plugins en 2 colonnes. Elle s'ouvre avec le bouton et automatiquement après chaque contrat, comme sur ordinateur. Les colis et paquets s'ouvrent par-dessus.
- **Choix du premier Plugin (v79)** : même disposition que l'ouverture du colis, sur ordinateur et téléphone. Les 3 Plugins en grandes cartes complètes, 3 de front sur ordinateur, 2 + 1 sur téléphone ; toucher une carte l'entoure en ambre ; bouton « Commencer avec : nom » dessous (collé en bas de l'écran sur téléphone). Pas de bouton Passer. Composant `PickStarter` (classes du colis `box-cards`, `box-card`, `pack-take`) + styles `pick-box`. Les styles `mobile-pick` restent utilisés par la récompense de fin de version (`RewardMobile`).
- **Récompense de fin de version sur téléphone (v77)** : écran plein, sans défilement. Titre du contrat livré, Performance et paiements en pastilles, prochain contrat, les 3 Plugins du recrutement côte à côte, les autres récompenses en tuiles, panneau de détail de la sélection, barre fixe « Ne rien prendre » / « Prendre ». Plugins pleins : avertissement et boutons « Vendre ». Composant `RewardMobile` (appelé par `RewardModal` quand l'écran fait 700 px de large ou moins), styles `mobile-reward`.
- **Fiche d'un module sur téléphone : écran plein (v80)**. En-tête fixe, corps qui défile, bas fixe avec le bouton principal (améliorer, choisir A ou B, fusionner, passer en 2.x), puis Vendre et **Retour au plateau**. Composant `ModuleSheetMobile` (garde la classe `module-sheet` pour le tutoriel), styles `mobile-module`. Ordinateur : fenêtre au centre, `ModuleInspector`.
- **Chiffres des descriptions (v81)** : chaque chiffre suivi d'une ressource devient une pastille colorée : Compute cyan, Scale rouge (#ff5a6e), Data et ◆ violet, $ ambre. Fonction `FX(texte)` (`src/ui/fx.jsx`, styles `fx`). Pas encore : texte des éditions dans les offres de la boutique.
- **Achat d'un emplacement (v83)** : toucher une case « Ouvrir » ouvre une fenêtre de validation. Case grisée sans l'argent. Sur téléphone, prix masqué sur les cases. Composant `UnlockAsk`, styles `unlock-ask`.
- **Confirmation de nouvelle run (v84)** : Loup Niel inquiet, phrase tirée parmi 7 (`QUIT_LINES`), boutons « Je reste » et « Nouvelle run ». Composant `QuitConfirm`, styles `quit-modal`.
- **Vente d'un Plugin avec confirmation (17/10)** : sur la rangée, « Vendre » est petit et neutre (il était large et vert, et partait au premier clic). Toucher ouvre « Vendre *nom* ? » avec Annuler et « Vendre +N $ ». Même confirmation sur la fiche du Plugin et sur l'écran de récompense. Un seul composant, `SellConfirm` (`src/ui/plugins/SellConfirm.jsx`), affiché à la racine de `App` (z-index 70, au-dessus de la fiche). Fonction `askSell` dans `App.jsx`. Styles `18-sell-confirm.css`. Les modules se vendent encore sans confirmation (à valider).
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
9. Fusion hybride.
10. Modules et Plugins manquants.
