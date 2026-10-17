import type { ComponentProps } from 'react';
import type Ionicons from '@expo/vector-icons/Ionicons';

import type { ListingDestination, OrderStatus, ShopKind, SignupRole } from '@/lib/api';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type Universe = {
  destination: ListingDestination;
  slug: string;
  title: string;
  subtitle: string;
  tagline: string;
  shopKind: 'particulier' | ShopKind;
  sellerNoun: string;
  countNoun: string;
  icon: IconName;
};

export const UNIVERSES: Universe[] = [
  {
    destination: 'SECONDE_MAIN',
    slug: 'seconde-main',
    title: 'Seconde main',
    subtitle: 'Entre particuliers',
    tagline: 'Des milliers de dressings de particuliers près de chez vous.',
    shopKind: 'particulier',
    sellerNoun: 'Dressings à découvrir',
    countNoun: 'articles',
    icon: 'shirt-outline',
  },
  {
    destination: 'ARTICLES_NEUFS',
    slug: 'articles-neufs',
    title: 'Articles neufs',
    subtitle: 'Boutiques et commerçants',
    tagline: 'Découvrez des boutiques de confiance et leurs articles neufs.',
    shopKind: 'standard',
    sellerNoun: 'Boutiques à découvrir',
    countNoun: 'articles',
    icon: 'bag-handle-outline',
  },
  {
    destination: 'QUARTIER_BOUTIQUES',
    slug: 'boutiques-de-quartier',
    title: 'Boutiques de quartier',
    subtitle: 'Retrait près de chez toi !',
    tagline: 'Découvrez les commerces de votre quartier.',
    shopKind: 'proximite',
    sellerNoun: 'Boutiques près de chez vous',
    countNoun: 'boutiques',
    icon: 'storefront-outline',
  },
  {
    destination: 'ENSEIGNES',
    slug: 'enseignes',
    title: 'Enseignes',
    subtitle: 'Livraison en ville',
    tagline: 'Grandes enseignes et magasins de confiance près de chez vous.',
    shopKind: 'enseigne',
    sellerNoun: 'Enseignes',
    countNoun: 'enseignes',
    icon: 'business-outline',
  },
];

export function universeBySlug(slug?: string | null) {
  return UNIVERSES.find((u) => u.slug === slug || u.destination === slug) ?? UNIVERSES[0];
}

export function universeByDestination(destination?: string | null) {
  return UNIVERSES.find((u) => u.destination === destination) ?? null;
}

export function shopKindLabel(sellerKind?: string | null, shopKind?: string | null) {
  if (sellerKind === 'particulier' || (!shopKind && sellerKind !== 'boutique')) return 'Seconde main';
  if (shopKind === 'proximite') return 'Commerce local';
  if (shopKind === 'enseigne') return 'Enseigne';
  return 'Boutique';
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  ORDERED: 'En attente de paiement',
  PAID: 'Payée',
  SELLER_NOTIFIED: 'Vendeur notifié',
  PREPARING: 'En préparation',
  READY_FOR_PICKUP: 'Prête à récupérer',
  COURIER_ASSIGNED: 'Livreur assigné',
  COLLECTED: 'Colis récupéré',
  IN_TRANSIT: 'En route',
  DELIVERED: 'Livrée',
  FUNDS_RELEASED: 'Fonds libérés',
  FEEDBACK_PENDING: 'Terminée',
  DISPUTED: 'En litige',
  REFUNDED: 'Remboursée',
};

const COURIER_STATUS_LABELS: Partial<Record<OrderStatus, string>> = {
  READY_FOR_PICKUP: 'Course disponible',
  COURIER_ASSIGNED: 'Course acceptée',
  COLLECTED: 'Colis collecté',
  DELIVERED: 'Livrée',
};

export function courierStatusLabel(status: OrderStatus) {
  return COURIER_STATUS_LABELS[status] || ORDER_STATUS_LABELS[status];
}

export function orderStatusTone(status: string): 'neutral' | 'warning' | 'success' | 'danger' | 'primary' {
  if (status === 'DISPUTED' || status === 'REFUNDED') return 'danger';
  if (status === 'DELIVERED' || status === 'FUNDS_RELEASED' || status === 'FEEDBACK_PENDING') return 'success';
  if (status === 'COURIER_ASSIGNED' || status === 'READY_FOR_PICKUP') return 'warning';
  if (status === 'IN_TRANSIT' || status === 'COLLECTED') return 'primary';
  return 'neutral';
}

export const ACTIVE_COURIER_STATUSES = ['COURIER_ASSIGNED', 'COLLECTED', 'IN_TRANSIT'];
export const DONE_STATUSES = ['DELIVERED', 'FUNDS_RELEASED', 'FEEDBACK_PENDING'];

export const PAYMENT_METHOD_LABELS = {
  OM_GN: 'Orange Money',
  MTN_GN: 'MTN MoMo',
  CINETPAY: 'CinetPay',
} as const;

export const FULFILLMENT_LABELS = {
  courier: 'Livraison FripCash',
  pickup: 'Retrait en boutique',
  shopLocalDelivery: 'Livraison de proximité',
} as const;

export const SIGNUP_ROLE_OPTIONS: { id: SignupRole; title: string; description: string; icon: IconName }[] = [
  { id: 'acheteur', title: 'Acheteur', description: 'Je veux juste acheter.', icon: 'cart-outline' },
  {
    id: 'particulier',
    title: 'Particulier',
    description: 'Je vends ce que je ne porte plus.',
    icon: 'shirt-outline',
  },
  {
    id: 'boutique',
    title: 'Boutique',
    description: 'Je vends des articles neufs dans toute la ville.',
    icon: 'bag-handle-outline',
  },
  {
    id: 'commerceLocal',
    title: 'Commerce local',
    description: 'Épicerie, éducation, petit commerce de proximité.Validation manuelle de l’équipe.',
    icon: 'storefront-outline',
  },
  {
    id: 'grandeSurface',
    title: 'Grande surface spécialisée',
    description: 'Grosses enseignes et grandes entreprises. Validation manuelle de l’équipe.',
    icon: 'business-outline',
  },
  {
    id: 'livreur',
    title: 'Livreur',
    description: 'Je livre les colis FripCash.',
    icon: 'bicycle-outline',
  },
];

export const LEGAL_PAGES = [
  { path: '/comment-ca-marche', title: 'Comment ça marche' },
  { path: '/commission', title: 'Commissions' },
  { path: '/livraison', title: 'Livraison' },
  { path: '/securite', title: 'Sécurité et séquestre' },
  { path: '/conditions', title: "Conditions d'utilisation" },
  { path: '/confidentialite', title: 'Confidentialité' },
  { path: '/a-propos', title: 'À propos' },
  { path: '/contact', title: 'Contact' },
];
