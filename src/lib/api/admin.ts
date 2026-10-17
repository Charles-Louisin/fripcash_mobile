import { api } from './client';
import type { Category, Order, Zone } from './types';

export type AdminStats = {
  totalListings: number;
  activeListings: number;
  draftListings: number;
  soldListings: number;
  pendingListings: {
    id: string;
    title: string;
    status: string;
    media?: { url?: string | null; storageKey?: string | null; sortOrder?: number }[];
  }[];
  pendingListingCount: number;
  pendingShopCount: number;
  catalogValueGnf: number;
  commissionRatePercent: number | null;
  categoryChart: { category: string; volume: number }[];
  destinationChart?: { category: string; volume: number }[];
  activity: { id: string; type: string; message: string; time: string }[];
  openDisputes: { id: string; productTitle: string; reason: string; amount: number; status?: string }[];
  openDisputeCount: number;
  escrowGmv: number;
  escrowHoldCount: number;
  totalUsers: number;
  activeDeliveries: number;
  gmv: number;
  totalRevenue: number;
  gmvCourier: number;
  gmvPickup: number;
  chart?: {
    transactions?: { date: string; revenus: number; commissions: number }[];
    inscriptions?: { date: string; acheteurs: number; vendeurs: number }[];
  };
};

export type AdminWallet = {
  id: string;
  userId: string;
  availableGnf: number;
  reservedGnf: number;
  user: { name: string; email: string | null; phone: string | null; kind: string | null; shopKind: string | null } | null;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  banned?: boolean;
  seller?: { shopName?: string; shopKind?: string | null; verificationStatus?: string } | null;
};

export type SellerVerificationRow = {
  id: string;
  shopName?: string;
  shopKind?: string | null;
  verificationStatus?: string;
  displayName?: string;
  phone?: string | null;
  rejectionReason?: string;
  coverUrl?: string;
  shopDescription?: string;
  storeAddress?: string;
  neighborhood?: string;
  landmark?: string;
  soldCategories?: string[];
  deliveredCommunes?: string[];
  deliveryDelay?: string;
  orangeMoneyPhone?: string;
  openingTime?: string;
  closingTime?: string;
  createdAt?: string;
  documents?: { url: string; mimeType?: string; name?: string; documentType?: string }[];
};

export type AdminDispute = {
  id: string;
  orderId?: string;
  productTitle: string;
  productImage?: string;
  reason: string;
  status: 'open' | 'under_review' | 'resolved' | 'closed';
  outcome?: 'refund_buyer' | 'release_seller' | 'partial_refund';
  amount: number;
  buyerName?: string;
  sellerName?: string;
  initiatorName?: string;
  openedAt?: string;
  messages?: { createdAt: string }[];
};

export type AdminReport = {
  id: string;
  target: string;
  reason: string;
  status: string;
  reporterName?: string;
};

export type AdminPartner = {
  id: string;
  name: string;
  kind?: string;
  status?: string;
  note?: string;
  contactEmail?: string | null;
};

export type AdminCourier = {
  id: string;
  name: string;
  phone?: string | null;
  isAvailable?: boolean;
  zoneName?: string | null;
  zoneNames?: string[];
  activeMissions?: number;
  deliveredCount?: number;
  vehicleType?: string;
  plate?: string;
  verificationStatus?: string;
  portraitUrl?: string;
  vehiclePhotoUrl?: string;
  rejectionReason?: string;
  identityDocuments?: { url: string; mimeType?: string; name?: string }[];
};

export type AdminTariff = {
  id: string;
  fromZoneId: string;
  toZoneId: string;
  amountGnf: number;
};

export type PlatformSettings = {
  commissionRateStandard: number;
  commissionRateProximite: number;
  disputeWindowHours?: number;
  maxListingPhotos?: number;
  maintenanceMode?: boolean;
  platformName?: string;
  contactEmail?: string;
  contactPhone?: string;
};

export const fetchAdminStats = (days = 30) => api.get<AdminStats>('/admin/stats', { days });
export const fetchAdminListings = (status = 'ALL') =>
  api.get<
    {
      id: string;
      title: string;
      status: string;
      priceGnf?: number;
      media?: { url?: string | null; storageKey?: string | null; sortOrder?: number }[];
      sellerProfile?: { shopName?: string | null; displayName?: string | null } | null;
      createdAt?: string;
    }[]
  >('/admin/listings', { status });
export const updateAdminListing = (id: string, body: { status?: string }) =>
  api.patch(`/admin/listings/${id}`, body);
export const fetchAdminOrders = () => api.get<Order[]>('/admin/orders');
export const fetchAdminDisputes = () => api.get<AdminDispute[]>('/admin/disputes');
export const resolveAdminDispute = (
  id: string,
  body: { resolution: string; note?: string; buyerPercent?: number; sellerPercent?: number },
) => api.post(`/admin/disputes/${id}/resolve`, body);
export const fetchSellerVerifications = () => api.get<SellerVerificationRow[]>('/admin/seller-verifications');
export const approveSellerVerification = (id: string) => api.post(`/admin/seller-verifications/${id}/approve`, {});
export const rejectSellerVerification = (id: string, reviewerNote: string) =>
  api.post(`/admin/seller-verifications/${id}/reject`, { reviewerNote });
export const fetchAdminReports = () => api.get<AdminReport[]>('/admin/signalements');
export const resolveAdminReport = (id: string) => api.post(`/admin/signalements/${id}/resolve`, { status: 'resolved' });
export const fetchAdminPartners = () => api.get<AdminPartner[]>('/admin/partenaires');
export const fetchAdminWallets = () => api.get<AdminWallet[]>('/admin/wallets');
export const fetchAdminCouriers = () => api.get<AdminCourier[]>('/admin/livreurs');
export const updateAdminCourier = (
  id: string,
  body: { isAvailable?: boolean; verificationStatus?: 'approved' | 'rejected'; rejectionReason?: string }
) => api.patch(`/admin/livreurs/${id}`, body);
export const fetchAdminTariffs = () => api.get<AdminTariff[]>('/admin/tarifs');
export const saveAdminTariffs = (items: { fromZoneId: string; toZoneId: string; amountGnf: number }[]) =>
  api.put('/admin/tarifs', { items });
export const fetchPlatformSettings = () => api.get<PlatformSettings>('/admin/platform-settings');
export const updatePlatformSettings = (body: Partial<PlatformSettings>) =>
  api.patch<PlatformSettings>('/admin/platform-settings', body);
export const fetchAdminUsers = (search?: string) =>
  api.get<{ users: AdminUser[]; total: number }>('/auth/admin/list-users', {
    limit: 80,
    searchValue: search || undefined,
  });
export const banAdminUser = (userId: string) => api.post('/auth/admin/ban-user', { userId });
export const unbanAdminUser = (userId: string) => api.post('/auth/admin/unban-user', { userId });
export const setAdminUserRole = (userId: string, role: 'admin' | 'courier' | 'user') =>
  api.post('/auth/admin/set-role', { userId, role });

export const createCategory = (nameFr: string, destination?: string | null) =>
  api.post<Category>('/catalog/categories', { nameFr, destination: destination ?? null });
export const deleteCategory = (id: string) => api.delete(`/catalog/categories/${id}`);
export const createZone = (body: { code: string; nameFr: string; nameEn: string }) =>
  api.post<Zone>('/catalog/zones', body);
export const updateZone = (id: string, body: Partial<Zone>) => api.patch<Zone>(`/catalog/zones/${id}`, body);
export const deleteZone = (id: string) => api.delete(`/catalog/zones/${id}`);
