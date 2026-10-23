import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader, SearchBar } from '@/components/catalog/app-header';
import { FilterSheet, SHOP_SORTS, sortShops, type CatalogFilterState } from '@/components/catalog/catalog-filters';
import { ShopBottomNav } from '@/components/catalog/shop-nav';
import { ShopCard, type ShopCardVariant } from '@/components/catalog/shop-card';
import { Chip, EmptyState, ErrorState, IconButton, Txt } from '@/components/ui';
import { useCart } from '@/hooks/use-cart';
import { useShops, useZones } from '@/hooks/queries';
import { usePullRefresh } from '@/hooks/use-pull-refresh';
import type { PublicShop } from '@/lib/api';
import { universeBySlug } from '@/lib/domain';
import { goHome } from '@/lib/nav';
import { colors, fonts } from '@/theme';

const ALL = 'tous';

function norm(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function shopCategories(shop: PublicShop) {
  return [...(shop.soldCategories ?? []), ...(shop.listingCategories ?? [])];
}

function cardVariant(destination: string): ShopCardVariant {
  if (destination === 'SECONDE_MAIN') return 'dressing';
  if (destination === 'ARTICLES_NEUFS') return 'neuf';
  if (destination === 'QUARTIER_BOUTIQUES') return 'quartier';
  return 'enseigne';
}

export default function UniversScreen() {
  const { destination } = useLocalSearchParams<{ destination: string }>();
  const universe = universeBySlug(destination);
  const pull = usePullRefresh();
  const { width } = useWindowDimensions();
  const cardW = (width - 32 - 10) / 2;
  const { count } = useCart();
  const [q, setQ] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<CatalogFilterState>({ sort: 'recent' });
  const variant = cardVariant(universe.destination);
  const isGrid = variant === 'dressing' || variant === 'quartier';
  const isNeuf = universe.destination === 'ARTICLES_NEUFS';
  const isQuartier = universe.destination === 'QUARTIER_BOUTIQUES';
  const isEnseigne = universe.destination === 'ENSEIGNES';
  const [chip, setChip] = useState(ALL);

  const shops = useShops({
    shopKind: universe.shopKind === 'particulier' ? 'particulier' : (universe.shopKind as 'standard' | 'proximite' | 'enseigne'),
    q: q || undefined,
    limit: 60,
  });
  const zones = useZones();

  const chips = useMemo(() => {
    if (isQuartier) {
      const names = (zones.data ?? []).map((z) => z.nameFr).filter(Boolean);
      return [{ id: ALL, label: 'Tous' }, ...names.map((name) => ({ id: name, label: name }))];
    }
    const counts = new Map<string, { label: string; n: number }>();
    for (const shop of shops.data ?? []) {
      for (const label of new Set(shopCategories(shop).map((c) => c.trim()).filter(Boolean))) {
        const key = norm(label);
        const row = counts.get(key);
        counts.set(key, { label: row?.label ?? label, n: (row?.n ?? 0) + 1 });
      }
    }
    const top = [...counts.values()].sort((a, b) => b.n - a.n).slice(0, 12);
    return top.length ? [{ id: ALL, label: 'Tous' }, ...top.map((c) => ({ id: c.label, label: c.label }))] : [];
  }, [isQuartier, zones.data, shops.data]);

  const shown = useMemo(() => {
    const query = norm(q);
    const key = norm(chip);
    const rows = (shops.data ?? []).filter((shop) => {
      if (query) {
        const blob = norm(`${shop.shopName} ${shop.bio ?? ''} ${shop.city ?? ''} ${shop.neighborhood ?? ''} ${shopCategories(shop).join(' ')}`);
        if (!blob.includes(query)) return false;
      }
      if (chip === ALL) return true;
      if (isQuartier) {
        const place = norm(
          `${shop.city ?? ''} ${shop.neighborhood ?? ''} ${shop.storeAddress ?? ''} ${(shop.deliveredCommunes ?? []).join(' ')}`,
        );
        return place.includes(key);
      }
      return shopCategories(shop).some((c) => norm(c) === key);
    });
    return sortShops(rows, filters.sort ?? 'recent');
  }, [shops.data, q, chip, isQuartier, filters.sort]);

  const placeholder = isNeuf
    ? 'Rechercher une boutique ou un article...'
    : universe.destination === 'SECONDE_MAIN'
      ? 'Rechercher un dressing, un quartier ...'
      : isEnseigne
        ? 'Rechercher une enseigne ou un produit ...'
        : 'Rechercher une boutique, un produit...';

  const header = (
    <View style={styles.headerBlock}>
      {isNeuf ? (
        <View style={styles.subHead}>
          <IconButton icon="chevron-back" label="Retour" onPress={goHome} />
          <Txt variant="h1" style={{ flex: 1 }} numberOfLines={1}>
            Articles neufs
          </Txt>
          <IconButton icon="bag-outline" label="Panier" badge={count || undefined} onPress={() => router.push('/panier')} />
        </View>
      ) : (
        <>
          <AppHeader />
          <View style={styles.titleBlock}>
            {isEnseigne ? (
              <Pressable onPress={goHome} hitSlop={8} style={styles.backInline}>
                <Ionicons name="chevron-back" size={22} color={colors.text} />
              </Pressable>
            ) : null}
            <View style={{ flex: 1, gap: 4 }}>
              <Txt variant="display" style={{ fontSize: 30, lineHeight: 36 }}>
                {universe.title}
              </Txt>
              <Txt variant="body" color={colors.textMuted}>
                {universe.tagline}
              </Txt>
            </View>
          </View>
        </>
      )}

      <View style={{ paddingHorizontal: 16 }}>
        <SearchBar
          value={q}
          onChangeText={setQ}
          onFilter={() => setFiltersOpen(true)}
          placeholder={placeholder}
          tone={isEnseigne ? 'plain' : 'muted'}
        />
      </View>

      {chips.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {chips.map((item) => (
            <Chip key={item.id} label={item.label} active={chip === item.id} onPress={() => setChip(item.id)} />
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.sectionRow}>
        <Txt style={[styles.sectionTitle, isEnseigne && styles.sectionCount]}>
          {isQuartier
            ? `${shown.length} boutiques près de chez vous`
            : isEnseigne
              ? `${shown.length} enseignes trouvées`
              : universe.sellerNoun}
        </Txt>
        <Pressable onPress={() => setFiltersOpen(true)} hitSlop={8} style={styles.sort}>
          <Txt style={styles.sortText}>{isQuartier || isEnseigne ? 'Trier par' : 'Trier'}</Txt>
          <Ionicons name={isQuartier || isEnseigne ? 'chevron-down' : 'swap-vertical'} size={14} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {shops.isError && !(shops.data ?? []).length ? <ErrorState error={shops.error} onRetry={() => shops.refetch()} /> : null}
      <FlatList
        style={{ flex: 1 }}
        data={shown}
        key={isGrid ? 'grid' : 'list'}
        keyExtractor={(s) => s.id}
        refreshControl={<RefreshControl refreshing={pull.refreshing} onRefresh={pull.onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
        numColumns={isGrid ? 2 : 1}
        ListHeaderComponent={header}
        columnWrapperStyle={isGrid ? styles.gridRow : undefined}
        contentContainerStyle={[isGrid ? styles.contentGrid : styles.contentList, !shown.length && { flexGrow: 1 }]}
        ListEmptyComponent={
          shops.isLoading ? null : (
            <EmptyState
              icon={universe.icon}
              title={universe.destination === 'SECONDE_MAIN' ? 'Aucun dressing pour le moment' : 'Aucune boutique'}
            />
          )
        }
        renderItem={({ item }) => (
          <View style={isGrid ? undefined : styles.listItem}>
            <ShopCard shop={item} variant={variant} width={isGrid ? cardW : undefined} />
          </View>
        )}
      />
      <ShopBottomNav />
      <FilterSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Trier"
        sorts={SHOP_SORTS}
        value={filters}
        onApply={setFilters}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  headerBlock: { gap: 12, paddingBottom: 8 },
  subHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8 },
  titleBlock: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, gap: 4 },
  backInline: { marginTop: 6 },
  chips: { gap: 8, paddingHorizontal: 16 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16 },
  sectionTitle: { flex: 1, fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  sectionCount: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  sort: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sortText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.primary },
  gridRow: { gap: 10, paddingHorizontal: 16 },
  content: { paddingBottom: 28 },
  contentGrid: { gap: 12, paddingBottom: 28 },
  contentList: { gap: 18, paddingBottom: 28 },
  listItem: { marginHorizontal: 16 },
});
