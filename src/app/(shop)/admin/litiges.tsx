import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Badge, ChipRow, EmptyState, ErrorState, Screen, ScreenHeader, Skeleton, Txt } from '@/components/ui';
import { fetchAdminDisputes, mediaUrl, type AdminDispute } from '@/lib/api';
import { formatGnf, formatRelative } from '@/lib/format';
import { colors, radius } from '@/theme';

type Filter = 'todo' | 'resolved' | 'all';

const STATUS: Record<AdminDispute['status'], { label: string; tone: 'warning' | 'primary' | 'success' | 'neutral' }> = {
  open: { label: 'Ouvert', tone: 'warning' },
  under_review: { label: 'En examen', tone: 'primary' },
  resolved: { label: 'Résolu', tone: 'success' },
  closed: { label: 'Clos', tone: 'neutral' },
};

const OUTCOME: Record<NonNullable<AdminDispute['outcome']>, string> = {
  refund_buyer: 'Acheteur remboursé',
  release_seller: 'Vendeur payé',
  partial_refund: 'Montant partagé',
};

export default function AdminDisputes() {
  const [filter, setFilter] = useState<Filter>('todo');
  const list = useQuery({ queryKey: ['admin', 'disputes'], queryFn: fetchAdminDisputes, refetchInterval: 15_000 });
  const all = list.data ?? [];
  const todo = all.filter((d) => d.status === 'open' || d.status === 'under_review');
  const rows = filter === 'todo' ? todo : filter === 'resolved' ? all.filter((d) => d.status === 'resolved' || d.status === 'closed') : all;

  return (
    <Screen refreshing={list.isRefetching} onRefresh={() => list.refetch()}>
      <ScreenHeader title="Litiges" subtitle={`${todo.length} à traiter`} />
      <ChipRow
        options={[
          { value: 'todo', label: `À traiter (${todo.length})` },
          { value: 'resolved', label: 'Résolus' },
          { value: 'all', label: 'Tous' },
        ]}
        value={filter}
        onChange={setFilter}
      />
      <View style={{ height: 12 }} />
      {list.isLoading ? (
        <View style={{ gap: 10 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={92} radius={radius.lg} />
          ))}
        </View>
      ) : list.isError ? (
        <ErrorState error={list.error} onRetry={() => list.refetch()} />
      ) : !rows.length ? (
        <EmptyState icon="shield-checkmark-outline" title="Aucun litige" message="Rien à traiter pour le moment." />
      ) : (
        <View style={{ gap: 10 }}>
          {rows.map((row) => {
            const status = STATUS[row.status] ?? STATUS.open;
            const thumb = mediaUrl(row.productImage);
            const last = row.messages?.[row.messages.length - 1]?.createdAt ?? row.openedAt;
            return (
              <Pressable
                key={row.id}
                onPress={() => router.push(`/admin/litige/${row.id}` as Href)}
                style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}>
                {thumb ? <Image source={{ uri: thumb }} style={styles.thumb} contentFit="cover" /> : <View style={styles.thumb} />}
                <View style={{ flex: 1, gap: 3 }}>
                  <View style={styles.row}>
                    <Txt variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                      {row.productTitle}
                    </Txt>
                    <Badge label={status.label} tone={status.tone} />
                  </View>
                  <Txt variant="caption" numberOfLines={2}>
                    {row.reason}
                  </Txt>
                  <Txt variant="small" numberOfLines={1}>
                    {row.buyerName} › {row.sellerName} · {formatGnf(row.amount)}
                  </Txt>
                  <View style={styles.row}>
                    <Txt variant="small" color={colors.textSubtle} style={{ flex: 1 }}>
                      {row.outcome ? OUTCOME[row.outcome] : `${row.messages?.length ?? 0} message(s)`} · {formatRelative(last)}
                    </Txt>
                    <Ionicons name="chatbubbles-outline" size={16} color={colors.primary} />
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
  thumb: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
