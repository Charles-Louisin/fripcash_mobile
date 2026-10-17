# Photos manquantes par rapport aux maquettes

Les fichiers d’origine des planches `design_mobile/` ne sont pas des assets découpés. Les écrans utilisent donc des photos locales de remplacement, stables, dans `assets/catalog/` et `assets/universes/`.

Ce ne sont pas les clichés exacts des maquettes. La composition, les sujets et la lumière s’en rapprochent.

## Remplacements en place

- Bannière d’accueil : `assets/catalog/promo-banner.jpg` (boutique mode, pas le packshot sac + baskets + vase).
- Univers : `assets/universes/*.jpg` (seconde main, articles neufs, quartier, enseignes).
- Dressings, avatars, produits mode, commerces, supermarché et épicerie : fichiers de `assets/catalog/`.
- Logos (Chez Clara, Kicks, Tech+, Aminata, Conakry Market, etc.) : monogrammes dessinés, pas des fichiers de marque.

## Écarts encore visibles

- Pas de portrait avec foulard ocre pour Aïssata / Fatou : portraits génériques.
- Pas de devanture peinte « BOUTIQUE MAMADOU » ni d’enseigne lumineuse « Conakry Market ».
- Pas de sac de riz « Cap Guinée », de bouteille « Aya » ni de paquet « Omo ».
- Le médaillon « Jusqu’à -50% » est posé sur la photo, sans objets détourés à droite.
- Horaires d’ouverture absents de l’API : le badge « Ouvert aujourd’hui » est un état par défaut, « Fermé à 19h » uniquement sur l’exemple Marché Kadi.
- « Suivre » réutilise le like boutique déjà existant. Il n’y a pas d’abonnement serveur séparé.
- Les compteurs « 14 000+ articles », « 12 000+ », « 3 000+ boutiques » et « 500+ enseignes » de l’accueil sont les libellés éditoriaux des maquettes. Les listes d’univers affichent le nombre réel, ou les fiches d’exemple si l’API ne renvoie aucune boutique.
