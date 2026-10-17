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

export function cartShippingGnf(tariffs: Tariff[], toZoneId: string, itemZoneIds: (string | null | undefined)[]) {
  if (!toZoneId) return 0;
  const origins = [...new Set(itemZoneIds.filter((id): id is string => !!id))];
  if (!origins.length) return tariffAmountGnf(tariffs, null, toZoneId);
  return origins.reduce((sum, from) => sum + tariffAmountGnf(tariffs, from, toZoneId), 0);
}
