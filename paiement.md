# FRIPCASH — ARCHITECTURE DE GESTION DES COMMANDES, PAIEMENTS ET REVERSEMENTS

**Type de document :** Spécification technique Backend  
**Stack cible :** Node.js, Express.js, TypeScript, MongoDB / Mongoose  
**Environnement :** Backend FripCash hébergé sur Railway  
**Modèle financier :** Encaissement centralisé auprès du prestataire, puis reversements indépendants après confirmation de réception des colis.

---

# 1. OBJECTIF GÉNÉRAL

FripCash est une marketplace multivendeur. Un acheteur peut acheter plusieurs produits appartenant à plusieurs vendeurs au cours d'une seule commande.

L'acheteur doit pouvoir effectuer un seul paiement pour l'ensemble de son panier.

Cependant, ce paiement unique doit être décomposé dans le backend en plusieurs éléments financiers totalement indépendants :

1. Une commande principale (`ParentOrder`) qui représente l'achat global.
2. Plusieurs sous-commandes (`SellerOrder`), chacune appartenant à un seul vendeur.
3. Une commission FripCash, clairement identifiée.
4. Une rémunération du livreur, clairement identifiée.
5. Un enregistrement de paiement global.
6. Des instructions de reversement individuelles pour chaque bénéficiaire.

L'argent est encaissé par le prestataire de paiement sur le compte marchand de FripCash administré par la plateforme.

Après confirmation effective de la réception du colis concerné, le backend déclenche le reversement de la somme due au bénéficiaire correspondant.

**Règle fondamentale : chaque bénéficiaire doit être financièrement indépendant.**

Un vendeur payé ne doit jamais être payé une deuxième fois simplement parce qu'un autre vendeur n'a pas encore reçu son argent.

De même, un échec de transfert vers le livreur ne doit jamais entraîner la répétition des transferts déjà réussis vers les vendeurs.

# 2. ARCHITECTURE GÉNÉRALE

Le système doit fonctionner avec cette hiérarchie logique :

```text
                         FRIPCASH
                            |
                            |
                       PARENT ORDER
                     FC-ORDER-00125
                            |
               -------------------------
               |           |           |
               |           |           |
            SELLER A    SELLER B    SELLER C
               |           |           |
          SellerOrder  SellerOrder  SellerOrder
               |           |           |
            Produits     Produits     Produits
            du vendeur   du vendeur   du vendeur

               PARENT ORDER
                     |
          -------------------------
          |           |           |
          |           |           |
       VENDEURS    LIVREUR     FRIPCASH
          |           |           |
       Payout A    Payout D    Commission
       Payout B
       Payout C
```

La commande principale est le point de regroupement.

Les sous-commandes sont indépendantes pour leur préparation, leur livraison, leur confirmation de réception et leur paiement.

La commission FripCash et la rémunération du livreur ne doivent jamais être mélangées avec les montants dus aux vendeurs.

## 2.1. Important : séparation logique et physique

La commande principale doit contenir les références de toutes ses sous-commandes et les informations nécessaires à sa synthèse financière.

Les sous-commandes doivent être enregistrées dans une collection indépendante.

Les reversements doivent également disposer de leur propre collection.

Cette organisation évite qu'une modification de l'état financier d'un vendeur affecte les autres sous-commandes.

# 3. STRUCTURE DES COLLECTIONS MONGODB

Le système doit être organisé autour des collections suivantes :

```text
users
orders
sellerOrders
deliveries
payments
financialAllocations
payouts
payoutAttempts
payoutBatches
paymentWebhookEvents
payoutWebhookEvents
financialLedger
refunds
financialAuditLogs
```

Chaque collection a une responsabilité précise.

## 3.1. Collection ParentOrder

Représente la commande globale de l'acheteur.

Exemple :

```typescript
interface ParentOrder {
  _id: ObjectId;

  orderNumber: string;
  buyerId: ObjectId;

  sellerOrderIds: ObjectId[];

  currency: string;

  summary: {
    productsSubtotal: number;
    discounts: number;
    deliveryTotal: number;
    serviceFees: number;
    totalPaid: number;
  };

  payment: {
    paymentId: ObjectId;
    provider: string;
    providerTransactionId?: string;
    status:
      | "pending"
      | "paid"
      | "failed"
      | "partially_refunded"
      | "refunded";
  };

  financialSummary: {
    sellersTotal: number;
    courierTotal: number;
    platformCommission: number;
    providerFees: number;
    totalAllocated: number;
  };

  status:
    | "pending_payment"
    | "paid"
    | "processing"
    | "partially_delivered"
    | "completed"
    | "cancelled"
    | "disputed";

  createdAt: Date;
  updatedAt: Date;
}
```

Le `ParentOrder` ne doit pas être utilisé pour effectuer directement les reversements.

Il représente la commande globale et permet de suivre l'ensemble des opérations.

Il conserve les références vers les sous-commandes et le résumé financier.

## 3.2. Collection SellerOrder

Chaque vendeur dispose de sa propre sous-commande.

Exemple :

```typescript
interface SellerOrder {
  _id: ObjectId;

  parentOrderId: ObjectId;

  orderNumber: string;

  sellerId: ObjectId;

  items: {
    productId: ObjectId;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];

  financialDetails: {
    productsSubtotal: number;
    discount: number;
    platformCommissionRate: number;
    platformCommissionAmount: number;
    sellerNetAmount: number;
    deliveryAmount: number;
    currency: string;
  };

  deliveryId?: ObjectId;

  deliveryStatus:
    | "pending"
    | "preparing"
    | "ready"
    | "in_transit"
    | "delivered"
    | "received"
    | "disputed";

  payoutId?: ObjectId;

  payoutStatus:
    | "not_eligible"
    | "eligible"
    | "pending"
    | "processing"
    | "paid"
    | "failed";

  createdAt: Date;
  updatedAt: Date;
}
```

**Règle absolue : une SellerOrder appartient à un seul vendeur.**

Aucun vendeur ne doit pouvoir consulter les informations financières internes d'un autre vendeur.

Le vendeur consulte uniquement :

- Ses produits commandés.
- Les quantités.
- Le montant brut de sa sous-commande.
- La commission prélevée par FripCash.
- Son montant net à recevoir.
- L'état de préparation et de livraison.
- L'état de son reversement.

## 3.3. Collection Delivery

La livraison doit être séparée des commandes et des reversements vendeurs.

```typescript
interface Delivery {
  _id: ObjectId;

  parentOrderId: ObjectId;

  sellerOrderIds: ObjectId[];

  courierId: ObjectId;

  deliveryFee: number;

  currency: string;

  status:
    | "assigned"
    | "accepted"
    | "picked_up"
    | "in_transit"
    | "delivered"
    | "confirmed"
    | "failed"
    | "disputed";

  confirmation: {
    method: "otp" | "buyer_confirmation" | "admin_validation";
    confirmedAt?: Date;
    confirmedBy?: ObjectId;
  };

  courierPayoutId?: ObjectId;

  createdAt: Date;
  updatedAt: Date;
}
```

Une livraison peut concerner une seule sous-commande ou plusieurs sous-commandes si la logistique permet de regrouper les colis.

Le livreur ne doit être rémunéré qu'une seule fois pour chaque prestation de livraison facturée.

Si plusieurs livraisons sont organisées pour un même ParentOrder, chaque prestation dispose de son propre montant et de son propre reversement.

## 3.4. Collection Payment

Un ParentOrder correspond à un paiement global côté acheteur.

```typescript
interface Payment {
  _id: ObjectId;

  parentOrderId: ObjectId;

  buyerId: ObjectId;

  provider: string;

  providerTransactionId?: string;

  amount: number;

  currency: string;

  method: string;

  status:
    | "created"
    | "pending"
    | "processing"
    | "paid"
    | "failed"
    | "partially_refunded"
    | "refunded";

  paidAt?: Date;

  providerResponse?: object;

  createdAt: Date;
  updatedAt: Date;
}
```

Il ne faut jamais créer un paiement global supplémentaire pour chaque vendeur.

Le client paie une seule fois.

Les opérations individuelles sont créées uniquement après confirmation de l'encaissement.

## 3.5. Collection FinancialAllocation

Cette collection représente la répartition comptable de l'argent encaissé.

Elle est particulièrement importante.

Chaque somme due doit avoir une allocation individuelle.

```typescript
interface FinancialAllocation {
  _id: ObjectId;

  parentOrderId: ObjectId;

  sellerOrderId?: ObjectId;
  deliveryId?: ObjectId;

  beneficiaryType:
    | "seller"
    | "courier"
    | "platform";

  beneficiaryId: ObjectId | string;

  amount: number;

  currency: string;

  status:
    | "awaiting_payment"
    | "funded"
    | "eligible"
    | "payout_pending"
    | "paid"
    | "retained"
    | "failed"
    | "refunded";

  payoutId?: ObjectId;

  createdAt: Date;
  updatedAt: Date;
}
```

Exemples :

- Allocation vendeur A : 45 000 GNF.
- Allocation vendeur B : 30 000 GNF.
- Allocation vendeur C : 20 000 GNF.
- Allocation livreur : 5 000 GNF.
- Allocation FripCash : 10 000 GNF.

Chaque allocation doit être créée une seule fois.

Une allocation ne doit jamais être supprimée pour corriger un problème financier. Toute correction doit passer par une opération d'ajustement ou de remboursement traçable.

# 4. EXEMPLE FINANCIER COMPLET

Un client achète chez trois vendeurs.

Les montants suivants sont uniquement illustratifs.

| Bénéficiaire | Montant brut | Commission | Montant net |
|---|---:|---:|---:|
| Vendeur A | 50 000 | 5 000 | 45 000 |
| Vendeur B | 35 000 | 5 000 | 30 000 |
| Vendeur C | 25 000 | 5 000 | 20 000 |
| Livreur | — | — | 5 000 |
| FripCash | — | — | 15 000 |
| **Total** | | | **115 000 GNF** |

Le client effectue un seul paiement de 115 000 GNF.

Le backend conserve cette décomposition :

```typescript
const financialBreakdown = {
  currency: "GNF",

  totalPaid: 115000,

  sellers: [
    {
      sellerId: "seller_A",
      grossAmount: 50000,
      commission: 5000,
      netAmount: 45000
    },
    {
      sellerId: "seller_B",
      grossAmount: 35000,
      commission: 5000,
      netAmount: 30000
    },
    {
      sellerId: "seller_C",
      grossAmount: 25000,
      commission: 5000,
      netAmount: 20000
    }
  ],

  courier: {
    courierId: "courier_01",
    amount: 5000
  },

  platform: {
    amount: 15000
  },

  totalAllocated: 115000
};
```

La somme des allocations doit toujours correspondre au montant encaissé, à l'exception des éléments expressément identifiés comme non distribués, tels que les frais du prestataire éventuellement prélevés séparément.

La commission de chaque vendeur doit être calculée à la création de la commande et conservée comme photographie financière.

Une modification ultérieure du taux de commission ne doit jamais modifier rétroactivement une commande existante.

# 5. PROCESSUS DE PAIEMENT CLIENT

Voici le fonctionnement attendu.

## Étape 1 : création du ParentOrder

Lorsque le client valide son panier :

1. Le backend récupère les produits.
2. Il vérifie les prix actuels.
3. Il vérifie les stocks.
4. Il regroupe les produits par vendeur.
5. Il crée une SellerOrder par vendeur.
6. Il calcule les commissions.
7. Il calcule les frais de livraison.
8. Il calcule le montant total.
9. Il crée les allocations financières avec le statut `awaiting_payment`.
10. Il crée un seul enregistrement Payment.

Toutes les informations financières sont calculées côté serveur.

Le frontend ne doit jamais pouvoir imposer lui-même un montant de commission ou un montant de reversement.

## Étape 2 : paiement auprès du prestataire

Le backend crée une transaction auprès du prestataire.

Il transmet notamment :

- La référence unique du ParentOrder.
- Le montant total.
- La devise.
- Les informations requises par le prestataire.

Le client effectue son paiement.

À ce stade, aucun vendeur ne reçoit encore d'argent.

## Étape 3 : confirmation de paiement

Le prestataire envoie un webhook au backend.

Le backend doit :

1. Vérifier l'authenticité du webhook.
2. Vérifier la référence de transaction.
3. Vérifier le montant.
4. Vérifier la devise.
5. Interroger l'API de vérification du prestataire lorsque cela est possible.
6. Vérifier que le paiement n'a pas déjà été traité.
7. Marquer le Payment comme `paid`.
8. Marquer le ParentOrder comme `paid`.
9. Marquer les sous-commandes comme `paid`.
10. Marquer les allocations comme `funded`.

Le webhook ne doit jamais être considéré comme fiable uniquement parce qu'il arrive sur le serveur.

Il faut aussi prévoir les webhooks reçus plusieurs fois.

Une seule confirmation doit produire une seule opération financière.

# 6. PROCESSUS DE CONFIRMATION DE RÉCEPTION ET DE REVERSEMENT

C'est le cœur du système.

Les fonds restent sur le compte marchand du prestataire de paiement administré pour FripCash.

Aucun reversement vendeur ne doit être déclenché simplement parce que le client a payé.

Le déclenchement dépend de la confirmation de réception du colis concerné.

## 6.1. Confirmation d'une sous-commande

Lorsqu'un client reçoit le colis du vendeur A :

1. Le client confirme la réception depuis son application.
2. Le backend vérifie que cette sous-commande appartient bien à ce client.
3. Le backend vérifie que le paiement global est confirmé.
4. Le backend vérifie que la livraison correspondante est terminée.
5. Le backend vérifie qu'aucun litige bloquant n'est ouvert.
6. Le backend confirme la réception de la SellerOrder A.
7. L'allocation du vendeur A passe à `eligible`.
8. Le système crée son instruction de reversement.

Les sous-commandes B et C restent indépendantes.

Il ne faut pas attendre que toutes les sous-commandes du ParentOrder soient livrées pour pouvoir payer le vendeur A.

## 6.2. Confirmation du livreur

La rémunération du livreur doit être gérée séparément.

Lorsque sa prestation de livraison est terminée et confirmée :

1. Le backend vérifie la livraison.
2. Il vérifie le livreur associé.
3. Il vérifie le montant de sa rémunération.
4. Il vérifie qu'aucun reversement n'a déjà été effectué pour cette prestation.
5. Il crée une instruction de reversement pour le livreur.

Un livreur ne doit pas pouvoir confirmer lui-même la réception du client comme seule preuve de livraison.

Utiliser de préférence un code OTP communiqué par le client au livreur.

Si une livraison regroupe trois sous-commandes, un seul reversement livreur doit être créé pour cette prestation, et non trois.

La rémunération doit être calculée selon les règles commerciales définies par FripCash.

## 6.3. Commission FripCash

La commission FripCash doit être une allocation distincte.

Elle ne doit pas être incluse dans les reversements des vendeurs.

Si elle reste sur le compte marchand FripCash chez le prestataire, le backend l'identifie comme une somme conservée par la plateforme.

Son statut comptable doit être distinct de celui des reversements vendeurs.

Il n'est donc pas nécessaire de créer une opération de transfert vers FripCash lui-même lorsque sa commission reste déjà dans le compte marchand.

# 7. COLLECTION PAYOUT : LE SYSTÈME DE REVERSEMENT

Chaque bénéficiaire doit disposer de sa propre instruction de paiement.

Il ne faut surtout pas créer un seul Payout global qui mélange l'ensemble des vendeurs.

```typescript
interface Payout {
  _id: ObjectId;

  payoutReference: string;

  parentOrderId: ObjectId;

  allocationId: ObjectId;

  sellerOrderId?: ObjectId;
  deliveryId?: ObjectId;

  beneficiaryType:
    | "seller"
    | "courier";

  beneficiaryId: ObjectId;

  destination: {
    operator: string;
    phoneNumber: string;
    accountName?: string;
  };

  amount: number;

  currency: string;

  provider: string;

  providerPayoutId?: string;

  status:
    | "blocked"
    | "eligible"
    | "queued"
    | "processing"
    | "succeeded"
    | "failed"
    | "unknown"
    | "cancelled";

  attemptsCount: number;

  lastAttemptAt?: Date;

  nextRetryAt?: Date;

  failureCode?: string;
  failureMessage?: string;

  completedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}
```

Un Payout correspond à un bénéficiaire et à une somme précise.

Exemple :

```text
PARENT ORDER FC-00125

PAYOUT-001
  Seller A
  45 000 GNF
  SUCCEEDED

PAYOUT-002
  Seller B
  30 000 GNF
  SUCCEEDED

PAYOUT-003
  Seller C
  20 000 GNF
  FAILED

PAYOUT-004
  Courier
  5 000 GNF
  SUCCEEDED
```

Le système doit conserver ces quatre enregistrements indépendamment.

# 8. GESTION DES PAIEMENTS INDIVIDUELS ET PAR LOT

Le backend doit proposer deux modes d'exécution.

## Mode A : reversement individuel

Le backend envoie une requête indépendante au prestataire pour un seul bénéficiaire.

Exemple :

```text
POST /payouts

Beneficiary: Seller A
Amount: 45 000 GNF
Reference: PAYOUT-001
```

Ce mode doit être utilisé pour les relances individuelles, les petites opérations et les bénéficiaires dont le paiement nécessite un traitement spécifique.

## Mode B : reversement par lot

Lorsque plusieurs reversements sont éligibles, le backend peut les grouper dans une demande de paiement par lot si le prestataire le permet.

Exemple :

```text
PAYOUT BATCH BATCH-001

Payout A: Seller A - 45 000 GNF
Payout B: Seller B - 30 000 GNF
Payout C: Seller C - 20 000 GNF
Payout D: Courier - 5 000 GNF
```

Le backend envoie une seule demande de lot au prestataire.

Mais attention :

**Un lot de reversements ne signifie pas un paiement global indivisible.**

Chaque élément doit garder sa propre référence et son propre statut.

Le prestataire doit idéalement retourner un résultat individuel pour chaque bénéficiaire.

Exemple de réponse attendue :

```json
{
  "batchReference": "BATCH-001",
  "status": "partially_completed",
  "results": [
    {
      "reference": "PAYOUT-001",
      "status": "success"
    },
    {
      "reference": "PAYOUT-002",
      "status": "success"
    },
    {
      "reference": "PAYOUT-003",
      "status": "failed"
    },
    {
      "reference": "PAYOUT-004",
      "status": "success"
    }
  ]
}
```

Les statuts doivent être enregistrés individuellement.

Un lot peut donc avoir un état global `partially_completed`, mais les Payouts qui le composent conservent leurs propres états.

Le backend ne doit jamais interpréter un résultat global de lot comme une confirmation de réussite pour tous ses bénéficiaires.

# 9. RÈGLE CRITIQUE : RELANCER UNIQUEMENT UN REVERSEMENT ÉCHOUÉ

C'est une exigence de sécurité financière absolue.

Imaginons :

| Bénéficiaire | Montant | État |
|---|---:|---|
| Vendeur A | 45 000 | Réussi |
| Vendeur B | 30 000 | Réussi |
| Vendeur C | 20 000 | Échoué |
| Livreur | 5 000 | Réussi |

Le prestataire a correctement payé A, B et le livreur.

Seul le paiement de C a échoué.

L'administrateur doit pouvoir cliquer sur :

**Relancer le reversement de Vendeur C.**

Le backend doit alors :

1. Charger exclusivement le Payout de C.
2. Vérifier que son statut est réellement `failed`.
3. Vérifier que son allocation est toujours due.
4. Vérifier qu'aucune autre opération active n'existe pour cette instruction.
5. Vérifier le solde disponible chez le prestataire.
6. Créer une nouvelle tentative de paiement.
7. Envoyer uniquement la demande destinée à C.
8. Mettre à jour uniquement le Payout de C.
9. Conserver l'historique de ses tentatives.

Aucun des autres Payouts ne doit être réexécuté.

**Il est interdit de relancer tout le ParentOrder pour résoudre l'échec d'un seul reversement.**

## 9.1. Gestion des tentatives

Créer une collection `PayoutAttempt`.

```typescript
interface PayoutAttempt {
  _id: ObjectId;

  payoutId: ObjectId;

  attemptNumber: number;

  attemptReference: string;

  providerReference?: string;

  status:
    | "created"
    | "processing"
    | "succeeded"
    | "failed"
    | "unknown";

  requestPayload: object;

  responsePayload?: object;

  failureCode?: string;
  failureMessage?: string;

  startedAt: Date;
  completedAt?: Date;
}
```

Exemple :

```text
PAYOUT-003 : SELLER C

Attempt 1
  Montant : 20 000 GNF
  Statut : FAILED
  Motif : Numéro invalide

Attempt 2
  Montant : 20 000 GNF
  Statut : FAILED
  Motif : Solde insuffisant

Attempt 3
  Montant : 20 000 GNF
  Statut : SUCCEEDED
```

L'historique doit être permanent.

Une tentative échouée ne doit pas disparaître lorsqu'une nouvelle tentative est créée.

## 9.2. Gestion des réponses inconnues

Un point particulièrement important :

Si une requête est envoyée au prestataire et que Railway rencontre un timeout avant de recevoir la réponse, il ne faut pas immédiatement considérer le transfert comme échoué.

Le prestataire a peut-être exécuté le transfert malgré le timeout.

Le Payout doit alors passer à :

```text
status: "unknown"
```

Le backend doit d'abord :

1. Interroger le prestataire avec la référence de l'opération.
2. Vérifier si le transfert a été exécuté.
3. Attendre éventuellement un webhook de confirmation.
4. Ne déclencher une nouvelle tentative que lorsque le précédent transfert est confirmé comme définitivement échoué ou non exécuté.

Ne jamais renvoyer aveuglément une demande lorsqu'on ignore si le premier transfert a réussi.

# 10. SÉCURITÉ ANTI-DOUBLE PAIEMENT

Le système doit garantir qu'un même reversement ne peut pas être exécuté deux fois par accident.

Prévoir les protections suivantes.

## 10.1. Références uniques

Chaque instruction de paiement doit avoir une référence interne unique.

Exemple :

```text
FC-ORDER-00125-SELLER-A
FC-ORDER-00125-SELLER-B
FC-ORDER-00125-SELLER-C
FC-ORDER-00125-COURIER-01
```

Les références doivent être associées à des contraintes d'unicité en base de données.

## 10.2. Idempotence

Chaque opération externe doit utiliser une clé d'idempotence si le prestataire la supporte.

Une répétition du même appel technique ne doit pas provoquer deux transferts.

Il faut distinguer :

- La référence permanente du Payout.
- La référence propre à chaque tentative.
- La référence de transaction fournie par le prestataire.

Une relance autorisée après un échec définitif crée une nouvelle tentative, mais ne crée pas une nouvelle allocation financière.

## 10.3. Verrouillage concurrent

Deux processus ne doivent pas pouvoir traiter simultanément le même Payout.

Utiliser une mise à jour atomique dans MongoDB qui réserve le Payout avant l'appel externe.

Prévoir des champs tels que :

```typescript
{
  status: "processing",
  lockedAt: new Date(),
  lockedBy: "worker-01",
  lockExpiresAt: new Date()
}
```

Utiliser également une vérification du statut attendu dans la requête de mise à jour.

Si un worker plante, un mécanisme de récupération peut reprendre les opérations dont le verrou est expiré, mais uniquement après vérification de leur état auprès du prestataire.

Un verrou expiré ne signifie pas que le transfert précédent a échoué.

# 11. COLLECTION PAYOUT BATCHES

Pour les opérations groupées, conserver un historique du lot.

```typescript
interface PayoutBatch {
  _id: ObjectId;

  batchReference: string;

  provider: string;

  payoutIds: ObjectId[];

  totalAmount: number;

  currency: string;

  status:
    | "created"
    | "submitted"
    | "processing"
    | "completed"
    | "partially_completed"
    | "failed"
    | "unknown";

  providerBatchId?: string;

  submittedAt?: Date;
  completedAt?: Date;
}
```

Un Payout ne doit pas perdre son identité lorsqu'il est intégré dans un lot.

En cas d'échec partiel, seul le Payout concerné doit être relancé.

Il faut également conserver les réponses individuelles du prestataire pour permettre une réconciliation ultérieure.

# 12. SÉPARATION DES STATUTS

Il ne faut jamais confondre les statuts de commande, de paiement, de livraison et de reversement.

Ces quatre processus sont indépendants.

Exemple :

```text
PARENT ORDER
  Status: partially_delivered

PAYMENT
  Status: paid

SELLER ORDER A
  Delivery: received
  Payout: paid

SELLER ORDER B
  Delivery: in_transit
  Payout: not_eligible

SELLER ORDER C
  Delivery: received
  Payout: failed

COURIER
  Delivery: confirmed
  Payout: paid

FRIPCASH COMMISSION
  Status: retained
```

La commande parent ne doit pas être marquée comme entièrement terminée uniquement parce que le paiement initial a réussi.

De même, un vendeur peut avoir reçu son argent même si la commande globale est encore partiellement livrée.

# 13. API BACKEND À PRÉVOIR

Les endpoints peuvent être organisés ainsi.

## Commandes

```text
POST   /api/v1/orders
GET    /api/v1/orders/:orderId
GET    /api/v1/orders/:orderId/financial-summary
GET    /api/v1/orders/:orderId/seller-orders
```

## Paiements

```text
POST   /api/v1/payments/create
POST   /api/v1/payments/webhook/:provider
GET    /api/v1/payments/:paymentId
POST   /api/v1/payments/:paymentId/verify
```

## Livraisons et confirmations

```text
POST   /api/v1/deliveries/:deliveryId/confirm-delivery
POST   /api/v1/seller-orders/:sellerOrderId/confirm-receipt
GET    /api/v1/deliveries/:deliveryId
```

## Reversements

```text
GET    /api/v1/admin/payouts
GET    /api/v1/admin/payouts/:payoutId
POST   /api/v1/admin/payouts/:payoutId/retry
POST   /api/v1/admin/payouts/execute-batch
GET    /api/v1/admin/payouts/:payoutId/attempts
GET    /api/v1/admin/payout-batches/:batchId
```

## Webhooks de reversement

```text
POST   /api/v1/payouts/webhook/:provider
```

Ces endpoints d'administration doivent être protégés par des permissions strictes.

Les vendeurs et les livreurs ne doivent jamais pouvoir déclencher directement un transfert en fournissant eux-mêmes un montant ou un numéro destinataire.

# 14. LOGIQUE DE DÉCLENCHEMENT DES REVERSEMENTS

Le service métier peut suivre cette organisation :

```text
OrderService
    createParentOrder()
    createSellerOrders()
    calculateFinancialBreakdown()

PaymentService
    createPayment()
    verifyPayment()
    handlePaymentWebhook()

DeliveryService
    confirmDelivery()
    confirmSellerOrderReceipt()
    validateDeliveryOTP()

FinancialService
    createAllocations()
    validateFinancialBalance()
    calculateSellerCommission()
    markAllocationEligible()

PayoutService
    createPayout()
    executePayout()
    executePayoutBatch()
    retryFailedPayout()
    verifyUnknownPayout()
    processPayoutWebhook()

ReconciliationService
    reconcilePayment()
    reconcilePayout()
    reconcileProviderBalance()
    detectMissingPayouts()
    detectDuplicateOperations()
```

Exemple de logique simplifiée :

```typescript
async function confirmSellerReceipt(
  sellerOrderId: string,
  buyerId: string
) {
  const sellerOrder =
    await SellerOrder.findById(sellerOrderId);

  if (!sellerOrder) {
    throw new Error("SellerOrder introuvable");
  }

  if (
    sellerOrder.buyerId.toString() !== buyerId
  ) {
    throw new Error("Accès non autorisé");
  }

  if (sellerOrder.deliveryStatus === "received") {
    return sellerOrder;
  }

  // Vérifier le paiement, la livraison,
  // les litiges et les conditions métier.

  // Confirmer la réception dans une transaction DB.

  // Rendre éligible uniquement l'allocation
  // appartenant à cette sous-commande.

  // Créer ou récupérer son Payout unique.

  // Déclencher le service de reversement
  // sans toucher aux autres bénéficiaires.

  return sellerOrder;
}
```

Ce code est illustratif : la vraie implémentation doit gérer les transactions MongoDB, les conflits concurrents et les réponses du prestataire.

Le point essentiel est que `confirmSellerReceipt()` ne doit jamais relancer tous les reversements du ParentOrder.

# 15. LEDGER FINANCIER ET RÉCONCILIATION

Pour rendre le système réellement fiable, ajouter un journal financier immuable.

Collection :

```text
financialLedger
```

Chaque événement financier important doit y être enregistré :

- Paiement client confirmé.
- Allocation créée.
- Allocation rendue éligible.
- Reversement demandé.
- Reversement confirmé.
- Reversement échoué.
- Remboursement effectué.
- Ajustement financier.
- Commission reconnue.

Le ledger doit permettre de reconstruire l'historique financier d'une commande.

Ne pas utiliser uniquement le statut actuel d'un Payout pour comprendre ce qui s'est passé.

Chaque mouvement doit contenir une référence, un montant, une devise, une date, le type d'opération et l'identifiant de l'opération concernée.

## Réconciliation automatique

Un processus périodique doit comparer :

1. Les paiements enregistrés dans MongoDB.
2. Les encaissements confirmés par le prestataire.
3. Les allocations créées.
4. Les reversements demandés.
5. Les reversements réellement exécutés.
6. Le solde communiqué par le prestataire.

Le backend doit signaler les différences, les opérations inconnues, les transferts non rapprochés et les allocations restées trop longtemps sans traitement.

Une différence financière ne doit jamais être corrigée automatiquement en inventant un mouvement.

# 16. GESTION DES REMBOURSEMENTS ET LITIGES

Le système doit prévoir les situations suivantes :

- Le vendeur annule une commande après paiement.
- Le vendeur ne livre jamais le produit.
- Le client signale un colis manquant.
- Le client conteste l'état du produit.
- Le livreur ne termine pas sa mission.
- Un transfert vendeur est déjà effectué alors que le client demande un remboursement.

Lorsqu'une allocation n'a pas encore été reversée, elle peut être bloquée ou ajustée selon la décision autorisée.

Lorsqu'un vendeur a déjà reçu son argent, le remboursement ne doit pas simplement modifier son ancien Payout en supprimant son paiement.

Il faut créer une opération de remboursement ou de recouvrement indépendante et conserver le mouvement initial dans le ledger.

Un litige doit bloquer les allocations concernées, et non automatiquement celles des autres vendeurs.

# 17. SÉCURITÉ ET PERMISSIONS ADMINISTRATEUR

L'administration financière doit être strictement sécurisée.

L'administrateur peut :

- Consulter les encaissements.
- Consulter les allocations.
- Consulter les reversements.
- Consulter les tentatives.
- Consulter les lots.
- Relancer un reversement définitivement échoué.
- Consulter les réponses du prestataire.
- Bloquer un reversement en cas de litige.
- Consulter les rapprochements financiers.

L'administrateur ne doit pas pouvoir modifier arbitrairement le montant d'un Payout après la capture du paiement.

Toute modification exceptionnelle doit passer par un ajustement comptable traçable et autorisé.

Mesures obligatoires :

- Authentification forte pour les opérations financières sensibles.
- Vérification des rôles et permissions.
- Journalisation de chaque action administrative.
- Validation des signatures des webhooks.
- Protection des clés API.
- Variables secrètes stockées sur Railway.
- Limitation des accès aux informations Mobile Money.
- Aucun numéro ou montant fourni par le frontend ne doit être considéré comme une source financière fiable.

# 18. POINTS TECHNIQUES SPÉCIFIQUES À MONGODB ET RAILWAY

La création des commandes, des allocations et des instructions initiales doit utiliser des transactions MongoDB lorsque les opérations concernent plusieurs documents qui doivent être cohérents.

La configuration MongoDB doit donc supporter les transactions.

Il ne faut jamais garder une transaction MongoDB ouverte pendant un appel HTTP au prestataire de paiement.

Architecture recommandée :

1. Ouvrir une transaction MongoDB.
2. Créer ou mettre à jour les documents internes nécessaires.
3. Valider la transaction.
4. Créer un événement de traitement dans une collection `outbox`.
5. Un worker traite cet événement et contacte le prestataire.
6. Le résultat externe est enregistré dans une nouvelle transaction MongoDB.

Le pattern Outbox est recommandé pour éviter qu'un événement financier soit perdu lorsqu'un serveur redémarre après une modification en base de données.

Le worker doit être résistant aux redémarrages de Railway.

Prévoir :

- Des tâches persistantes.
- Une reprise des événements non traités.
- Des verrous temporaires.
- Des délais de nouvelle tentative.
- Une limite de tentatives.
- Une file séparée pour les opérations inconnues à réconcilier.
- Des alertes sur les opérations bloquées.

Ne pas dépendre exclusivement de tâches en mémoire ou de timers Node.js.

# 19. SCÉNARIOS DE TEST OBLIGATOIRES

Avant la mise en production, les cas suivants doivent être testés.

**Scénario 1 — Paiement réussi**

Trois vendeurs, un livreur, une commission FripCash.

Résultat attendu : un paiement client, trois sous-commandes et toutes les allocations correctement créées.

**Scénario 2 — Un vendeur reçoit son colis avant les autres**

Le vendeur A est payé.

Les vendeurs B et C restent en attente.

Résultat attendu : seul A possède un Payout exécuté.

**Scénario 3 — Un reversement échoue**

A, B et le livreur sont payés.

C échoue.

Résultat attendu : le système conserve les trois succès et seul C peut être relancé.

**Scénario 4 — Relance du reversement**

C échoue une première fois, puis une nouvelle tentative réussit.

Résultat attendu : deux tentatives dans l'historique et un seul reversement réussi.

**Scénario 5 — Webhook reçu deux fois**

Le prestataire envoie deux fois le même événement de paiement.

Résultat attendu : un seul paiement marqué comme confirmé, une seule série d'allocations.

**Scénario 6 — Timeout du prestataire**

La requête de transfert expire sans réponse.

Résultat attendu : Payout en `unknown`, vérification auprès du prestataire avant une nouvelle tentative.

**Scénario 7 — Deux workers simultanés**

Deux workers tentent d'exécuter le même Payout.

Résultat attendu : un seul worker obtient le verrou et aucune double opération.

**Scénario 8 — Lot partiellement exécuté**

Le prestataire confirme trois succès et un échec.

Résultat attendu : les trois Payouts réussis restent définitivement réussis et seul le Payout échoué est relançable.

**Scénario 9 — Deux livraisons séparées**

Un parent contient plusieurs sous-commandes livrées à des moments différents.

Résultat attendu : chaque vendeur est payé uniquement après confirmation de son colis, et chaque prestation de livraison est rémunérée une seule fois.

**Scénario 10 — Litige**

Le client ouvre un litige pour le vendeur B.

Résultat attendu : le reversement de B est bloqué, sans bloquer automatiquement les autres vendeurs.

**Scénario 11 — Remboursement**

Une sous-commande doit être remboursée après que le paiement global a été encaissé.

Résultat attendu : remboursement traçable, recalcul des sommes dues et aucune suppression de l'historique initial.

# 20. RÈGLES NON NÉGOCIABLES

Les règles suivantes constituent les garanties essentielles du système :

1. Un seul paiement client pour un ParentOrder.
2. Un vendeur ne possède qu'une sous-commande par ParentOrder, sauf règle métier explicitement différente.
3. Chaque sous-commande possède ses propres montants financiers.
4. Chaque allocation est indépendante.
5. Chaque bénéficiaire possède son propre Payout.
6. Aucun reversement vendeur avant que les conditions de réception soient validées.
7. Le paiement du livreur est indépendant de ceux des vendeurs.
8. La commission FripCash est identifiée et comptabilisée séparément.
9. Un Payout réussi n'est jamais renvoyé automatiquement.
10. Une relance doit toujours cibler un seul Payout.
11. Les lots conservent des résultats indépendants par bénéficiaire.
12. Un timeout ne doit jamais être assimilé automatiquement à un échec.
13. Les webhooks doivent être authentifiés et idempotents.
14. Les montants financiers sont calculés et contrôlés côté backend.
15. Chaque opération financière doit laisser une trace permanente.
16. Le montant total des allocations doit être rapproché du montant encaissé.
17. Aucun reversement ne doit être déclenché deux fois à la suite d'un redémarrage serveur.
18. Un litige ne doit bloquer que les sommes concernées.
19. Les remboursements doivent être traités comme des opérations financières distinctes.
20. Le système doit pouvoir être réconcilié avec les données du prestataire.

# 21. RÉSULTAT FINAL ATTENDU

À la fin de l'implémentation, FripCash doit permettre à l'administrateur de visualiser une commande parent de cette manière :

```text
COMMANDE FRIPCASH FC-00125

CLIENT : Client 001
MONTANT ENCAISSÉ : 115 000 GNF
PAIEMENT : CONFIRMÉ

------------------------------------
SOUS-COMMANDES
------------------------------------

VENDEUR A
  Montant brut : 50 000 GNF
  Commission : 5 000 GNF
  Net vendeur : 45 000 GNF
  Livraison : REÇUE
  Reversement : RÉUSSI

VENDEUR B
  Montant brut : 35 000 GNF
  Commission : 5 000 GNF
  Net vendeur : 30 000 GNF
  Livraison : REÇUE
  Reversement : RÉUSSI

VENDEUR C
  Montant brut : 25 000 GNF
  Commission : 5 000 GNF
  Net vendeur : 20 000 GNF
  Livraison : REÇUE
  Reversement : ÉCHOUÉ

------------------------------------
LIVRAISON
------------------------------------

LIVREUR 001
  Rémunération : 5 000 GNF
  Livraison : CONFIRMÉE
  Reversement : RÉUSSI

------------------------------------
COMMISSION FRIPCASH
------------------------------------

Commission : 15 000 GNF
Statut : CONSERVÉE SUR LE COMPTE MARCHAND

------------------------------------
SITUATION FINANCIÈRE
------------------------------------

Encaissement : 115 000 GNF
Reversements réussis : 80 000 GNF
Reversement en échec : 20 000 GNF
Commission conservée : 15 000 GNF

ACTION ADMINISTRATEUR :

[ Voir les détails de Vendeur C ]
[ Relancer uniquement le reversement de C ]
```

La relance de C ne doit absolument pas toucher aux autres opérations.

L'administrateur doit pouvoir consulter toute la chaîne de traitement : paiement initial, création des allocations, confirmation de réception, demandes de reversement, réponses du prestataire et tentatives successives.

---

# 22. CONSIGNE FINALE POUR L'IMPLÉMENTATION

L'implémentation doit être réalisée comme un véritable système financier interne de marketplace, et non comme une simple fonctionnalité d'envoi d'argent.

Avant de modifier le code existant :

1. Auditer les modèles Order, SellerOrder, Payment, Delivery et les services de paiement actuels.
2. Identifier les fonctionnalités déjà opérationnelles.
3. Conserver les routes et comportements compatibles avec les fonctionnalités existantes.
4. Identifier les éventuelles incohérences financières dans les anciennes commandes.
5. Proposer un plan de migration des données.
6. Mettre en place les nouveaux modèles et services sans casser les flux existants.
7. Implémenter les protections anti-double paiement.
8. Tester les paiements individuels, les paiements en lots, les échecs partiels et les relances.
9. Produire des tests automatisés couvrant les scénarios précédents.
10. Documenter les variables d'environnement nécessaires au prestataire de paiement.

Ne jamais considérer qu'une opération est payée uniquement parce qu'une requête HTTP a répondu avec un code 200.

La seule source de vérité pour un transfert est son statut vérifié auprès du prestataire de paiement, associé à une référence unique et à son historique.

**PRINCIPE FINAL : un ParentOrder, un paiement acheteur, plusieurs SellerOrders indépendantes, des allocations financières distinctes et un Payout indépendant par bénéficiaire. Aucune réussite ne doit être répétée, aucun échec ne doit empêcher les autres paiements et chaque opération doit pouvoir être auditée.**