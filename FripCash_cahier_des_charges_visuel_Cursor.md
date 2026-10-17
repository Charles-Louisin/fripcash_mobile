# FripCash — Cahier des charges visuel ultra détaillé pour Cursor

## Objectif non négociable

Reproduire l’interface mobile FripCash à partir des maquettes de référence : **Accueil**, **Univers Seconde main**, **fiche Dressing**, **Univers Articles neufs**, **fiche Enseigne**, **Univers Boutiques de quartier**, **fiche Boutique de quartier**, **liste des Enseignes** et **fiche boutique d’articles neufs** du dossier "fripcash_design.

Le résultat doit donner l’impression d’être la même application que les maquettes : même langage visuel, mêmes proportions, densité, hiérarchie, formes, alignements, photos éditoriales, cartes, badges, icônes et navigation. Ne pas se contenter d’une page d’accueil approximative. Les pages listes ET les fiches de détails sont toutes requises.

**Important :** les images fournies montrent aussi des planches de présentation autour des écrans. Il faut reproduire **l’interface à l’intérieur des écrans de téléphone**, et non les planches de présentation : ne pas créer les titres externes « Univers 1 », « Univers 2 », etc. dans l’application, ne pas afficher les deux téléphones côte à côte et ne pas dessiner de cadre de téléphone autour de l’interface.

La reproduction exacte des photos n’est pas possible à partir de texte seul. Si les fichiers originaux ne sont pas présents dans le projet, utiliser des photos locales déjà disponibles ou des images de stock stables et très proches de la description de chaque visuel ci-dessous. Ne jamais remplacer les photos par des aplats de couleur, des emojis, des rectangles vides ou la même photo répétée partout.

---

# 1. Instructions à suivre avant de coder

1. Inspecter le projet et identifier le framework réellement utilisé, le routeur, les écrans déjà existants, le système d’authentification, les composants partagés, les sources de données et la navigation. **Ne pas remplacer la stack, ne pas réécrire le projet et ne pas casser les API existantes.**
2. Réutiliser les routes, modèles, hooks et données déjà disponibles. Les contenus de ce document sont la référence visuelle et des données d’exemple pour les cartes ; ils ne doivent pas justifier la création d’un backend parallèle.
3. Créer un système de composants communs : en-tête, recherche, filtres, carte univers, carte produit, carte boutique, ligne de notation, badge d’état, fiche boutique, grille produits et barre de navigation basse.
4. Implémenter tous les écrans listés dans ce document. Ne pas déclarer le travail terminé après l’accueil ou après avoir construit une seule variante de fiche.
5. À la fin, lancer l’application, vérifier visuellement les écrans et corriger les écarts. Ne pas s’arrêter à une compilation réussie.
6. Si une route ou une donnée métier n’existe pas, construire le composant d’interface proprement et signaler clairement ce qui est relié aux données réelles et ce qui reste en exemple. Ne pas inventer de fonctionnalités serveur.

## Ordre de priorité

1. Silhouette, proportions et mise en page.
2. Couleurs, typographies et arrondis.
3. Photos, recadrages et overlays.
4. Cartes, badges, icônes, lignes secondaires et détails typographiques.
5. États actifs, interactions et états vides/chargement.

---

# 2. Système visuel global

## 2.1 Ambiance

Style **marketplace premium, chaleureux, éditorial et accessible**, avec une identité terracotta/caramel et crème. L’impression générale est lumineuse, douce, soignée et commerciale. Ce n’est ni une interface bancaire froide, ni un dashboard d’administration, ni un thème noir/blanc générique.

La page est majoritairement crème, les cartes sont blanches ou ivoire, les actions principales et prix sont couleur terre cuite, le texte principal est brun très foncé. Les photographies ont une lumière chaude, naturelle, proche d’un catalogue lifestyle.

## 2.2 Palette de départ

Les valeurs ci-dessous sont des **approximations de départ** à ajuster à l’œil à partir des maquettes. Les réutiliser via des variables/tokens, plutôt que de choisir une couleur différente à chaque composant.
Utiliser les couleurs deja definie dans le code actuel.

- Fond général ivoire : `#FFFAF6` (variante acceptable : `#FFF8F2`).
- Surface des cartes : `#FFFFFF` ou `#FFFEFC`.
- Surface secondaire crème : `#FBF0E8`.
- Fond des champs et chips neutres : `#F8EEE7`.
- Terracotta principal / action : `#BF5B3D`.
- Terracotta clair : `#D17151`.
- Terracotta pâle / badge : `#F6DED2`.
- Texte principal : `#241412`.
- Texte secondaire : `#81736E`.
- Texte tertiaire / séparateur : `#B9A9A0`.
- Bordure douce : `#F0E4DC`.
- Étoile et notation : `#F2B51C`.
- Statut ouvert : vert doux `#54A968`.
- Fond de badge sombre sur photo : brun/noir avec transparence approximative de 45 à 60 %.

Éviter le rouge vif, le orange fluo, les violets/bleus dominants, les ombres grises très fortes et les bordures noires.

## 2.3 Typographies

Deux rôles typographiques doivent être distincts :

- **Titres éditoriaux / grands titres de pages :** une serif élégante de type *Playfair Display* ou équivalent proche. Utiliser une graisse moyenne à forte, avec un contraste visible entre pleins et déliés. Elle apparaît dans les titres de certaines pages d’univers et dans les noms de certaines enseignes/boutiques.
- **Interface, cartes, descriptions, boutons, prix et navigation :** une sans-serif propre de type *Inter*, *DM Sans* ou l’équivalent déjà installé. Les titres fonctionnels et les noms de produits sont plutôt semi-gras.
- Le logo « FripCash » est en sans-serif grasse, terracotta.

Ne pas appliquer la serif à tout le texte. Ne pas utiliser une police futuriste, condensée ou très géométrique.

Échelle indicative sur un écran mobile de largeur 390 dp :

- Grands titres de page : 27–32 dp, serif, graisse 600–700.
- Titres de section (ex. « Nouveautés ») : 20–23 dp, sans-serif, graisse 700.
- Nom d’une boutique en fiche : 21–25 dp, serif ou sans-serif selon l’écran de référence.
- Nom de boutique sur carte : 13–15 dp, graisse 650–700.
- Titre produit : 11–13 dp, graisse 500–600.
- Description et localisation : 12–14 dp.
- Prix : 13–15 dp, terracotta, graisse 700.
- Méta-informations : 10–12 dp.
- Navigation basse : 10–12 dp.

Les textes secondaires doivent rester lisibles, mais la page d’accueil est volontairement dense : ne pas grossir toutes les cartes au point de n’en montrer que deux à l’écran.

## 2.4 Grille, espacements et tailles

Prendre comme base un écran mobile d’environ **390 × 844 dp**, avec prise en compte de la safe area du système. Garder une mise en page mobile-first et fluide.

- Marge horizontale principale : 14–18 dp, généralement 16 dp.
- Espacements fréquents : 4, 8, 12, 16, 20, 24 dp.
- Entre un titre de section et ses cartes : 8–12 dp.
- Entre sections : 18–24 dp.
- Champ de recherche : environ 44–48 dp de haut.
- Chips de catégorie : environ 32–38 dp de haut.
- Rayon des champs/chips : pilule, donc 18–24 dp.
- Cartes produit : rayon 12–16 dp.
- Grandes cartes photo et bannières : rayon 16–22 dp.
- Boutons circulaires sur les photos : 32–42 dp.
- Cartes de fiche/bottom sheet : rayon de 20–28 dp lorsqu’un grand panneau blanc remonte sur la photo.
- Ombres : très diffuses, légères, couleur brun chaud, jamais grises et lourdes.

Toutes les cartes d’une même grille doivent être alignées, avoir la même largeur et des marges régulières. Les prix, états et notes doivent rester à leur place d’une carte à l’autre.

## 2.5 Photographies et recadrage

Les photos sont une partie essentielle du design. Utiliser des visuels photographiques réalistes, avec lumière chaude, matières visibles, arrière-plans naturels, contraste suffisant pour les textes et une balance de blancs légèrement crème.

- Photos de produits : `cover`, sujet principal centré ou légèrement décalé, recadrage cohérent, aucun étirement.
- Photos de boutiques et dressings : les photos doivent montrer le commerce ou le portant lui-même, pas une nature morte abstraite.
- Bannières avec texte blanc : ajouter un dégradé sombre transparent sur le côté où le texte se trouve. Le dégradé doit se fondre dans la photo, pas créer un rectangle opaque.
- Utiliser un asset distinct pour chaque produit ou chaque commerce. Ne pas répéter une même image en changeant seulement le nom.
- Avatars : vrais portraits cadrés en cercle, bordure blanche autour du portrait lorsqu’il chevauche une photo.
- Logos de boutiques : image/logo dans un cercle ou une pastille blanche/crème, avec chevauchement sur la photo quand la maquette l’indique.
- Ajouter des placeholders soignés uniquement pendant le chargement. Pas de dégradé visible en remplacement permanent d’une photo disponible.

## 2.6 Icônes

Utiliser une seule famille d’icônes outline cohérente (Lucide ou la famille déjà présente dans le projet). Traits fins à moyens, généralement noirs/brun foncé. Actions principales en terracotta. Ne pas mélanger emojis, icônes 3D, pictogrammes pleins et icônes outline.

Icônes visuellement récurrentes : cloche, cœur, sac/panier, utilisateur, loupe, curseurs de filtre, flèche droite, flèche retour, partager, points de menu, maison, grille, plus, messages, épingle de localisation, étoile, boutique, vêtement, chaussures, téléphone/électronique, bouteille, panier de course, camion/livraison, QR code et scooter.

Les cœurs flottants sont généralement dans de petits cercles blancs avec une ombre très légère. Les flèches des cartes univers sont dans des cercles blancs plus grands.

## 2.7 Navigation basse

La barre de navigation basse est posée au-dessus du contenu, avec fond blanc/ivoire, contours et ombre très légers, coins fortement arrondis. Elle comporte cinq positions :

1. Accueil — maison.
2. Explorer — grille ou quatre carrés.
3. Action centrale « + » — bouton circulaire terracotta plus grand que les autres icônes, légèrement remonté.
4. Messages — bulle de discussion avec badge rond terracotta « 3 » dans les maquettes.
5. Destination finale — icône et libellé de la navigation existante.

L’élément actif utilise le terracotta pour l’icône et son libellé ; les autres sont brun/gris. La barre doit tenir compte de la safe area et ne pas cacher les derniers produits. Prévoir un padding de bas de liste au moins égal à la hauteur de la barre + safe area.

**Incohérence présente dans les références :** la capture d’accueil indique « Boutique » au dernier onglet, tandis que certaines captures d’univers affichent « Panier ». Ne pas inventer des destinations différentes au hasard : inspecter la navigation métier existante et conserver son comportement ; reproduire surtout la présentation commune et, si la navigation de l’application distingue réellement ces parcours, reprendre le libellé correspondant.

---

# 3. Écran Accueil

## 3.1 Structure verticale, de haut en bas

L’écran est défilable verticalement. L’en-tête et la barre basse encadrent le contenu. La capture présente, dans cet ordre :

1. En-tête logo et actions.
2. Recherche globale.
3. Grande bannière promotionnelle.
4. Section « Choisis ton univers » avec lien « Voir tout ».
5. Grille de quatre univers, 2 colonnes × 2 lignes.
6. Section « Nouveautés » et lien « Voir tout ».
7. Rangée de quatre produits.
8. Section « Boutiques à découvrir » et lien « Voir tout ».
9. Rangée de quatre boutiques.
10. Navigation basse fixe/flottante.

La première vue doit montrer une grande partie de la bannière et le début des univers ; en faisant défiler, les sections produits et boutiques apparaissent naturellement. Ne pas transformer la page en liste d’énormes cartes pleine largeur.

## 3.2 En-tête d’accueil

- Alignement horizontal, même ligne, marge latérale environ 16 dp.
- À gauche : marque composée d’un sac terracotta avec poignée, lettre « F » blanche au centre, puis texte « FripCash » en terracotta, sans-serif bold.
- À droite : cloche outline avec petit point de notification terracotta, cœur outline, sac/panier outline, avatar utilisateur dans un cercle terracotta avec pictogramme blanc.
- Icônes de taille voisine, espaces réguliers, avatar rempli en dernier.
- Hauteur visuelle de la ligne environ 44–52 dp.

## 3.3 Recherche globale

- Sous l’en-tête, marge verticale 10–14 dp.
- Fond crème légèrement plus foncé que la page, pas de bordure dure.
- Forme pilule, hauteur 44–48 dp.
- Loupe à gauche ; texte placeholder gris : **« Rechercher un article ou une boutique ... »** ; icône de réglages/curseurs à droite.
- Texte centré verticalement et aligné à gauche après la loupe.
- La recherche prend presque toute la largeur disponible.

## 3.4 Bannière promotionnelle

- Grande carte horizontale, coins arrondis de 18–22 dp, hauteur indicative 120–130 dp.
- Fond photo chaleureux : sac à main en cuir caramel, baskets blanches, vase clair et fleurs séchées, mobilier beige. La composition doit placer les objets à droite et laisser l’espace de texte à gauche.
- Ajouter un gradient crème/transparent derrière la zone de texte ; ne pas couvrir la photo entière.
- En haut à gauche : badge terracotta foncé « PROMOTION », texte blanc, majuscules, petite pilule.
- Titre sur deux lignes en serif noire, grand, très gras : **« Les belles trouvailles de la saison ! »**
- Sous-titre : **« Mode, maison, beauté... jusqu’à -50% »**, avec la partie « jusqu’à -50% » accentuée en terracotta et gras.
- Bouton terracotta en bas à gauche : **« Voir les offres »**, texte blanc, flèche vers la droite.
- À droite, superposé sur la photo, médaillon circulaire terracotta portant **« Jusqu’à -50% »** en blanc.
- Sous la bannière : indicateurs de carrousel centrés, un petit indicateur terracotta actif et plusieurs petits points crème/rosés.

## 3.5 Section « Choisis ton univers »

Ligne titre/lien : titre sans-serif bold à gauche, **« Choisis ton univers »** ; lien **« Voir tout → »** à droite en terracotta clair. Alignement vertical centré.

Grille 2 colonnes avec cartes photo de largeur égale. Espace horizontal 8–10 dp, vertical 8–10 dp. Cartes horizontales, hauteur environ 74–86 dp, rayon 14–18 dp.

Chaque carte contient : une photo de fond, un gradient sombre sur la zone de texte, textes blancs à gauche, pilule semi-transparente en bas à gauche et cercle blanc fléché vers la droite en haut/droite. Le cercle ne doit pas masquer le titre.

### Carte A — Seconde main
- Photo : portant de vêtements triés sur cintres en bois, pulls et chemises dans les tons camel, beige, rouille et crème.
- Titre : **« Seconde main »**.
- Sous-titre : **« Entre particuliers »**.
- Badge : **« 14 000+ articles »**.

### Carte B — Articles neufs
- Photo : sac à main neuf, sacs et accessoires présentés dans une boutique élégante.
- Titre : **« Articles neufs »**.
- Sous-titre : **« Boutiques et commerçants »**.
- Badge : **« 12 000+ articles »**.

### Carte C — Boutiques de quartier
- Photo : petite boutique de proximité chaleureuse, façade ouverte, plantes et marchandises.
- Titre : **« Boutiques de quartier »**.
- Sous-titre : **« Retrait près de chez toi ! »**.
- Badge : **« 3 000+ boutiques »**.

### Carte D — Enseignes
- Photo : sacs de shopping et boutiques de marques ou espace commercial propre et lumineux.
- Titre : **« Enseignes »**.
- Sous-titre : **« Livraison en ville »**.
- Badge : **« 500+ enseignes »**.

## 3.6 Section « Nouveautés » — produits

Ligne de section : **« Nouveautés »** à gauche, **« Voir tout → »** à droite. Afficher quatre cartes sur une seule rangée sur la largeur mobile de référence. Les cartes sont étroites et homogènes ; les textes peuvent aller à la ligne, mais ne doivent pas augmenter la hauteur d’une seule carte de manière incontrôlée.

Structure de chaque carte :

1. Surface blanche/ivoire arrondie.
2. Photo produit en haut, presque carrée ou légèrement portrait, `cover`.
3. Petit bouton cœur circulaire blanc superposé en haut à droite de l’image.
4. Nom produit sous l’image, texte sombre, gras modéré, sur 1–2 lignes.
5. État sous le nom, gris secondaire, 1 ligne si possible.
6. Prix terracotta, gras, toujours visible.

Contenu exact des quatre cartes :

- **Sac à main en cuir** — état **« Très bon état »** — **18 000 GNF**. Photo d’un sac structuré beige/camel, anses en cuir, fond crème.
- **Baskets blanches** — état **« Neuf avec étiquette »** — **25 000 GNF**. Photo de baskets blanches propres sur fond beige.
- **Parfum femme** — état **« Neuf »** — **35 000 GNF**. Flacon de parfum rosé/caramel, lumière de studio chaude.
- **Lunettes de soleil** — état **« Très bon état »** — **12 000 GNF**. Lunettes à monture écaille sur fond clair.

Les montants doivent être formatés avec des espaces de milliers et le suffixe « GNF ». Le prix constitue l’accent coloré de chaque carte.

## 3.7 Section « Boutiques à découvrir »

Ligne de section : **« Boutiques à découvrir »** à gauche et **« Voir tout → »** à droite. Quatre cartes sur une rangée, même logique d’alignement et de densité que les cartes produits.

Chaque carte comprend une photo rectangulaire en haut ; cœur dans un cercle blanc en haut à droite ; petit avatar/logo rond chevauchant le bord inférieur de la photo ; nom de boutique ; badge catégorie sur fond saumon très pâle ; ligne de notation avec étoile jaune, note et nombre d’avis.

Contenu exact :

- **Chez Clara** — badge **« Seconde main »** — note **4.8** — **(124)**. Photo d’un dressing/portant de vêtements dans des tons neutres. Petit avatar/logo rond « C. » rose clair.
- **Kicks Shop** — badge **« Boutique »** — note **4.6** — **(89)**. Photo de baskets, style boutique sneakers. Petit logo rond sombre avec « KICKS ».
- **Le Petit Marché** — badge **« Commerce local »** — note **4.9** — **(201)**. Photo de commerce de proximité verdoyant. Logo rond clair avec motif feuille.
- **Tech Plus** — badge **« Enseigne »** — note **4.7** — **(156)**. Photo d’électronique/téléphones dans une boutique. Logo rond blanc avec inscription « TECH+ ».

---

# 4. Univers 1 — Seconde main

L’écran de liste a un en-tête de marque global, une recherche spécialisée, un titre éditorial « Seconde main », une description, des filtres de catégories, puis une grille 2 × 2 de dressings. La barre de navigation basse est présente.

## 4.1 En-tête et recherche

- En-tête identique à l’accueil : logo FripCash à gauche, cloche avec point, cœur, sac, avatar à droite.
- Barre de recherche pilule : loupe à gauche, placeholder **« Rechercher un dressing, un quartier ... »**, curseurs de filtre à droite.
- L’espacement entre recherche, titre et catégories est confortable, mais pas excessif.

## 4.2 Titre et description

- Grand titre serif : **« Seconde main »**.
- Description sur deux lignes maximum : **« Des milliers de dressings de particuliers près de chez vous. »**
- Couleur du titre brun-noir ; description gris chaud.

## 4.3 Filtres

Rangée horizontale scrollable de chips pilules, icône à gauche et libellé :

- **Mode** — active : fond terracotta, texte et icône blancs.
- **Chaussures** — neutre, crème.
- **Électronique** — neutre, crème.
- **Maison** — neutre, crème.

Les chips sont distinctes, de hauteur similaire, légèrement espacées ; ne pas les afficher en boutons rectangulaires à angles droits.

## 4.4 En-tête de grille

- À gauche : **« Dressings à découvrir »**, sans-serif bold.
- À droite : **« Voir tout → »**, terracotta.

## 4.5 Cartes de dressing — grille 2 colonnes

Chaque carte est un bloc blanc, coins 12–16 dp, ombre légère. Image du dressing dans la moitié supérieure, format horizontal ; avatar de la personne en cercle avec bordure blanche chevauchant la limite inférieure de la photo. Sous l’image : nom, localisation avec icône épingle, puis note/avis et nombre d’articles avec petite icône sac.

Ordre et contenu des cartes :

1. **Dressing de Mamadou** — **Ratoma, Conakry** — étoile **4.8** — **(56)** — icône sac **120 articles**. Photo d’un portant avec chemises/pulls sur cintres ; avatar d’un jeune homme souriant, cheveux courts.
2. **Dressing de Aïssata** — **Matam, Conakry** — étoile **4.7** — **(42)** — **86 articles**. Photo d’un portant organisé dans un dressing chaleureux ; avatar d’une femme portant un foulard/hijab orange ou ocre.
3. **Dressing de Fatou** — **Dixinn, Conakry** — étoile **4.9** — **(73)** — **150 articles**. Photo de vêtements clairs et plantes d’intérieur ; avatar d’une femme en foulard coloré.
4. **Dressing de Mariama** — **Kaloum, Conakry** — étoile **4.6** — **(28)** — **64 articles**. Photo d’un portant avec sacs, vêtements et chaussures ; avatar d’une femme souriante.

Chaque carte a un cœur blanc rond posé en haut à droite de la photo. L’image doit conserver une hauteur constante sur les quatre cartes. Les lignes note/articles sont alignées au bas de la carte.

## 4.6 Fiche détaillée — Dressing de Mamadou

La fiche est une page dédiée défilable. L’en-tête de détail est transparent/superposé à la photo au sommet : flèche retour en cercle blanc à gauche, partager et menu « … » à droite. La photo de couverture est large et prend une portion importante du haut de l’écran.

### Couverture et identité

- Grande photo : portant à vêtements soigné, hauts suspendus sur cintres en bois, palette beige/caramel/rouille/vert, quelques plantes d’intérieur.
- Avatar circulaire de Mamadou chevauchant le bas gauche de la photo, bordure blanche épaisse ; petit point vert de présence en bas à droite du cercle.
- En dessous : nom **« Dressing de Mamadou »**, sans-serif bold.
- Phrase : **« Je vends ce que je ne porte plus ✨ »**, texte secondaire.
- Localisation : icône épingle terracotta + **« Ratoma, Conakry »**.
- À droite du nom ou dans la rangée de réputation : badge crème/saumon clair avec étoile jaune, **« 4.8 (56) »**.

### Ligne de statistiques et suivi

Sous l’identité, une ligne en trois zones séparées par de fins séparateurs verticaux :

- Icône sac, nombre **120**, libellé **« articles »**.
- Icône utilisateurs, nombre **340**, libellé **« abonnés »**.
- Bouton terracotta pilule **« Suivre »**, avec icône personne+.

Garder une ligne bien alignée, avec chiffres plus foncés et libellés plus petits/gris.

### Section produits du dressing

- Titre : **« Articles en vente »**.
- À droite : **« Trier »** avec petit symbole de réglage/tri.
- Grille de trois colonnes, deux rangées visibles dans la maquette. Cartes blanches, photo produit en haut, cœur blanc rond en haut à droite, badge **« Seconde main »** en petite pilule saumon pâle superposée au bas de la photo ; titre, prix terracotta, état gris.

Contenu exact des six cartes :

1. **Baskets Nike Air Force 1** — **250 000 GNF** — **Bon état**. Photo de baskets blanches.
2. **Sac à main en cuir** — **180 000 GNF** — **Très bon état**. Photo d’un sac à main en cuir camel.
3. **Robe longue fleurie** — **120 000 GNF** — **Bon état**. Photo d’une longue robe verte fleurie.
4. **iPhone 11 64 Go** — **1 800 000 GNF** — **Bon état**. Photo d’un téléphone sombre vu de dos.
5. **Veste en jean** — **150 000 GNF** — **Très bon état**. Photo d’une veste denim bleue.
6. **Sandales à talons** — **90 000 GNF** — **Bon état**. Photo de sandales noires à talons.

Ne pas faire une grille de deux colonnes ici : sur la fiche Dressing, les six cartes produit sont sur trois colonnes dans la maquette.

---

# 5. Univers 2 — Articles neufs

Cette section comporte une page « Articles neufs » avec une liste de boutiques, puis une fiche détaillée de boutique, ici « Boutique Aminata ». Le style est un peu plus éditorial et mode que celui des commerces alimentaires.

## 5.1 Page de liste — Articles neufs

### En-tête

- Flèche retour outline à gauche.
- Titre **« Articles neufs »** en serif, placé juste à côté de la flèche.
- Icône sac/panier outline à droite.
- Fond ivoire, sans grand bandeau coloré.

### Recherche

Champ pilule crème : loupe à gauche, placeholder **« Rechercher une boutique ou un article... »**, icône curseurs à droite.

### Catégories

Rangée de chips pilules, légèrement scrollable si nécessaire :

- **Mode** — active, fond terracotta et texte blanc.
- **Accessoires**.
- **Beauté**.
- **Maison**.
- **Électronique** — peut se reporter à la ligne suivante si la largeur réelle l’exige, comme sur la maquette.

Les icônes sont petites, alignées sur la ligne de base du texte.

### Titre de liste

- **« Boutiques à découvrir »** en sans-serif bold.
- À droite : **« Trier »** et icône de tri.

### Cartes de boutiques — liste verticale

Contrairement à l’accueil, cette liste est en cartes horizontales larges qui occupent presque toute la largeur. Chaque carte possède :

- Une photo large de boutique sur sa partie supérieure ou en arrière-plan, hauteur visuelle généreuse.
- Un voile crème translucide en bas, en forme de panneau doux, contenant le nom, la description, les avis et le nombre d’articles.
- Logo circulaire chevauchant la partie gauche de l’image/panneau.
- Cercle blanc avec flèche à droite du bandeau.
- Coins très arrondis, espace vertical autour de chaque carte.

Cartes, dans cet ordre :

1. **Boutique Aminata** — **« Mode femme · Élégance au quotidien »** — étoile **4.8** — **(324)** — icône sac **560 articles**. Image de campagne mode avec femme noire portant une tenue et un foulard africains aux tons ambre/terracotta, ambiance élégante.
2. **Tina Shop** — **« Beauté · Soin · Parfums authentiques »** — **4.6 (189)** — **320 articles**. Image de parfums/flacons cosmétiques sur surface beige chaude. Logo cercle crème avec monogramme « T ».
3. **Kadi Chic** — **« Accessoires · Sacs · Chaussures »** — **4.9 (412)** — **780 articles**. Image de sacs à main, lunettes et chaussures élégants. Logo cercle brun/noir avec monogramme « KC » doré.
4. **Maison Sira** — **« Décoration · Art de la maison »** — **4.7 (256)** — **450 articles**. Photo d’intérieur : objets de décoration, céramique et plantes. Logo cercle clair avec pictogramme maison.

La photo est le premier élément visuel de chaque carte. Garder une composition uniforme pour les quatre cartes.

## 5.2 Fiche détaillée — Boutique Aminata

### Couverture

- Grande photo mode plein largeur, hauteur environ 220–260 dp selon le viewport.
- Sujet : femme noire, yeux fermés ou regard baissé, portant un foulard africain et une tenue coordonnée dans les tons brun, orange et crème. Arrière-plan riche en terracotta et brun, lumière éditoriale chaleureuse.
- Sur la photo : bouton retour en cercle sombre/translucide en haut à gauche ; cœur en cercle sombre/translucide et partage en haut à droite.
- Texte éditorial en blanc, côté gauche de la photo : **« Élégance authentique au quotidien »**, réparti sur trois lignes ; petite ligne blanche horizontale sous le texte.

### Panneau d’identité

Panneau blanc/ivoire remontant légèrement sur le bas de la couverture, coins supérieurs très arrondis. Il se superpose visuellement à la photo plutôt que de commencer comme une section distante.

- Avatar/logo circulaire « A » avec petit motif feuille, cercle crème et bordure blanche, chevauchant la couverture à gauche.
- Bouton terracotta **« Suivre »** à droite.
- Nom en serif : **« Boutique Aminata »** avec petit badge vérifié terracotta.
- Ligne métadonnées : étoile terracotta et **4.8**, **« (324 avis) »**, séparateur vertical, icône sac et **« 560 articles »**.
- Description sur deux ou trois lignes : **« Une sélection d’articles neufs pour une femme moderne et élégante. Mode, accessoires et bien plus encore. »**

### Catégories de la boutique

Chips horizontales :

- **Mode** — active, terracotta.
- **Accessoires**.
- **Beauté**.
- **Nouveautés** — avec petite icône étincelles.

### Grille de produits

En-tête : **« Tous les articles (560) »** à gauche ; **« Filtrer »** et icône curseurs à droite.

Grille 3 colonnes. Chaque carte : photo, cœur dans un cercle blanc en haut à droite, nom, état **« Neuf »**, prix terracotta, petite action sac outline dans un mini-cercle très clair près du bas droit.

Six articles visibles :

1. **Sac à main élégant** — **Neuf** — **28 000 GNF**. Sac structuré brun/camel sur fond beige.
2. **Robe fluide** — **Neuf** — **32 000 GNF**. Robe rouge bordeaux sur fond clair.
3. **Parfum femme** — **Neuf** — **35 000 GNF**. Parfum couleur ambre/caramel.
4. **Baskets blanches** — **Neuf** — **25 000 GNF**. Baskets blanches sur fond neutre.
5. **Lunettes de soleil** — **Neuf** — **12 000 GNF**. Lunettes à monture écaille sur beige.
6. **Montre élégante** — **Neuf** — **40 000 GNF**. Montre dorée/rose gold sur fond crème.

---

# 6. Univers 3 — Boutiques de quartier

## 6.1 Page d’univers / liste des commerces

### En-tête

- Logo FripCash et mêmes quatre icônes d’action que l’accueil.
- Titre de page en serif : **« Boutiques de quartier »**.
- Description : **« Découvrez les commerces de votre quartier. »**
- Champ de recherche : **« Rechercher une boutique, un produit... »**, loupe à gauche, réglages à droite.

### Filtres par quartier

Chips horizontales : **Tous** (actif terracotta), **Matoto**, **Ratoma**, **Dixinn**, **Kaloum**, **Lambanyi**. Petites pilules ivoire ; toutes alignées sur une même ligne et défilables horizontalement au besoin.

### Compteur et tri

- Texte **« 32 boutiques près de chez vous »** à gauche.
- **« Trier par »** et chevron vers le bas à droite.

### Grille de boutiques — 2 colonnes

Chaque carte :

1. Photo de façade/intérieur de commerce, format horizontal.
2. Icône cœur dans un cercle blanc en haut à droite.
3. Badge d’ouverture superposé sur l’image, plutôt bas/gauche : vert avec petite coche blanche pour **« Ouvert aujourd’hui »** ; badge gris pour une boutique fermant plus tard.
4. Nom de boutique sous la photo, gras ; petite flèche circulaire terracotta très pâle à droite.
5. Localisation avec pin terracotta et texte rouille/gris.
6. Description courte en gris foncé, maximum 2–3 lignes.
7. Ligne basse avec étoile jaune, note, nombre d’avis ; à droite petite icône QR et libellé **« Retrait par code »**.

Cartes et textes exacts :

1. **Boutique Mamadou** — **Matoto** — **« Produits alimentaires, boissons et articles ménagers. »** — **4.8 (124)** — **Retrait par code** — badge vert **« Ouvert aujourd’hui »**. Photo : devanture d’une petite boutique africaine de quartier, enseigne « BOUTIQUE MAMADOU », marchandises visibles, plantes devant la boutique.
2. **Chez Aïcha** — **Ratoma** — **« Épicerie, produits frais et cosmétiques locaux. »** — **4.6 (89)** — **Retrait par code** — badge vert **« Ouvert aujourd’hui »**. Photo : commerce local à enseigne orange, rayonnages remplis.
3. **Épicerie Anta** — **Dixinn** — **« Alimentation générale et produits du quotidien. »** — **4.7 (102)** — **Retrait par code** — badge vert **« Ouvert aujourd’hui »**. Photo : épicerie de proximité avec bouteilles, produits et étagères.
4. **Marché Kadi** — **Kaloum** — **« Fruits, légumes, épices et produits frais. »** — **4.5 (76)** — **Retrait par code** — badge gris **« Fermé à 19h »**. Photo : fruits et légumes dans un étal de marché.

Les quatre cartes ont la même taille, même nombre de lignes autant que possible et même structure. La hauteur de carte ne doit pas être déterminée par une photo plus grande que les autres.

## 6.2 Fiche détaillée — Boutique Mamadou

### Photo de couverture et actions

- Image de couverture large : vraie devanture de proximité, enseigne **« BOUTIQUE MAMADOU »**, étagères de marchandises, boissons et produits colorés visibles, plantes autour de l’entrée, ambiance urbaine chaleureuse.
- Dans la zone supérieure : retour en cercle blanc à gauche ; partager et cœur dans deux cercles blancs à droite.
- Le panneau descriptif remonte légèrement sur la photo, avec les angles supérieurs très arrondis.

### Identité et coordonnées

- Nom en sans-serif bold : **« Boutique Mamadou »**.
- À droite du nom : badge clair avec étoile jaune, **« 4.8 (124) »**.
- Ligne de localisation : pin terracotta, **« Matoto »**.
- Adresse en plus petit : **« Avenue Principale, près du marché de Matoto »**.
- Description : **« Votre boutique de quartier pour tous vos produits du quotidien : alimentation, boissons, articles ménagers et bien plus encore. Qualité et proximité ! »**

### Bloc de services

Bandeau pleine largeur avec fond crème/saumon très pâle, composé de deux colonnes égales séparées visuellement, sans bordure forte :

- Colonne gauche : grande icône QR terracotta ; titre **« Retrait par code »** ; description **« Commandez en ligne et retirez en boutique. »**
- Colonne droite : icône scooter/livraison terracotta ; titre **« Livraison de proximité »** ; description **« Dans votre quartier (1 à 3 km). »**

Titres bruns/terracotta foncé en gras ; descriptions gris chaud. Garder les icônes et textes verticalement bien alignés.

### Produits disponibles

- En-tête **« Produits disponibles »** à gauche ; **« Voir tout → »** à droite.
- Chips de catégories : **Tous** (actif terracotta), **Alimentation**, **Boissons**, **Hygiène**, **Ménage**.
- Grille 3 colonnes, 2 lignes.
- Cartes blanches aux angles arrondis ; photo rectangulaire en haut ; petit bouton circulaire blanc avec plus terracotta en bas à droite de la photo ; nom du produit, quantité, prix terracotta.

Six produits visibles :

1. **Riz local 5kg** — **45 000 GNF**. Photo de riz dans un sac en toile/petit tas de grains.
2. **Huile de palme 1L** — **18 000 GNF**. Photo d’une bouteille d’huile dorée.
3. **Sucre blanc 1kg** — **12 000 GNF**. Photo de sucre blanc dans un sac/petit récipient.
4. **Lait en poudre 400g** — **28 000 GNF**. Photo d’une boîte de lait en poudre.
5. **Œufs frais (x30)** — **35 000 GNF**. Photo d’un plateau d’œufs bruns.
6. **Savon ménager** — **5 000 GNF**. Photo de savons rectangulaires verts/crème.

---

# 7. Page « Enseignes » et fiche d’une enseigne

Cet univers correspond aux grandes enseignes et commerces de type supermarché, maison, électronique et beauté. Les cartes de liste sont larges et horizontales ; la fiche de détail ressemble à une page de grande enseigne avec un hero photo, des catégories d’articles et un bandeau promotionnel.

## 7.1 Page liste — Enseignes

### En-tête et intro

- En-tête global avec logo FripCash, cloche, cœur, sac, avatar.
- Titre de page en serif : **« Enseignes »**.
- Description en deux lignes : **« Grandes enseignes et magasins de confiance près de chez vous. »**
- Champ de recherche : **« Rechercher une enseigne ou un produit ... »**.

### Filtres

Chips : **Supermarché** (actif terracotta), **Maison**, **Électro**, **Beauté**. La première chip porte une icône panier ; les autres leurs icônes correspondantes.

### Compteur et tri

- **« 12 enseignes trouvées »** à gauche.
- **« Trier par »** et chevron à droite.

### Cartes enseignes — liste verticale

Cartes larges, presque pleine largeur, hauteur moyenne, coins 14–18 dp. Photo de commerce en arrière-plan, avec un panneau blanc/crème semi-opaque au premier plan. Le panneau contient à gauche un logo rond grand format, au centre le nom, description, note et badge de livraison ; cercle blanc fléché à droite. Il ne s’agit pas de cartes produit étroites ni d’une grille de quatre colonnes.

1. **Conakry Market** — **« Votre supermarché de proximité, au meilleur prix. »** — étoile **4.8** — **(312)** — badge camion **« Livraison en ville »**. Image de supermarché avec fruits/légumes et rayons.
2. **Maison 224** — **« Tout pour la maison, décoration et art de vivre. »** — **4.6 (198)** — **« Livraison en ville »**. Image d’intérieur confortable, canapé et décoration.
3. **Tech Conakry** — **« High-tech, électroménager et innovation. »** — **4.7 (256)** — **« Livraison en ville »**. Image de téléphones et appareils électroniques dans une enseigne moderne.
4. **City Beauty** — **« Beauté, soins et bien-être pour tous. »** — **4.5 (186)** — **« Livraison en ville »**. Image de magasin de beauté avec étagères de produits cosmétiques.

Logos :

- Conakry Market : logo blanc circulaire, symbole de chariot terracotta, texte **« Conakry Market »**.
- Maison 224 : logo clair avec silhouette de maison verte/bleu-vert, texte **« MAISON 224 »**.
- Tech Conakry : logo sombre avec symbole d’alimentation bleu, texte **« TECH CONAKRY »**.
- City Beauty : logo rose pâle avec motif de lotus/fleur et texte **« City Beauty »**.

## 7.2 Fiche détaillée — Conakry Market

### Hero et en-tête photo

- Photo large d’un supermarché propre et moderne, fruits et légumes colorés, rayonnages, éclairage chaud. Enseigne dans la photo : **« Conakry Market »** accompagnée d’un symbole de chariot.
- Bouton retour rond blanc en haut à gauche ; cœur et partage ronds blancs en haut à droite.
- Grand logo de la marque dans un cercle blanc chevauchant le bas gauche de l’image, chariot terracotta et texte **« Conakry Market »**.
- Le nom de l’enseigne se place à droite du logo ou immédiatement après, en serif large : **« Conakry Market »**.

### Note et livraison

Sous ou à côté du nom : étoile terracotta/jaune **4.8**, **« (312 avis) »**, badge camion sur fond pêche clair **« Livraison en ville »**.

### Description

**« Conakry Market, votre supermarché de proximité. Produits frais, épicerie, boissons, hygiène et bien plus encore au meilleur prix. »**

Texte en gris foncé, 2–3 lignes maximum.

### Raccourcis de catégories

Rangée de six tuiles carrées/verticales, fond pêche très clair, coins 12–16 dp, icône terracotta centrée dans la partie supérieure et libellé sous l’icône :

1. **Épicerie** — panier.
2. **Frais** — pomme/fruit.
3. **Boissons** — bouteille.
4. **Hygiène** — rouleau/papier ou produit d’hygiène.
5. **Maison** — fauteuil/maison.
6. **Voir plus** — trois points.

Les tuiles sont de même largeur et réparties sur la ligne.

### Bannière promotionnelle interne

- Bandeau horizontal à coins arrondis, fond terracotta avec dégradé vers pêche, hauteur environ 90–110 dp.
- Côté gauche : texte serif blanc **« La qualité au quotidien près de chez vous ! »** sur deux ou trois lignes.
- Sous le texte : bouton crème **« Découvrir nos offres → »**, texte terracotta.
- Côté droit : panier ou composition de produits frais/légumes et bouteilles, photo détourée ou intégrée au bandeau. Ne pas créer une bannière plate sans photo.

### Produits populaires

Titre **« Produits populaires »** à gauche ; **« Voir tout → »** à droite.

Grille 3 colonnes, 2 lignes. Chaque carte contient photo en haut, cœur en rond blanc dans le coin supérieur droit, nom du produit, quantité/marque en gris, prix terracotta en gras et bouton panier terracotta circulaire vers le bas droit.

Six cartes :

1. **Riz parfumé** — **Cap Guinée · 5 kg** — **85 000 GNF**. Photo de sac de riz ou riz en sachet avec dominante crème/vert.
2. **Huile végétale** — **Aya · 1 L** — **18 500 GNF**. Photo d’une bouteille d’huile végétale jaune.
3. **Tomates fraîches** — **1 kg** — **12 000 GNF**. Photo de tomates rouges fraîches.
4. **Bananes plantains** — **1 kg** — **8 000 GNF**. Photo de bananes plantains jaunes/vertes.
5. **Œufs frais** — **Plateau de 30** — **28 000 GNF**. Photo d’un plateau d’œufs bruns.
6. **Lessive en poudre** — **Omo · 1 kg** — **15 000 GNF**. Photo d’un paquet bleu de lessive.

---

# 8. Composants réutilisables à créer

Ne pas coder chaque page comme un écran indépendant avec des styles différents. Construire des composants cohérents et ajouter des variantes pour respecter les nuances des références :

- `BrandHeader` : logo et actions du header global.
- `SubpageHeader` : retour, titre, sac/panier.
- `DetailTopActions` : retour, partage, favoris, menu selon la fiche.
- `SearchField` : icône de recherche, placeholder et action filtre.
- `CategoryChip` : actif/inactif, icône optionnelle.
- `SectionHeading` : titre, lien « Voir tout »/« Trier »/« Filtrer ».
- `UniverseCard` : image, gradient, titre, sous-titre, badge et flèche.
- `ProductCard` avec variantes (`home`, `secondHand`, `newItem`, `localStore`, `brandStore`). La structure, le nombre de colonnes et les actions changent selon le contexte, mais les rayons, typographies et couleurs restent cohérents.
- `FavoriteButton` : cercle blanc, cœur outline/plein selon l’état.
- `RatingInline` : étoile jaune, note, nombre d’avis.
- `SellerAvatar` : portrait circulaire avec bordure blanche et statut optionnel.
- `StoreLogo` : logo circulaire ou rond avec fond adapté.
- `SecondHandDressingCard` : photo, avatar superposé, nom, quartier, note, nombre d’articles.
- `LocalShopCard` : photo, cœur, statut d’ouverture, nom, quartier, description, note, retrait par code.
- `BrandListCard` : fond photo, panneau crème, logo, nom, résumé, note, badge livraison.
- `NewStoreListCard` : image, logo/monogramme, nom, types de produits, note et nombre d’articles.
- `StoreHero` : photo de couverture, actions superposées et panneau d’identité qui chevauche la photo.
- `StoreServiceTile` : raccourci catégorie/service avec icône.
- `BottomNavigation` : cinq positions, central « + », badge messages, sélection active.

Centraliser les couleurs, espaces, rayons, tailles de textes, tailles d’icônes et ombres. Si le projet utilise React Native/Expo, employer les composants et Safe Area adaptés au projet ; si le projet est en React web mobile, utiliser les techniques de mise en page responsive existantes. Ne pas introduire une autre stack juste pour appliquer ces styles.

---

# 9. Interactions visuelles attendues

L’apparence doit être accompagnée d’états cohérents :

- Les boutons cœur reflètent un état favori et ne font pas bouger la carte lorsqu’on clique.
- Les chips changent visuellement d’état actif/inactif ; elles ne doivent pas toutes avoir la couleur terracotta en permanence.
- Les liens « Voir tout », « Trier », « Filtrer », les flèches de carte et les cartes ouvrent la destination métier déjà prévue par l’application.
- Le bouton « Suivre » affiche un état suivi/non suivi cohérent.
- Les actions d’ajout au panier ou au sac utilisent la logique présente dans l’application ; ne pas afficher une action décorative qui ne fonctionne pas.
- Les boutons retour, partage, menu, notification, profil et messages conservent le comportement déjà existant.
- Les badges d’ouverture sont des états informatifs fournis par les données ; ne pas les inventer aléatoirement.
- Les contenus longs sont défilables ; la barre basse reste stable et le contenu ne passe pas dessous.
- Prévoir un retour visuel pour une action sélectionnée, sans animation excessive : petite transition d’opacité/échelle, durée courte (environ 120–200 ms), sans effets rebond trop prononcés.

---

# 10. Gestion des images si le projet n’en contient pas

Avant d’ajouter des images externes, chercher les assets déjà présents dans le dépôt. Si les références exactes sont introuvables :

1. Préparer un répertoire d’assets clairement nommé et un manifeste reliant chaque écran à ses images. Utiliser de préférence des images locales et des noms explicites.
2. Trouver des photos de remplacement qui respectent la description précise de chaque carte dans ce document : tons chauds, cadrage adapté, sujet correct et arrière-plan crédible.
3. Ne pas utiliser une source d’image aléatoire qui change à chaque chargement. Chaque URL ou fichier d’image doit être stable.
4. Ne pas utiliser une seule image générique pour tous les produits ; ne pas répéter les mêmes quatre images dans chaque univers.
5. Régler précisément `cover`/`contain` selon le type d’image, la position du sujet, l’overlay et le rayon de la carte.
6. Si aucune image appropriée n’est disponible, garder la place de l’image avec un fallback propre et le signaler dans un manifeste `MISSING_ASSETS.md`. Ne pas prétendre que la reproduction visuelle est terminée tant que les images clés manquent.

Visuels qui ont le plus d’impact et doivent être traités en priorité :

- Bannière promotionnelle d’accueil.
- Quatre photos de cartes univers.
- Quatre photos des cartes « Boutiques à découvrir ».
- Quatre couvertures de dressings/avatars.
- Six photos de produits Seconde main.
- Quatre couvertures de boutiques d’articles neufs et couverture de Boutique Aminata.
- Quatre photos/logos d’enseignes et la couverture de Conakry Market.
- Quatre photos de commerces de quartier et couverture Boutique Mamadou.
- Photos des produits alimentaires et ménagers.

---

# 11. Pages et routes à vérifier

Adapter les chemins au routeur présent dans le projet ; les noms suivants décrivent les destinations, pas une obligation de renommer les routes déjà utilisées :

- Accueil FripCash.
- Liste/entrée univers **Seconde main**.
- Fiche **Dressing de Mamadou** (et réutilisation du modèle pour les autres dressings).
- Liste/entrée univers **Articles neufs**.
- Fiche **Boutique Aminata** (et réutilisation du modèle pour Tina Shop, Kadi Chic, Maison Sira).
- Liste/entrée univers **Boutiques de quartier**.
- Fiche **Boutique Mamadou** (et réutilisation du modèle pour Chez Aïcha, Épicerie Anta, Marché Kadi).
- Liste **Enseignes**.
- Fiche **Conakry Market** (et réutilisation du modèle pour Maison 224, Tech Conakry et City Beauty).

La carte sélectionnée doit ouvrir sa propre fiche. Ne pas envoyer toutes les cartes vers la fiche Mamadou ou Conakry Market uniquement parce que ce sont les premières données des maquettes.

---

# 12. Contrôle qualité visuel obligatoire

Tester au minimum sur une largeur d’écran mobile de 390 dp, puis vérifier une largeur plus étroite d’environ 360 dp. Pour chaque écran, prendre une capture et contrôler :

- Les marges latérales sont régulières.
- Aucun titre ne chevauche une icône ou ne sort de l’écran.
- Les cartes d’une même rangée ont des tailles homogènes.
- Les photos sont bien recadrées et chaque image correspond au contenu.
- Les gradients permettent de lire les textes sans rendre la photo artificiellement sombre.
- Les éléments flottants (cœur, avatar, flèche, badge d’état) sont correctement positionnés par rapport à la photo.
- Les prix sont toujours visibles, avec « GNF » et le bon format.
- Les noms, avis, quantités et descriptions concordent avec les cartes définies ci-dessus.
- Les grilles respectent leur nombre de colonnes propre à chaque écran : 4 cartes sur l’accueil ; 2 colonnes pour les cartes de dressings et de commerces ; 3 colonnes pour les produits sur les fiches ; cartes pleine largeur pour les listes d’enseignes et de boutiques neuves.
- La barre de navigation ne masque ni le prix ni la dernière rangée de cartes.
- Les zones tactiles des icônes sont assez grandes sans rendre les icônes elles-mêmes disproportionnées.
- L’état actif des filtres est clairement visible.
- Les fiches de détails montrent couverture + identité + informations + catégories/services + produits, dans le bon ordre.

Ne pas déclarer « identique à 100 % » si les photos d’origine ne sont pas présentes. L’objectif avec des assets de remplacement est de respecter au plus près la composition et l’identité visuelle ; l’égalité pixel à pixel nécessite les mêmes photos, polices et ressources graphiques.

---

# 13. Prompt principal à donner à Cursor

> Tu es chargé d’implémenter fidèlement le design mobile FripCash décrit dans ce document. Lis tout le cahier des charges avant d’éditer du code. Inspecte d’abord le dépôt pour identifier la stack, le routeur, les composants et les données déjà disponibles. Ne réécris pas le projet et ne modifie pas les fonctionnalités métier sans raison.
>
> Implémente tous les écrans, pas seulement l’accueil : Accueil, liste Seconde main, fiche Dressing, liste Articles neufs, fiche Boutique Aminata, liste Boutiques de quartier, fiche Boutique Mamadou, liste Enseignes et fiche Conakry Market. Les variantes de fiches doivent être réutilisables pour les autres boutiques du même univers.
>
> Respecte les textes, la structure des cartes, le nombre de colonnes, les photos décrites, les couleurs terracotta/crème, les deux rôles typographiques (serif éditoriale et sans-serif d’interface), les rayons, les espacements, les overlays, les avatars superposés, les badges, les notes, les prix GNF et la navigation indiqués ici. Utilise des composants communs avec variantes plutôt que des styles contradictoires copiés-collés.
>
> Les images sont une partie critique du résultat. Cherche d’abord les assets dans le dépôt. S’ils manquent, utilise des images de remplacement stables et sémantiquement proches ; ne répète pas les mêmes photos et ne remplace jamais définitivement des photos par de simples aplats. Enregistre les ressources manquantes dans `MISSING_ASSETS.md`.
>
> N’invente pas les destinations ou les comportements métier. Réutilise les routes/API/états existants. Assure-toi que les cartes ouvrent la bonne fiche, que les filtres, favoris, suivi, panier, tri et boutons déjà pris en charge restent fonctionnels. Gère le safe area et la barre de navigation fixe.
>
> Après l’implémentation, démarre l’application, capture chaque écran sur une largeur mobile d’environ 390 dp, compare-le au cahier des charges et corrige les écarts les plus évidents. Vérifie aussi une largeur de 360 dp. Ne t’arrête pas à « ça compile » : le résultat doit être visuellement contrôlé. À la fin, indique les écrans terminés, les éventuels éléments non reliés aux données réelles et la liste des photos manquantes. Ne prétends pas à une reproduction pixel-perfect si les photos exactes ne sont pas disponibles.
