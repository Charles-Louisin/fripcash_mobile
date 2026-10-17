import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Badge, ChipRow, EmptyState, ErrorState, Screen, ScreenHeader, Skeleton, Txt } from '@/components/ui';
import { fetchAdminDisputes, fetchAdminOrders, mediaUrl, type Order } from '@/lib/api';
import { FULFILLMENT_LABELS, ORDER_STATUS_LABELS, orderStatusTone } from '@/lib/domain';
import { formatGnf, formatRelative, shortOrderId } from '@/lib/format';
import { colors, radius } from '@/theme';

type Filter = 'all' | 'escrow' | 'disputed' | 'done' | 'refunded';

const ESCROW_LABELS: Record<string, string> = {
  pending: 'Paiement en attente',
  held: 'En séquestre',
  payout_pending: 'Versement en cours',
  refund_pending: 'Remboursement en cours',
  released: 'Versé au vendeur',
  refunded: 'Remboursé',
};

const MATCH: Record<Filter, (o: Order) => boolean> = {
  all: () => true,
  escrow: (o) => ['held', 'payout_pending', 'refund_pending'].includes(String(o.escrowStatus)),
  disputed: (o) => o.status === 'DISPUTED',
  done: (o) => ['DELIVERED', 'FUNDS_RELEASED', 'FEEDBACK_PENDING'].includes(o.status),
  refunded: (o) => o.status === 'REFUNDED',
};

export default function AdminOrders() {
  const [filter, setFilter] = useState<Filter>('all');
  const list = useQuery({ queryKey: ['admin', 'orders'], queryFn: fetchAdminOrders });
  const disputes = useQuery({ queryKey: ['admin', 'disputes'], queryFn: fetchAdminDisputes });
  const all = list.data ?? [];
  const rows = all.filter(MATCH[filter]);
  const count = (f: Filter) => all.filter(MATCH[f]).length;
  const disputeFor = (orderId: string) =>
    (disputes.data ?? []).find((d) => d.orderId === orderId && (d.status === 'open' || d.status === 'under_review')) ??
    (disputes.data ?? []).find((d) => d.orderId === orderId);

  return (
    <Screen refreshing={list.isRefetching} onRefresh={() => list.refetch()}>
      <ScreenHeader title="Commandes" subtitle="Paiements et séquestres" />
      <ChipRow
        options={[
          { value: 'all', label: `Toutes (${all.length})` },
          { value: 'escrow', label: `Séquestre (${count('escrow')})` },
          { value: 'disputed', label: `Litiges (${count('disputed')})` },
          { value: 'done', label: 'Livrées' },
          { value: 'refunded', label: 'Remboursées' },
        ]}
        value={filter}
        onChange={setFilter}
      />
      <View style={{ height: 12 }} />
      {list.isLoading ? (
        <View style={{ gap: 10 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={96} radius={radius.lg} />
          ))}
        </View>
      ) : list.isError ? (
        <ErrorState error={list.error} onRetry={() => list.refetch()} />
      ) : !rows.length ? (
        <EmptyState icon="cart-outline" title="Aucune commande" />
      ) : (
        <View style={{ gap: 10 }}>
          {rows.map((order) => {
            const first = order.items?.[0];
            const img = mediaUrl(first?.imageUrl);
            const dispute = disputeFor(order.id);
            return (
              <Pressable
                key={order.id}
                disabled={!dispute}
                onPress={() => dispute && router.push(`/admin/litige/${dispute.id}` as Href)}
                style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}>
                {img ? <Image source={{ uri: img }} style={styles.thumb} contentFit="cover" /> : <View style={styles.thumb} />}
                <View style={{ flex: 1, gap: 3 }}>
                  <Txt variant="bodyStrong" numberOfLines={1}>
                    {first?.title || 'Commande'}
                    {order.items.length > 1 ? ` +${order.items.length - 1}` : ''}
                  </Txt>
                  <Txt variant="caption" numberOfLines={1}>
                    {order.buyer?.pseudo || 'Acheteur'} › {order.seller?.pseudo || 'Vendeur'}
                  </Txt>
                  <Txt variant="small" numberOfLines={1}>
                    {formatGnf(order.amountGnf)} · {FULFILLMENT_LABELS[order.fulfillmentMode] ?? order.fulfillmentMode} ·{' '}
                    {shortOrderId(order.id)} · {formatRelative(order.createdAt)}
                  </Txt>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                    <Badge label={ORDER_STATUS_LABELS[order.status] ?? order.status} tone={orderStatusTone(order.status)} />
                    {order.escrowStatus ? (
                      <Badge label={ESCROW_LABELS[order.escrowStatus] ?? order.escrowStatus} tone="neutral" icon="shield-half-outline" />
                    ) : null}
                    {dispute ? <Badge label="Ouvrir le litige" tone="danger" icon="chatbubbles-outline" /> : null}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  thumb: { width: 60, height: 60, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
});
