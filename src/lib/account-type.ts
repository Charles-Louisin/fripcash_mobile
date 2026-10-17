import type { Me } from '@/lib/api';

export type AccountTypeId = 'acheteur' | 'particulier' | 'boutique' | 'commerceLocal' | 'grandeSurface';

export type AccountType = {
  id: AccountTypeId;
  label: string;
  description: string;
  destination: string | null;
  isSeller: boolean;
  isShop: boolean;
  requiresAdminApproval: boolean;
  verificationStatus: 'none' | 'pending' | 'approved' | 'rejected';
  canPublish: boolean;
  seesExcel: boolean;
  seesLibrary: boolean;
  excelImport: boolean;
  productLibrary: boolean;
};

const BASE: Record<AccountTypeId, Pick<AccountType, 'label' | 'description' | 'destination' | 'isSeller' | 'isShop' | 'requiresAdminApproval'>> = {
  acheteur: {
    label: 'Acheteur',
    description: 'Tu achètes sur FripCash. Tu n’as pas encore de profil vendeur.',
    destination: null,
    isSeller: false,
    isShop: false,
    requiresAdminApproval: false,
  },
  particulier: {
    label: 'Vendeur particulier',
    description: 'Tu vends déjà en Seconde main — pas de validation admin.',
    destination: 'Seconde main',
    isSeller: true,
    isShop: false,
    requiresAdminApproval: false,
  },
  boutique: {
    label: 'Boutique',
    description: 'Tu es vendeur d’articles neufs, toute la ville.',
    destination: 'Articles neufs',
    isSeller: true,
    isShop: true,
    requiresAdminApproval: false,
  },
  commerceLocal: {
    label: 'Commerce local',
    description: 'Tu es vendeur de proximité. La publication publique attend la validation admin.',
    destination: 'Boutiques de quartier',
    isSeller: true,
    isShop: true,
    requiresAdminApproval: true,
  },
  grandeSurface: {
    label: 'Enseigne',
    description: 'Tu es déjà vendeur enseigne. Catalogue et outils s’ouvrent après validation admin.',
    destination: 'Enseignes',
    isSeller: true,
    isShop: true,
    requiresAdminApproval: true,
  },
};

function idFor(me?: Me | null): AccountTypeId {
  const seller = me?.seller;
  if (seller?.kind === 'particulier') return 'particulier';
  if (seller?.kind === 'boutique') {
    if (seller.shopKind === 'proximite') return 'commerceLocal';
    if (seller.shopKind === 'enseigne') return 'grandeSurface';
    return 'boutique';
  }
  return 'acheteur';
}

export function resolveAccountType(me?: Me | null): AccountType {
  const id = idFor(me);
  const base = BASE[id];
  const raw = me?.seller?.verificationStatus;
  const verificationStatus =
    raw === 'pending' || raw === 'approved' || raw === 'rejected' || raw === 'none'
      ? raw
      : base.requiresAdminApproval
        ? 'pending'
        : 'approved';
  const canPublish =
    base.isSeller && verificationStatus !== 'rejected' && (!base.requiresAdminApproval || verificationStatus === 'approved');
  const seesExcel = base.isShop;
  const seesLibrary = id === 'commerceLocal';
  return {
    id,
    ...base,
    verificationStatus,
    canPublish,
    seesExcel,
    seesLibrary,
    excelImport: seesExcel && canPublish,
    productLibrary: seesLibrary && canPublish,
  };
}

export function verificationLabel(status: AccountType['verificationStatus']) {
  if (status === 'approved') return "Validé par l'équipe";
  if (status === 'pending') return 'En attente de validation';
  if (status === 'rejected') return 'Dossier refusé';
  return 'Aucune validation requise';
}
