# Breakpoint · notes issues de la première conversation

Document historique. Pour l'état actuel, voir [etat-et-decisions.md](etat-et-decisions.md), qui prime en cas de contradiction. « Joker » se lit désormais « Plugin ».

## Projet
Roguelike deckbuilder en français, jouable dans le navigateur (surtout sur mobile). Thème IT/infrastructure, inspiré de Balatro mais avec sa propre identité « carte mère ». Le joueur pose des modules sur un plateau, les déploie, et doit atteindre l'objectif de chaque contrat.

## Comment on travaille
- L'utilisateur écrit en français. Il aime : discuter, voir une maquette sur le canvas, valider, puis intégrer, tester, publier.
- Ne rien coder tant que la règle ou la fiche n'est pas validée.
- Toute nouvelle fonctionnalité est équilibrée au bot (simulation) avant livraison.
- Les propositions doivent être visuelles (maquettes), pas seulement des listes.

## Liens
- Ancienne version publiée (artifact) : https://claude.ai/artifact/4xtgfFensDYA8nvK7CYF5C
- Canvas de maquettes : https://claude.ai/artifact/YVrWf2fA7A1gMk6EGzyqLb (pages : Socket et puces, Entreprises, Fusion, Goodies, Écrans, Explorations)

## Technique (à l'époque)
- Moteur pur (`executeDeploy`, `runReducer`), aléatoire à graine, sauvegardes localStorage. Interface React.
- Tests d'origine : moteur 77, partie 74, sauvegarde 7, progression 6. Ces sources ont été perdues ; voir le README pour la reconstruction.
- Les modules ont 3 niveaux, une spécialisation A/B au niveau 3, puis une fusion 2.0 (2 modules identiques niveau 3).

## Règles en vigueur
- 5 familles : Calcul (Compute), Stockage (Data), Réseau (Scale), Business ($), Ops (réactivations). 20 modules.
- Les réactivations rejouent Compute, Scale, Data et $. Un module gagne au plus 3/4/5 $ par déploiement par réactivations (niveau 1/2/3). Chaîne limitée à 2 niveaux (3 pour l'Agence web). Garde-fou : 1 000 activations par déploiement.
- Goodies (comme les vouchers de Balatro) : 14, un seul proposé par version, prix fixe 12 $ (niveau 1) et 18 $ (niveau 2).
- 8 entreprises (comme les decks) : Start-up, Banque, Labo IA, Agence web, Scale-up, Administration, ESN, Cloud provider. 8 difficultés chacune (comme les stakes). Certaines se débloquent par des exploits.
- Éditions des modules, sons chiptune avec bouton muet, écran de fusion dédié avec pastille.
- La Clé USB et le Disque externe (goodies) ont été retirés : trop forts.
- Équilibre mesuré : environ 13 % de victoires du bot en environnement 8.

## Objectif : la profondeur de Balatro
Constat : les parties se ressemblent (toujours Serveurs + Base + Workers). On veut des builds complètement différents selon ce qu'on tire, comme Balatro.

Décisions prises :
- Un catalogue de 50 modules « +X par Y » a été jugé peu convaincant. On part sur des builds, pas sur des modules en plus.
- Plateau 5×5 avec terrains en forme (Croix, Couloir, Anneau, Escalier, Bloc, Archipel), tiré au hasard à chaque partie, pas lié à l'entreprise.
- Les formations obligatoires à choisir (Paire, Rangée, Carré…) ont été écartées : le plateau est permanent, il n'y a pas de « main » comme dans Balatro.
- Les formations vivent comme conditions de Plugins (« +Scale si 3 modules de même famille sont alignés »).
- Les planètes de Balatro deviennent des patchs de famille : objet de boutique tiré au hasard qui monte une famille entière. Chaque famille monte sa propre ressource (Calcul : Compute, Stockage : Data, Réseau : Scale, Business : $ et Scale, Ops : profondeur de chaîne).

Idées maquettées (valeurs en exemple, non validées) :
- Socket par module avec des puces à y poser (Distribuée, Économe, Tampon, Jumelle, Chiffrée, Surcadencée, Réactive, Convertisseuse, Mutante), en 3 raretés.
- Niveau 2 à choix (Renfort ou Extension avec 2e socket), puis spécialisation au niveau 3.
- Fusion hybride entre 2 modules différents (10 hybrides selon les familles, 2 sockets), en plus de la fusion pure.

Écarts avec Balatro (à combler) :
- Plugins : environ 25 à l'époque contre 150. Il en faudra une centaine, dont beaucoup réagissant aux formes et aux familles.
- Un seul boss final : il faut un boss différent par version.
- Pas de consommables ni de paquets (les paquets de mises à jour et les colis sont arrivés depuis).

## Questions en suspens (à l'époque)
- Patchs de famille : pourcentage ou valeur fixe ? Le +90 % au niveau 10 est-il assez fort ?
- Le plateau 5×5 est-il lisible sur téléphone ?
- Fonction du niveau 2 (Renfort ou Extension) : à valider.
- Petit ajustement en attente : reformuler le texte du Datacenter en « chaque Serveur ou Datacenter voisin ».
