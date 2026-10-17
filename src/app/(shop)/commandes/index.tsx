import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, ChipRow, EmptyState, ScreenHeader, Segmented, Txt } from '@/components/ui';
import { useAuth, usePurchases, useSales } from '@/hooks/queries';
import { useAccountType } from '@/hooks/use-account-type';
import { ORDER_STATUS_LABELS, orderStatusTone } from '@/lib/domain';
import type { OrderStatus } from '@/lib/api';
import { formatGnf, formatRelative, shortOrderId } from '@/lib/format';
import { colors, radius } from '@/theme';

const TABS = ['toutes', 'achats', 'ventes'] as const;
type Tab = (typeof TABS)[number];

export default function CommandesScreen() {
  const { isConsumer } = useAuth();
  const { type } = useAccountType();
  const params = useLocalSearchParams<{ tab?: string; status?: string }>();
  const initialTab = TABS.includes(params.tab as Tab) ? (params.tab as Tab) : type.isSeller ? 'ventes' : 'achats';
  const [tab, setTab] = useState<Tab>(initialTab);
  const [status, setStatus] = useState<'' | OrderStatus>(
    params.status && params.status in ORDER_STATUS_LABELS ? (params.status as OrderStatus) : '',
  );
  const purchases = usePurchases();
  const sales = useSales(type.isSeller);
  const list = tab === 'achats' ? purchases : sales;
  const rows = useMemo(() => {
    const source =
      tab === 'toutes'
        ? [...(purchases.data ?? []), ...(sales.data ?? [])].filter(
            (order, index, all) => all.findIndex((item) => item.id === order.id) === index,
          )
        : (list.data ?? []);
    return status ? source.filter((order) => order.status === status) : source;
  }, [list.data, purchases.data, sales.data, status, tab]);
  const statusOptions = useMemo(
    () => [
      { value: '' as const, label: 'Tous' },
      ...(Object.entries(ORDER_STATUS_LABELS) as [OrderStatus, string][]).map(([value, label]) => ({ value, label })),
    ],
    [],
  );

  if (!isConsumer) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <ScreenHeader title="Commandes" />
        <EmptyState
          icon="lock-closed-outline"
          title="Connecte-toi"
          actionLabel="Se connecter"
          onAction={() => router.push('/connexion')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScreenHeader title="Commandes" />
      {type.isSeller ? (
        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: 'toutes', label: 'Toutes' },
              { value: 'achats', label: 'Achats' },
              { value: 'ventes', label: 'Ventes' },
            ]}
          />
        </View>
      ) : null}
      <ChipRow value={status} onChange={setStatus} options={statusOptions} />
      <FlatList
        data={rows}
        keyExtractor={(o) => o.id}
        refreshing={list.isFetching}
        onRefresh={() => list.refetch()}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 32, flexGrow: 1 }}
        ListEmptyComponent={<EmptyState icon="receipt-outline" title="Aucune commande" />}
        renderItem={({ item }) => {
          const first = item.items[0];
          return (
            <Pressable
              onPress={() => router.push({ pathname: '/commandes/[id]', params: { id: item.id } })}
              style={({ pressed }) => [styles.card, { opacity: pressed ? 0.85 : 1 }]}>
              {first?.imageUrl ? (
                <Image source={{ uri: first.imageUrl }} style={styles.thumb} contentFit="cover" />
              ) : (
                <View style={styles.thumb} />
              )}
              <View style={{ flex: 1, gap: 3 }}>
                <View style={styles.row}>
                  <Txt variant="label">{shortOrderId(item.id)}</Txt>
                  <Badge label={ORDER_STATUS_LABELS[item.status]} tone={orderStatusTone(item.status)} />
                </View>
                <Txt variant="bodyStrong" numberOfLines={1}>
                  {first?.title || 'Commande'}
                </Txt>
                <Txt variant="caption">
                  {formatGnf(item.amountGnf)} · {formatRelative(item.createdAt)}
                </Txt>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  thumb: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
