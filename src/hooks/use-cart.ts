import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import {
  addCartItem,
  fetchCart,
  fetchListing,
  listingImages,
  mediaUrl,
  removeCartItem,
  updateCartItem,
  type Cart,
  type Listing,
} from '@/lib/api';
import { useGuestCart } from '@/stores/guest-cart';

import { qk, useAuth } from './queries';

export type CartLine = {
  key: string;
  listingId: string;
  title: string;
  priceGnf: number;
  imageUrl: string | null;
  quantity: number;
  maxQuantity: number;
  soldOut: boolean;
  zoneId: string | null;
  negotiable: boolean;
  sellerId: string | null;
  sellerName: string | null;
  conditionNote: string | null;
  sellerOnVacation: boolean;
  bundle: { minItems: number; percent: number } | null;
  /** Prix d'une offre acceptée, appliqué à une seule unité au paiement. */
  offerPriceGnf: number | null;
};

export function isListingSoldOut(listing: Pick<Listing, 'quantity' | 'status'>) {
  return listing.quantity <= 0 || listing.status !== 'ACTIVE';
}

export function lineTotalGnf(line: CartLine) {
  if (line.offerPriceGnf === null) return line.priceGnf * line.quantity;
  return line.offerPriceGnf + line.priceGnf * (line.quantity - 1);
}

function sellerExtras(full: Listing | undefined) {
  const p = full?.sellerProfile;
  const percent = Number(p?.bundleDiscountPercent) || 0;
  return {
    sellerOnVacation: !!p?.vacationEnabled,
    bundle: p?.bundleEnabled && percent > 0 ? { minItems: Math.max(2, p.bundleMinItems || 2), percent: Math.min(90, percent) } : null,
  };
}

/** Remise « lot » par vendeur, calculée comme au paiement côté serveur. */
export function bundleDiscountGnf(lines: CartLine[]) {
  const bySeller = new Map<string, CartLine[]>();
  for (const line of lines) {
    const key = line.sellerId ?? line.key;
    bySeller.set(key, [...(bySeller.get(key) ?? []), line]);
  }
  let discount = 0;
  for (const group of bySeller.values()) {
    const bundle = group[0].bundle;
    const count = group.reduce((n, l) => n + l.quantity, 0);
    if (!bundle || count < bundle.minItems || group.some((l) => l.offerPriceGnf !== null)) continue;
    const goods = group.reduce((s, l) => s + l.priceGnf * l.quantity, 0);
    discount += goods - Math.round(goods * (1 - bundle.percent / 100));
  }
  return discount;
}

export function useCart() {
  const { isConsumer } = useAuth();
  const client = useQueryClient();
  const guest = useGuestCart();

  const server = useQuery({ queryKey: qk.cart, queryFn: fetchCart, enabled: isConsumer });

  const listingIds = isConsumer
    ? (server.data?.items ?? []).map((i) => i.listingId)
    : guest.items.map((i) => i.listingId);

  const listingQueries = useQueries({
    queries: listingIds.map((id) => ({
      queryKey: qk.listing(id),
      queryFn: () => fetchListing(id),
      staleTime: 30_000,
    })),
  });

  const listingMap = useMemo(() => {
    const map = new Map<string, Listing>();
    listingQueries.forEach((q) => {
      if (q.data) map.set(q.data.id, q.data);
    });
    return map;
  }, [listingQueries]);

  const lines: CartLine[] = useMemo(() => {
    if (isConsumer) {
      return (server.data?.items ?? []).map((item) => {
        const full = listingMap.get(item.listingId);
        const media = [...(item.listing.media ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0];
        const stock = full?.quantity ?? item.listing.quantity;
        const status = full?.status ?? item.listing.status;
        return {
          key: item.id,
          listingId: item.listingId,
          title: item.listing.title,
          priceGnf: item.listing.priceGnf,
          imageUrl: mediaUrl(media?.url) || mediaUrl(media?.storageKey) || (full ? listingImages(full)[0] : null) || null,
          quantity: item.quantity,
          maxQuantity: Math.max(0, stock),
          soldOut: stock <= 0 || status !== 'ACTIVE',
          zoneId: full?.zoneId ?? null,
          negotiable: !!full?.negotiable,
          sellerId: full?.sellerProfileId ?? null,
          sellerName: full?.sellerProfile?.shopName || full?.sellerProfile?.displayName || null,
          conditionNote: full?.conditionNote ?? null,
          ...sellerExtras(full),
          offerPriceGnf:
            item.acceptedOffer && item.acceptedOffer.amountGnf < item.listing.priceGnf
              ? item.acceptedOffer.amountGnf
              : null,
        };
      });
    }
    return guest.items.map((item) => {
      const full = listingMap.get(item.listingId);
      return {
        key: item.listingId,
        listingId: item.listingId,
        title: item.title,
        priceGnf: full?.priceGnf ?? item.priceGnf,
        imageUrl: item.imageUrl || (full ? listingImages(full)[0] : null) || null,
        quantity: item.quantity,
        maxQuantity: full ? Math.max(0, full.quantity) : item.maxQuantity,
        soldOut: full ? isListingSoldOut(full) : false,
        zoneId: full?.zoneId ?? item.zoneId,
        negotiable: !!full?.negotiable,
        sellerId: full?.sellerProfileId ?? null,
        sellerName: full?.sellerProfile?.shopName || full?.sellerProfile?.displayName || null,
        conditionNote: full?.conditionNote ?? null,
        ...sellerExtras(full),
        offerPriceGnf: null,
      };
    });
  }, [isConsumer, server.data, guest.items, listingMap]);

  const invalidate = () => client.invalidateQueries({ queryKey: qk.cart });

  const addMutation = useMutation({
    mutationFn: async ({ listing, quantity }: { listing: Listing; quantity: number }) => {
      if (isListingSoldOut(listing)) throw new Error('Stock épuisé');
      if (isConsumer) {
        const existing = server.data?.items.find((i) => i.listingId === listing.id);
        if (existing) return;
        await addCartItem(listing.id, Math.min(listing.quantity, quantity));
        return;
      }
      guest.add({
        listingId: listing.id,
        title: listing.title,
        priceGnf: listing.priceGnf,
        imageUrl: listingImages(listing)[0] ?? null,
        quantity: Math.min(listing.quantity, quantity),
        maxQuantity: listing.quantity,
        zoneId: listing.zoneId,
      });
    },
    onSuccess: invalidate,
  });

  const setQuantity = useCallback(
    async (line: CartLine, quantity: number) => {
      const q = Math.max(1, Math.min(line.maxQuantity, quantity));
      if (q === line.quantity) return;
      if (isConsumer) {
        const previous = client.getQueryData<Cart>(qk.cart);
        client.setQueryData<Cart>(qk.cart, (old) =>
          old ? { ...old, items: old.items.map((i) => (i.id === line.key ? { ...i, quantity: q } : i)) } : old,
        );
        try {
          client.setQueryData(qk.cart, await updateCartItem(line.key, q));
        } catch (e) {
          client.setQueryData(qk.cart, previous);
          throw e;
        }
      } else {
        guest.setQuantity(line.listingId, q);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isConsumer, guest]
  );

  const remove = useCallback(
    async (line: CartLine) => {
      if (isConsumer) {
        await removeCartItem(line.key);
        await invalidate();
      } else {
        guest.remove(line.listingId);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isConsumer, guest]
  );

  const subtotal = lines.reduce((s, l) => s + lineTotalGnf(l), 0);
  const count = lines.reduce((s, l) => s + l.quantity, 0);

  return {
    lines,
    subtotal,
    count,
    isLoading: isConsumer ? server.isLoading : false,
    refetch: server.refetch,
    add: addMutation.mutateAsync,
    adding: addMutation.isPending,
    setQuantity,
    remove,
  };
}

export async function syncGuestCartToServer() {
  const { items, clear } = useGuestCart.getState();
  if (!items.length) return;
  for (const item of items) {
    try {
      await addCartItem(item.listingId, item.quantity);
    } catch {
      // Article devenu indisponible : on l'ignore.
    }
  }
  clear();
}
