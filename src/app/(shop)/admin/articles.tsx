import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Badge, Button, ChipRow, EmptyState, ErrorState, Screen, ScreenHeader, Skeleton, toast, Txt } from '@/components/ui';
import { errorMessage, fetchAdminListings, listingImages, updateAdminListing } from '@/lib/api';
import { formatGnf, formatRelative } from '@/lib/format';
import { colors, radius } from '@/theme';

type Filter = 'ALL' | 'PENDING' | 'ACTIVE' | 'DRAFT' | 'FLAGGED' | 'REJECTED' | 'ARCHIVED' | 'SOLD';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'ALL', label: 'Tous' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'ACTIVE', label: 'Publiés' },
  { value: 'FLAGGED', label: 'Signalés' },
  { value: 'DRAFT', label: 'Brouillons' },
  { value: 'REJECTED', label: 'Refusés' },
  { value: 'ARCHIVED', label: 'Retirés' },
  { value: 'SOLD', label: 'Vendus' },
];

const STATUS: Record<string, { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral' | 'primary' }> = {
  ACTIVE: { label: 'Publié', tone: 'success' },
  DRAFT: { label: 'Brouillon', tone: 'warning' },
  FLAGGED: { label: 'Signalé', tone: 'danger' },
  REJECTED: { label: 'Refusé', tone: 'danger' },
  ARCHIVED: { label: 'Retiré', tone: 'neutral' },
  SOLD: { label: 'Vendu', tone: 'primary' },
  SOLD_OUT: { label: 'Épuisé', tone: 'primary' },
};

export default function AdminArticles() {
  const client = useQueryClient();
  const [filter, setFilter] = useState<Filter>('PENDING');
  const apiStatus = filter === 'PENDING' ? 'ALL' : filter;
  const list = useQuery({ queryKey: ['admin', 'listings', apiStatus], queryFn: () => fetchAdminListings(apiStatus) });
  const rows = (list.data ?? []).filter((row) =>
    filter === 'PENDING' ? row.status === 'DRAFT' || row.status === 'FLAGGED' : true
  );
  const patch = useMutation({
    mutationFn: ({ id, next }: { id: string; next: string }) => updateAdminListing(id, { status: next }),
    onSuccess: () => {
      toast.success('Article mis à jour');
      client.invalidateQueries({ queryKey: ['admin', 'listings'] });
      client.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <Screen refreshing={list.isRefetching} onRefresh={() => list.refetch()}>
      <ScreenHeader title="Articles" subtitle="Modération du catalogue" />
      <ChipRow options={FILTERS} value={filter} onChange={setFilter} />
      <View style={{ height: 12 }} />
      {list.isLoading ? (
        <View style={{ gap: 10 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={110} radius={radius.lg} />
          ))}
        </View>
      ) : list.isError ? (
        <ErrorState error={list.error} onRetry={() => list.refetch()} />
      ) : !rows.length ? (
        <EmptyState icon="bag-handle-outline" title="Aucun article" />
      ) : (
        <View style={{ gap: 10 }}>
          {rows.map((row) => {
            const status = STATUS[row.status] ?? { label: row.status, tone: 'neutral' as const };
            const img = listingImages(row)[0];
            const busy = patch.isPending && patch.variables?.id === row.id;
            return (
              <View key={row.id} style={styles.card}>
                <Pressable onPress={() => router.push({ pathname: '/article/[id]', params: { id: row.id } })} style={styles.row}>
                  {img ? <Image source={img} style={styles.thumb} contentFit="cover" /> : <View style={styles.thumb} />}
                  <View style={{ flex: 1, gap: 3 }}>
                    <Txt variant="bodyStrong" numberOfLines={2}>
                      {row.title}
                    </Txt>
                    <Txt variant="caption" numberOfLines={1}>
                      {row.sellerProfile?.shopName || row.sellerProfile?.displayName || 'Vendeur'}
                      {row.priceGnf != null ? ` · ${formatGnf(row.priceGnf)}` : ''}
                    </Txt>
                    <View style={[styles.row, { gap: 6 }]}>
                      <Badge label={status.label} tone={status.tone} />
                      {row.createdAt ? <Txt variant="small">{formatRelative(row.createdAt)}</Txt> : null}
                    </View>
                  </View>
                </Pressable>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {row.status !== 'ACTIVE' ? (
                    <Button title="Publier" size="sm" variant="secondary" icon="checkmark" loading={busy} onPress={() => patch.mutate({ id: row.id, next: 'ACTIVE' })} style={{ flex: 1 }} />
                  ) : null}
                  {row.status === 'DRAFT' || row.status === 'FLAGGED' ? (
                    <Button title="Refuser" size="sm" variant="outline" disabled={busy} onPress={() => patch.mutate({ id: row.id, next: 'REJECTED' })} style={{ flex: 1 }} />
                  ) : null}
                  {row.status !== 'ARCHIVED' ? (
                    <Button title="Retirer" size="sm" variant="danger" disabled={busy} onPress={() => patch.mutate({ id: row.id, next: 'ARCHIVED' })} style={{ flex: 1 }} />
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
});
