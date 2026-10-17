export type LegalBlock = { title: string; body: string };

export type LegalChapter = {
  title: string;
  intro?: string;
  updated?: string;
  blocks: LegalBlock[];
};

export const LEGAL_CHAPTERS: LegalChapter[] = [
  {
    title: "Conditions générales d'utilisation",
    intro:
      "En utilisant FripCash, tu acceptes les conditions suivantes. Prends le temps de les lire pour comprendre tes droits et obligations.",
    updated: 'Dernière mise à jour : 13 février 2026',
    blocks: [
      {
        title: '1. Objet',
        body: `Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme FripCash, accessible via le site web et l'application mobile.

En t'inscrivant sur FripCash, tu acceptes sans réserve l'intégralité de ces conditions.`,
      },
      {
        title: '2. Inscription et compte',
        body: `Pour utiliser FripCash, tu dois créer un compte en fournissant :

• Ton nom et prénom
• Un pseudo unique
• Un numéro de téléphone valide

La vérification par code SMS est obligatoire. Tu es responsable de la confidentialité de tes identifiants de connexion. Toute activité sur ton compte est réputée avoir été effectuée par toi.

FripCash se réserve le droit de suspendre ou supprimer un compte en cas de non-respect des présentes conditions.`,
      },
      {
        title: "3. Mise en vente d'articles",
        body: `En tant que vendeur sur FripCash, tu t'engages à :

• Décrire l'article de manière exacte et honnête (état, taille, marque, défauts éventuels)
• Publier des photos réelles de l'article
• Fixer un prix raisonnable
• Expédier l'article dans un délai de 5 jours ouvrés après la vente

Sont interdits : les articles contrefaits, volés, dangereux, ou contraires à la loi. FripCash se réserve le droit de retirer toute annonce non conforme.`,
      },
      {
        title: '4. Achat et paiement',
        body: `Lorsque tu achètes un article :

• Le paiement est sécurisé et traité via notre plateforme
• L'argent est bloqué jusqu'à confirmation de la réception par l'acheteur
• Les frais de port sont calculés lors du paiement et à la charge de l'acheteur, sauf accord contraire

Tu disposes d'un délai de 48 heures après réception pour signaler un problème (article non conforme, endommagé, etc.).`,
      },
      {
        title: '5. Commission',
        body: `FripCash prélève une commission sur chaque vente réalisée. Cette commission couvre :

• Les frais de traitement du paiement
• La protection acheteur
• Le fonctionnement et la maintenance de la plateforme

Le montant exact de la commission est affiché avant la confirmation de chaque transaction. Le vendeur reçoit le montant de la vente moins la commission.`,
      },
      {
        title: '6. Livraison',
        body: `Le vendeur est responsable de l'expédition de l'article dans les délais impartis. FripCash fournit les outils de suivi des colis.

• Le vendeur doit fournir un numéro de suivi valide
• L'acheteur est notifié à chaque étape de la livraison
• En cas de perte du colis, FripCash interviendra pour résoudre le litige

Les délais de livraison varient selon la méthode d'envoi choisie et la localisation géographique.`,
      },
      {
        title: '7. Litiges et remboursements',
        body: `En cas de litige entre un acheteur et un vendeur :

• L'acheteur peut ouvrir un litige dans les 48 heures suivant la réception
• FripCash examine le dossier et peut demander des preuves aux deux parties
• Si le litige est fondé, l'acheteur est remboursé intégralement

Le remboursement est effectué via le même moyen de paiement utilisé lors de l'achat.`,
      },
      {
        title: '8. Comportement des utilisateurs',
        body: `En utilisant FripCash, tu t'engages à :

• Respecter les autres utilisateurs
• Ne pas publier de contenu offensant, discriminatoire ou illégal
• Ne pas tenter de contourner le système de paiement sécurisé
• Ne pas créer plusieurs comptes
• Ne pas utiliser la plateforme à des fins commerciales non autorisées

Tout comportement abusif peut entraîner la suspension ou la suppression définitive de ton compte.`,
      },
      {
        title: '9. Propriété intellectuelle',
        body: `Le contenu de la plateforme FripCash (logo, design, textes, fonctionnalités) est protégé par le droit de la propriété intellectuelle.

Les photos et descriptions publiées par les utilisateurs restent leur propriété, mais en les publiant sur FripCash, tu nous accordes une licence non exclusive pour les afficher sur la plateforme.`,
      },
      {
        title: '10. Modification des CGU',
        body: `FripCash se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification significative par notification dans l'application.

La poursuite de l'utilisation de la plateforme après modification vaut acceptation des nouvelles conditions.`,
      },
      {
        title: '11. Contact',
        body: `Pour toute question relative aux présentes Conditions Générales, tu peux nous contacter via notre page de contact ou par les coordonnées indiquées sur la plateforme.`,
      },
    ],
  },
  {
    title: 'Politique de confidentialité',
    intro: 'Cette politique explique comment nous collectons, utilisons et protégeons tes informations.',
    blocks: [
      {
        title: '1. Collecte des données',
        body: `Lorsque tu t'inscris sur FripCash, nous collectons les informations suivantes :

• Nom et prénom
• Pseudo
• Numéro de téléphone
• Adresse de livraison (lors d'une commande)
• Historique des transactions

Ces données sont nécessaires au bon fonctionnement de la plateforme et à la sécurisation des échanges.`,
      },
      {
        title: '2. Utilisation des données',
        body: `Tes données personnelles sont utilisées pour :

• Créer et gérer ton compte
• Vérifier ton identité par SMS
• Traiter les paiements et livraisons
• Assurer la sécurité des transactions
• Améliorer nos services et ton expérience utilisateur
• T'envoyer des notifications pertinentes (commandes, messages, offres)

Nous ne vendons jamais tes données à des tiers.`,
      },
      {
        title: '3. Protection des données',
        body: `Nous mettons en œuvre des mesures techniques et organisationnelles pour protéger tes données :

• Chiffrement des données sensibles (mots de passe, informations de paiement)
• Accès restreint aux données personnelles au sein de notre équipe
• Surveillance continue de notre infrastructure
• Mises à jour régulières de nos systèmes de sécurité`,
      },
      {
        title: '4. Cookies et suivi',
        body: `FripCash utilise des cookies pour :

• Maintenir ta session de connexion active
• Mémoriser tes préférences (langue, filtres)
• Analyser le trafic de manière anonyme pour améliorer la plateforme

Tu peux désactiver les cookies dans les paramètres de ton navigateur, mais certaines fonctionnalités pourraient être limitées.`,
      },
      {
        title: '5. Partage des données',
        body: `Tes données peuvent être partagées uniquement dans les cas suivants :

• Avec nos prestataires de paiement pour traiter les transactions
• Avec les services de livraison pour acheminer tes colis
• Avec les autorités compétentes si la loi l'exige

Nous ne partageons jamais tes données à des fins publicitaires avec des tiers.`,
      },
      {
        title: '6. Tes droits',
        body: `Tu disposes des droits suivants concernant tes données :

• Droit d'accès : consulter les données que nous détenons sur toi
• Droit de rectification : corriger des informations inexactes
• Droit de suppression : demander la suppression de ton compte et de tes données
• Droit d'opposition : refuser certains traitements de données

Pour exercer ces droits, contacte-nous à l'adresse indiquée sur notre page de contact.`,
      },
      {
        title: '7. Conservation des données',
        body: `Tes données personnelles sont conservées aussi longtemps que ton compte est actif. En cas de suppression de compte, tes données sont effacées dans un délai de 30 jours, à l'exception des données nécessaires au respect de nos obligations légales (transactions, factures) qui peuvent être conservées jusqu'à 5 ans.`,
      },
      {
        title: '8. Modifications de cette politique',
        body: `Nous pouvons mettre à jour cette politique de confidentialité à tout moment. En cas de modification importante, tu seras informé(e) par notification dans l'application. La date de dernière mise à jour est indiquée en bas de cette page.`,
      },
    ],
  },
  {
    title: 'Sécurité et séquestre',
    intro:
      'Chez FripCash, ta sécurité est notre priorité. Le paiement est bloqué jusqu’à la confirmation de réception.',
    blocks: [
      {
        title: 'Paiement sécurisé',
        body: "Toutes les transactions passent par notre système de paiement sécurisé. L'argent est bloqué jusqu'à la confirmation de réception par l'acheteur.",
      },
      {
        title: 'Protection acheteur',
        body: "Si l'article reçu ne correspond pas à la description, tu es remboursé. Notre équipe intervient en cas de litige.",
      },
      {
        title: 'Vérification des comptes',
        body: "Chaque utilisateur est vérifié par son numéro de téléphone avec un code SMS pour garantir l'authenticité des profils.",
      },
      {
        title: 'Signalement',
        body: 'Tu peux signaler un comportement suspect ou une annonce frauduleuse à tout moment. Notre équipe réagit rapidement.',
      },
      {
        title: 'Évaluations',
        body: 'Les avis et notes des utilisateurs sont visibles par tous. Choisis des vendeurs de confiance grâce aux retours de la communauté.',
      },
      {
        title: 'Données protégées',
        body: 'Tes données personnelles sont chiffrées et ne sont jamais vendues à des tiers.',
      },
      {
        title: 'Comment fonctionne la protection',
        body: `1. Achat sécurisé — le paiement est bloqué sur la plateforme. Le vendeur ne reçoit l'argent qu'après ta confirmation.

2. Livraison suivie — chaque colis est suivi et tu reçois des mises à jour sur l'état de ta commande.

3. Garantie — si l'article ne te convient pas, ouvre un litige sous 48 h. Nous arbitrons et te remboursons si nécessaire.

Ton achat est protégé quand tu paies sur FripCash. Tu seras remboursé si ton article n'a pas été livré, a été endommagé ou n'est pas tel que décrit. Tu as 2 jours après la livraison pour signaler un problème.`,
      },
    ],
  },
  {
    title: 'Commissions',
    blocks: [
      {
        title: 'Ce que paie l’acheteur',
        body: "Le vendeur saisit le prix net (ce qu'il reçoit). FripCash ajoute la commission pour l'acheteur : 8 % (particulier, boutique, enseigne) ou 5 % (proximité). Les taux sont réglables dans l'admin. Le montant exact est affiché avant la confirmation de chaque transaction.",
      },
    ],
  },
  {
    title: 'Livraison',
    blocks: [
      {
        title: 'Modes de remise',
        body: `Proximité : retrait boutique ou livraison locale, confirmés depuis le tableau de bord.

Autres vendeurs : livreur FripCash. Les tarifs inter-zones sont configurés par l'admin.

Le vendeur expédie dans les délais indiqués. L'acheteur est notifié à chaque étape. En cas de perte du colis, FripCash intervient pour résoudre le litige.`,
      },
    ],
  },
  {
    title: 'Comment ça marche',
    blocks: [
      {
        title: 'Vendre',
        body: `1. Mets en ligne gratuitement — prends ton article en photo, décris-le et fixe ton prix.
2. Vends et envoie — emballe l'article et dépose-le. Tu as 5 jours pour l'expédier.
3. Jour de paie — tu reçois l'argent quand l'acheteur a validé la réception.`,
      },
      {
        title: 'Acheter',
        body: `1. Trouve ton article parmi les boutiques et les dressings, avec les filtres de taille, de prix, d'état ou de catégorie.
2. Achète en un clic. Le paiement (Mobile Money ou carte) est bloqué en séquestre jusqu'à confirmation de réception.
3. Suis la livraison jusqu'à chez toi.`,
      },
    ],
  },
  {
    title: 'Éco-responsabilité',
    blocks: [
      {
        title: 'Seconde vie',
        body: `L'industrie textile est l'une des plus polluantes. FripCash agit en donnant une seconde vie à chaque article.

Chaque année, des millions de tonnes de vêtements finissent dans les décharges. Acheter de seconde main réduit ce gaspillage. Un article revendu permet d'économiser en moyenne 3 000 litres d'eau et 5 kg de CO₂.`,
      },
    ],
  },
  {
    title: 'Contact',
    blocks: [
      {
        title: 'Nous écrire',
        body: `Téléphone : +224 6XX XXX XXX — lundi au vendredi, 8 h - 18 h
Email : contact@fripcash.com — réponse sous 24 h
Adresse : Conakry, Guinée — Kaloum, Rue du Commerce
Horaires : lundi au vendredi 8 h - 18 h, samedi 9 h - 14 h`,
      },
    ],
  },
];
