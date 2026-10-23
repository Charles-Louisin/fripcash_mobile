import { api } from './client';
import type { Category, Listing, ListingDestination, PublicShop, Review, Tariff, Zone, Comment } from './types';

export const fetchCategories = () => api.get<Category[]>('/catalog/categories');
export const fetchZones = () => api.get<Zone[]>('/catalog/zones');
export const fetchTariffs = () => api.get<Tariff[]>('/catalog/tariffs');
export const fetchBestSellers = () => api.get<Listing[]>('/catalog/best-sellers');
export const fetchPublicStats = () =>
  api.get<{ totalArticles?: number; articles?: number; users?: number; orders?: number; rating?: number }>(
    '/catalog/public-stats'
  );

export type ShopKindFilter = 'particulier' | 'standard' | 'proximite' | 'enseigne';

export function fetchShops(params?: {
  shopKind?: ShopKindFilter;
  q?: string;
  limit?: number;
  minRating?: number;
  createdWithinDays?: number;
  dateFrom?: string;
  dateTo?: string;
}) {
  return api.get<PublicShop[]>('/catalog/shops', params);
}

export type ListingQuery = {
  destination?: ListingDestination | string;
  categoryId?: string;
  q?: string;
  mine?: '1';
  sellerId?: string;
  shopKind?: string;
  sellerKind?: string;
  minListingRating?: number;
  minSellerRating?: number;
  createdWithinDays?: number;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
};

export const fetchListings = (params?: ListingQuery) => api.get<Listing[]>('/listings', params);
export const fetchListing = (id: string) => api.get<Listing>(`/listings/${id}`);

export type ListingInput = {
  title: string;
  description?: string;
  netPriceGnf: number;
  quantity: number;
  destination: ListingDestination;
  categoryId?: string;
  conditionNote?: string;
  negotiable?: boolean;
  discountEnabled?: boolean;
  compareAtPriceGnf?: number | null;
  pickupEnabled?: boolean;
};

export const createListing = (body: ListingInput) => api.post<Listing>('/listings', body);
export const updateListing = (id: string, body: Partial<ListingInput & { status: string }>) =>
  api.patch<Listing>(`/listings/${id}`, body);
export const deleteListing = (id: string) => api.delete<{ status: boolean }>(`/listings/${id}`);

export const attachListingMedia = (
  listingId: string,
  body: { url: string; publicId: string; mimeType?: string; sortOrder?: number }
) => api.post(`/listings/${listingId}/media`, body);
export const deleteListingMedia = (listingId: string, mediaId: string) =>
  api.delete(`/listings/${listingId}/media/${mediaId}`);

export const fetchListingComments = (id: string) => api.get<Comment[]>(`/listings/${id}/comments`);
export const createListingComment = (id: string, body: string) =>
  api.post<Comment>(`/listings/${id}/comments`, { body });
export const fetchListingReviews = (id: string) => api.get<Review[]>(`/listings/${id}/reviews`);

export const fetchPublicSeller = (id: string) => api.get<PublicShop>(`/sellers/${id}/public`);
export const toggleSellerLike = (id: string) =>
  api.post<{ liked: boolean; likesCount: number }>(`/sellers/${id}/like`);
export const fetchSellerReviews = (id: string) => api.get<Review[]>(`/sellers/${id}/reviews`);

export const reportContent = (body: { reason: string; listingId?: string; userId?: string }) =>
  api.post<{ id: string; status: string }>('/reports', body);
