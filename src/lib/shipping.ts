import type { Tariff } from '@/lib/api';

export function tariffAmountGnf(tariffs: Tariff[], fromZoneId: string | null | undefined, toZoneId: string) {
  if (!toZoneId) return 0;
  if (fromZoneId) {
    const exact = tariffs.find((t) => t.fromZoneId === fromZoneId && t.toZoneId === toZoneId);
    if (exact) return Number(exact.amountGnf) || 0;
  }
  const same = tariffs.find((t) => t.fromZoneId === toZoneId && t.toZoneId === toZoneId);
  if (same) return Number(same.amountGnf) || 0;
  const incoming = tariffs.filter((t) => t.toZoneId === toZoneId);
  if (!incoming.length) return 0;
  return Math.min(...incoming.map((t) => Number(t.amountGnf) || 0));
}

export type SellerDelivery = {
  key: string;
  zoneId: string | null;
  pickup: boolean;
};

/** Frais par vendeur : le trajet part de la zone de chaque vendeur, pas d'un panier global. */
export function sellerShippingGnf(tariffs: Tariff[], toZoneId: string, sellers: SellerDelivery[]) {
  if (!toZoneId) return sellers.map((seller) => ({ key: seller.key, amountGnf: 0 }));
  return sellers.map((seller) => ({
    key: seller.key,
    amountGnf: seller.pickup ? 0 : tariffAmountGnf(tariffs, seller.zoneId, toZoneId),
  }));
}
