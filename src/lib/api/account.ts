import { api } from './client';
import type {
  AppNotification,
  Conversation,
  CourierGains,
  CourierProfile,
  LibraryItem,
  Me,
  Message,
  NotificationPreference,
  Order,
  SellerVerification,
} from './types';

export const fetchMe = () => api.get<Me>('/me');
export const updateMe = (body: {
  name?: string;
  city?: string;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
  phone?: string;
  shippingZoneId?: string;
}) => api.patch<Me>('/me', body);

export const becomeParticulier = (body: { displayName?: string; bio?: string; shippingZoneId?: string }) =>
  api.post<Me>('/me/seller/particulier', body);

export type ShopApplication = {
  shopKind: 'STANDARD' | 'PROXIMITE' | 'ENSEIGNE';
  name: string;
  description: string;
  coverUrl?: string;
  storeAddress?: string;
  neighborhood?: string;
  landmark?: string;
  orangeMoneyPhone?: string;
  openingTime?: string;
  closingTime?: string;
  deliveryDelay?: string;
  soldCategories?: string[];
  deliveredCommunes?: string[];
  shippingZoneId?: string;
  documents: { url: string; storageKey?: string; mimeType?: string; name?: string; documentType?: string }[];
};

export const applyForShop = (body: ShopApplication) => api.post<Me>('/me/seller/shop', body);
export const fetchSellerVerification = () => api.get<SellerVerification>('/me/seller/verification');
export const sendVerificationMessage = (body: string) =>
  api.post('/me/seller/verification/messages', { body });
export const addVerificationDocument = (body: {
  url: string;
  storageKey?: string;
  mimeType?: string;
  name?: string;
  documentType?: string;
}) => api.post('/me/seller/verification/documents', body);
export const closeParticulier = () => api.post<Me>('/me/seller/particulier/close');
export const closeShop = () => api.post<Me>('/me/seller/shop/close');
export const updateBundleSettings = (body: {
  bundleEnabled?: boolean;
  bundleMinItems?: number;
  bundleDiscountPercent?: number;
}) => api.patch<Me>('/me/seller/bundle-settings', body);
export const setVacation = (body: { enabled: boolean; startsAt?: string; endsAt?: string }) =>
  api.post<Me>('/me/seller/tools/vacation', body);
export const fetchLibrary = () => api.get<LibraryItem[]>('/me/seller/tools/library');
export const createLibraryItem = (body: { title: string; description?: string; categoryId?: string }) =>
  api.post<LibraryItem>('/me/seller/tools/library', body);
export type ExcelImportResult = {
  status: string;
  created: number;
  skipped: number;
  errors: { row: number; message: string }[];
};

export const importListingsFile = (body: { base64: string; filename: string }) =>
  api.post<ExcelImportResult>('/me/seller/tools/excel-import', body);

export const fetchConversations = () => api.get<Conversation[]>('/conversations');
export const createConversation = (body: {
  participantIds?: string[];
  listingId?: string;
  orderId?: string;
  with?: 'buyer' | 'seller';
}) =>
  api.post<{ id: string; participantIds: string[] }>('/conversations', body);
export const fetchMessages = (id: string) => api.get<Message[]>(`/conversations/${id}/messages`);
export const sendMessage = (id: string, body: string) => api.post<Message>(`/conversations/${id}/messages`, { body });

export const fetchNotifications = () => api.get<AppNotification[]>('/notifications');
export const markNotificationRead = (id: string) => api.patch(`/notifications/${id}/read`);
export const registerDevice = (token: string, platform: string, audience: string) =>
  api.post('/notifications/devices', { token, platform, audience });
export const fetchNotificationPreferences = () => api.get<NotificationPreference[]>('/notifications/preferences');
export const updateNotificationPreference = (pref: NotificationPreference) =>
  api.put<NotificationPreference[]>('/notifications/preferences', pref);

export const fetchCourierMe = () => api.get<CourierProfile>('/courier/me');
export const updateCourierProfile = (body: {
  name?: string;
  phone?: string;
  city?: string;
  bio?: string;
  vehicle?: string;
  plate?: string;
  portraitUrl?: string;
  zoneIds?: string[];
}) => api.patch<CourierProfile>('/courier/me', body);
export const submitCourierKyc = (body: {
  portraitUrl: string;
  vehiclePhotoUrl: string;
  vehicle: string;
  plate: string;
  zoneIds: string[];
  identityDocuments: { url: string; mimeType?: string; name?: string }[];
}) => api.post<{ verificationStatus: string }>('/courier/kyc', body);
export const setCourierAvailability = (isAvailable: boolean) =>
  api.patch<{ isAvailable: boolean }>('/courier/me/availability', { isAvailable });
export const fetchCourierGains = () => api.get<CourierGains>('/courier/gains');
export const fetchOpenMissions = () => api.get<Order[]>('/courier/missions/open');
export const fetchMyMissions = () => api.get<Order[]>('/courier/missions');
export const acceptMission = (orderId: string) => api.post<Order>(`/courier/missions/${orderId}/accept`);
export const progressMission = (orderId: string, status: 'COLLECTED' | 'IN_TRANSIT' | 'DELIVERED') =>
  api.post<Order>(`/courier/missions/${orderId}/progress`, { status });
