import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  addFavorite,
  fetchCategories,
  fetchConversations,
  fetchCourierGains,
  fetchCourierMe,
  fetchDispute,
  fetchDisputes,
  fetchFavorites,
  fetchListing,
  fetchListings,
  fetchMe,
  fetchMessages,
  fetchMyMissions,
  fetchMyOffers,
  fetchNotifications,
  fetchOpenMissions,
  fetchOrder,
  fetchPublicSeller,
  fetchPurchases,
  fetchSales,
  fetchShops,
  fetchTariffs,
  fetchWalletBalance,
  fetchWalletLedger,
  fetchZones,
  removeFavorite,
  toggleSellerLike,
  type ListingQuery,
  type PublicShop,
  type ShopKindFilter,
} from '@/lib/api';
import { isAdminUser, useSession } from '@/stores/session';

export const qk = {
  me: ['me'] as const,
  categories: ['catalog', 'categories'] as const,
  zones: ['catalog', 'zones'] as const,
  tariffs: ['catalog', 'tariffs'] as const,
  listings: (params?: ListingQuery) => ['listings', params ?? {}] as const,
  listing: (id: string) => ['listing', id] as const,
  shops: (params?: object) => ['shops', params ?? {}] as const,
  seller: (id: string) => ['seller', id] as const,
  cart: ['cart'] as const,
  favorites: ['favorites'] as const,
  purchases: ['orders', 'purchases'] as const,
  sales: ['orders', 'sales'] as const,
  order: (id: string) => ['order', id] as const,
  conversations: ['conversations'] as const,
  messages: (id: string) => ['messages', id] as const,
  notifications: ['notifications'] as const,
  offers: ['offers'] as const,
  disputes: ['disputes'] as const,
  dispute: (id: string) => ['disputes', id] as const,
  wallet: ['wallet'] as const,
  ledger: ['wallet', 'ledger'] as const,
  courierMe: ['courier', 'me'] as const,
  courierGains: ['courier', 'gains'] as const,
  openMissions: ['courier', 'open'] as const,
  myMissions: ['courier', 'missions'] as const,
};

export function useAuth() {
  const token = useSession((s) => s.token);
  const audience = useSession((s) => s.audience);
  const user = useSession((s) => s.user);
  return {
    isAuthed: !!token,
    isCourier: !!token && audience === 'COURIER',
    // Un livreur est aussi un acheteur : il garde l'accès à la boutique.
    isConsumer: !!token,
    isAdmin: !!token && isAdminUser(audience, user),
    user,
  };
}

export function useMe() {
  const { isConsumer } = useAuth();
  return useQuery({ queryKey: qk.me, queryFn: fetchMe, enabled: isConsumer, staleTime: 60_000 });
}

export function useCategories() {
  return useQuery({ queryKey: qk.categories, queryFn: fetchCategories, staleTime: 10 * 60_000 });
}

export function useZones() {
  return useQuery({
    queryKey: qk.zones,
    queryFn: fetchZones,
    staleTime: 10 * 60_000,
    select: (zones) => zones.filter((z) => z.isActive !== false),
  });
}

export function useTariffs() {
  return useQuery({ queryKey: qk.tariffs, queryFn: fetchTariffs, staleTime: 10 * 60_000 });
}

export function useListings(params?: ListingQuery, enabled = true) {
  return useQuery({ queryKey: qk.listings(params), queryFn: () => fetchListings(params), enabled });
}

export function useListing(id?: string) {
  return useQuery({ queryKey: qk.listing(id ?? ''), queryFn: () => fetchListing(id!), enabled: !!id });
}

export function useShops(
  params?: {
    shopKind?: ShopKindFilter;
    q?: string;
    limit?: number;
    minRating?: number;
    createdWithinDays?: number;
    dateFrom?: string;
    dateTo?: string;
  },
  enabled = true,
) {
  return useQuery({ queryKey: qk.shops(params), queryFn: () => fetchShops(params), enabled });
}

export function useSeller(id?: string) {
  return useQuery({ queryKey: qk.seller(id ?? ''), queryFn: () => fetchPublicSeller(id!), enabled: !!id });
}

export function useOrder(id?: string, refetchInterval?: number) {
  const { isAuthed } = useAuth();
  return useQuery({
    queryKey: qk.order(id ?? ''),
    queryFn: () => fetchOrder(id!),
    enabled: !!id && isAuthed,
    refetchInterval,
  });
}

export function usePurchases() {
  const { isConsumer } = useAuth();
  return useQuery({ queryKey: qk.purchases, queryFn: fetchPurchases, enabled: isConsumer });
}

export function useSales(enabled = true) {
  const { isConsumer } = useAuth();
  return useQuery({ queryKey: qk.sales, queryFn: fetchSales, enabled: isConsumer && enabled });
}

export function useConversations(refetchInterval?: number) {
  const { isAuthed } = useAuth();
  return useQuery({
    queryKey: qk.conversations,
    queryFn: fetchConversations,
    enabled: isAuthed,
    refetchInterval,
  });
}

export function useNotifications() {
  const { isAuthed } = useAuth();
  return useQuery({
    queryKey: qk.notifications,
    queryFn: fetchNotifications,
    enabled: isAuthed,
    refetchInterval: 30_000,
  });
}

export function useUnreadCount() {
  const { data } = useNotifications();
  return (data ?? []).filter((n) => !n.read).length;
}

export function useUnreadMessagesCount() {
  const { data } = useNotifications();
  return (data ?? []).filter((n) => !n.read && n.type === 'message').length;
}

export function useWallet() {
  const { isAuthed } = useAuth();
  return useQuery({ queryKey: qk.wallet, queryFn: fetchWalletBalance, enabled: isAuthed });
}

export function useCourierMe() {
  const { isCourier } = useAuth();
  return useQuery({ queryKey: qk.courierMe, queryFn: fetchCourierMe, enabled: isCourier });
}

export function useMessages(id?: string, refetchInterval?: number) {
  const { isAuthed } = useAuth();
  return useQuery({
    queryKey: qk.messages(id ?? ''),
    queryFn: () => fetchMessages(id!),
    enabled: !!id && isAuthed,
    refetchInterval,
  });
}

export function useOffers() {
  const { isConsumer } = useAuth();
  return useQuery({ queryKey: qk.offers, queryFn: fetchMyOffers, enabled: isConsumer });
}

export function useDisputes() {
  const { isConsumer } = useAuth();
  return useQuery({ queryKey: qk.disputes, queryFn: fetchDisputes, enabled: isConsumer });
}

export function useDispute(id?: string, refetchInterval?: number) {
  const { isAuthed } = useAuth();
  return useQuery({
    queryKey: qk.dispute(id ?? ''),
    queryFn: () => fetchDispute(id!),
    enabled: !!id && isAuthed,
    refetchInterval,
  });
}

export function useLedger() {
  const { isAuthed } = useAuth();
  return useQuery({ queryKey: qk.ledger, queryFn: fetchWalletLedger, enabled: isAuthed });
}

export function useOpenMissions() {
  const { isCourier } = useAuth();
  return useQuery({
    queryKey: qk.openMissions,
    queryFn: fetchOpenMissions,
    enabled: isCourier,
    refetchInterval: 20_000,
  });
}

export function useMyMissions() {
  const { isCourier } = useAuth();
  return useQuery({
    queryKey: qk.myMissions,
    queryFn: fetchMyMissions,
    enabled: isCourier,
    refetchInterval: 15_000,
  });
}

export function useCourierGains() {
  const { isCourier } = useAuth();
  return useQuery({ queryKey: qk.courierGains, queryFn: fetchCourierGains, enabled: isCourier });
}

export function useFavorites() {
  const { isConsumer } = useAuth();
  return useQuery({ queryKey: qk.favorites, queryFn: fetchFavorites, enabled: isConsumer });
}

export function useFavoriteIds() {
  const { data } = useFavorites();
  return new Set((data ?? []).map((f) => f.listingId));
}

export function useToggleFavorite() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ listingId, liked }: { listingId: string; liked: boolean }) => {
      if (liked) await removeFavorite(listingId);
      else await addFavorite(listingId);
    },
    onSettled: () => client.invalidateQueries({ queryKey: qk.favorites }),
  });
}

export function useToggleSellerLike() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (sellerId: string) => toggleSellerLike(sellerId),
    onSuccess: (res, sellerId) => {
      client.setQueryData(qk.seller(sellerId), (old: PublicShop | undefined) =>
        old ? { ...old, likedByMe: res.liked, likesCount: res.likesCount } : old
      );
      client.invalidateQueries({ queryKey: ['shops'] });
    },
  });
}
