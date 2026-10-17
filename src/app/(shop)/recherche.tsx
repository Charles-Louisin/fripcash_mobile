import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, SectionList, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SearchBar } from '@/components/catalog/app-header';
import { FilterButton } from '@/components/catalog/catalog-filters';
import { ListingCard } from '@/components/catalog/listing-card';
import { emptySearchFilters, SearchFilterSheet, searchFilterCount, type SearchFilterState } from '@/components/catalog/search-filters';
import { ShopCard, type ShopCardVariant } from '@/components/catalog/shop-card';
import { ChipRow, EmptyState, ScreenHeader, Segmented, Txt } from '@/components/ui';
import { useCategories, useListings, useShops } from '@/hooks/queries';
import type { Category, PublicShop, ShopKindFilter } from '@/lib/api';
import { colors, fonts } from '@/theme';

const SHOP_SECTIONS: { id: ShopKindFilter; title: string }[] = [
  { id: 'particulier', title: 'Particuliers' },
  { id: 'standard', title: 'Boutiques' },
  { id: 'proximite', title: 'Commerces locaux' },
  { id: 'enseigne', title: 'Enseignes' },
];

const DEST_CHIPS = [
  { value: '', label: 'Tous' },
  { value: 'SECONDE_MAIN', label: 'Seconde main' },
  { value: 'ARTICLES_NEUFS', label: 'Neuf' },
  { value: 'QUARTIER_BOUTIQUES', label: 'Boutiques' },
  { value: 'ENSEIGNES', label: 'Enseignes' },
];

function shopVariant(shop: PublicShop): ShopCardVariant {
  if (shop.shopKind === 'enseigne') return 'enseigne';
  if (shop.shopKind === 'proximite') return 'quartier';
  if (shop.sellerKind === 'particulier' || !shop.shopKind) return 'dressing';
  return 'neuf';
}

function expandCategoryIds(ids: string[], categories: Category[]) {
  if (!ids.length) return undefined;
  const extra = categories.filter((c) => c.parentId && ids.includes(c.parentId)).map((c) => c.id);
  return [...new Set([...ids, ...extra])].join(',');
}

export default function RechercheScreen() {
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ q?: string; categoryId?: string; destination?: string; promo?: string; tab?: string }>();
  const [q, setQ] = useState(params.q ?? '');
  const [tab, setTab] = useState<'articles' | 'boutiques'>(params.tab === 'boutiques' ? 'boutiques' : 'articles');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilterState>(() => ({
    ...emptySearchFilters,
    promo: params.promo === '1',
    destinations: params.destination ? [params.destination] : [],
    categoryIds: params.categoryId ? params.categoryId.split(',').filter(Boolean) : [],
  }));

  const categories = useCategories();
  const allCategories = categories.data ?? [];
  const roots = allCategories.filter((c) => !c.parentId && c.isActive !== false);

  const createdWithinDays =
    filters.datePreset && filters.datePreset !== 'custom' ? Number(filters.datePreset) || undefined : undefined;
  const dateFrom = filters.datePreset === 'custom' ? filters.dateFrom || undefined : undefined;
  const dateTo = filters.datePreset === 'custom' ? filters.dateTo || undefined : undefined;
  const query = q.trim() || undefined;

  const listings = useListings({
    q: query,
    destination: filters.destinations.length ? filters.destinations.join(',') : undefined,
    categoryId: expandCategoryIds(filters.categoryIds, allCategories),
    shopKind: filters.sellerTypes.length ? filters.sellerTypes.join(',') : undefined,
    minListingRating: filters.minListingRating || undefined,
    minSellerRating: filters.minSellerRating || undefined,
    createdWithinDays,
    dateFrom,
    dateTo,
  });

  const shopParams = {
    q: query,
    minRating: filters.minSellerRating || undefined,
    createdWithinDays,
    dateFrom,
    dateTo,
    limit: 80 as const,
  };
  const particulier = useShops({ ...shopParams, shopKind: 'particulier' }, tab === 'boutiques');
  const standard = useShops({ ...shopParams, shopKind: 'standard' }, tab === 'boutiques');
  const proximite = useShops({ ...shopParams, shopKind: 'proximite' }, tab === 'boutiques');
  const enseigne = useShops({ ...shopParams, shopKind: 'enseigne' }, tab === 'boutiques');
  const shopQueries = { particulier, standard, proximite, enseigne };

  const articles = useMemo(() => {
    const rows = listings.data ?? [];
    if (!filters.promo) return rows;
    return rows.filter((item) => item.discountEnabled && item.compareAtPriceGnf != null && item.compareAtPriceGnf > item.priceGnf);
  }, [filters.promo, listings.data]);

  const sections = useMemo(() => {
    const shopsByKind: Record<ShopKindFilter, PublicShop[]> = {
      particulier: particulier.data ?? [],
      standard: standard.data ?? [],
      proximite: proximite.data ?? [],
      enseigne: enseigne.data ?? [],
    };
    const visible = filters.sellerTypes.length
      ? SHOP_SECTIONS.filter((section) => filters.sellerTypes.includes(section.id))
      : SHOP_SECTIONS;
    return visible.map((section) => {
      const data = shopsByKind[section.id];
      return { ...section, data, empty: data.length === 0 };
    });
  }, [filters.sellerTypes, particulier.data, standard.data, proximite.data, enseigne.data]);

  const count = searchFilterCount(filters, tab);
  const cardW = (width - 42) / 2;
  const chipValue = filters.destinations.length === 1 ? filters.destinations[0] : filters.destinations.length ? '__multi__' : '';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScreenHeader title="Recherche" />
      <View style={styles.tools}>
        <SearchBar
          value={q}
          onChangeText={setQ}
          autoFocus
          placeholder="Article, catégorie, boutique, enseigne…"
        />
        <View style={styles.tabs}>
          <View style={{ flex: 1 }}>
            <Segmented
              value={tab}
              onChange={setTab}
              options={[
                { value: 'articles', label: 'Articles' },
                { value: 'boutiques', label: 'Boutiques' },
              ]}
            />
          </View>
          <FilterButton label={count ? `Filtres (${count})` : 'Filtres'} active={count > 0} onPress={() => setFiltersOpen(true)} />
        </View>
        {query ? (
          <Txt variant="caption" color={colors.textMuted}>
            Résultats pour « {query} »
          </Txt>
        ) : null}
      </View>

      {tab === 'articles' ? (
        <ChipRow
          value={chipValue}
          onChange={(value) => setFilters((current) => ({ ...current, destinations: value ? [value] : [] }))}
          options={DEST_CHIPS}
        />
      ) : null}

      {tab === 'articles' ? (
        <FlatList
          key="articles"
          style={styles.list}
          data={articles}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.articleRow}
          contentContainerStyle={styles.articleList}
          refreshing={listings.isFetching}
          onRefresh={() => listings.refetch()}
          ListEmptyComponent={
            listings.isLoading ? null : (
              <EmptyState
                icon="search-outline"
                title="Aucun article"
                message="Aucun article ne correspond à cette recherche."
              />
            )
          }
          renderItem={({ item }) => <ListingCard listing={item} width={cardW} />}
        />
      ) : (
        <SectionList
          key="boutiques"
          style={styles.list}
          sections={sections.map((section) => ({
            title: section.title,
            count: section.data.length,
            empty: section.empty,
            data: section.empty ? [{ id: `empty-${section.id}` } as PublicShop] : section.data,
          }))}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.shopList}
          refreshing={SHOP_SECTIONS.some((section) => shopQueries[section.id].isFetching)}
          onRefresh={() => SHOP_SECTIONS.forEach((section) => shopQueries[section.id].refetch())}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHead}>
              <Txt style={styles.sectionTitle}>{section.title}</Txt>
              <Txt variant="caption" color={colors.textMuted}>
                ({section.count})
              </Txt>
            </View>
          )}
          renderItem={({ item, section }) => {
            if (section.empty) {
              return (
                <Txt variant="caption" color={colors.textMuted} style={styles.emptyLine}>
                  Aucune boutique dans cette catégorie.
                </Txt>
              );
            }
            const variant = shopVariant(item);
            return (
              <View style={styles.shopItem}>
                <ShopCard shop={item} width={variant === 'enseigne' ? undefined : width - 32} variant={variant} />
              </View>
            );
          }}
        />
      )}

      <SearchFilterSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        value={filters}
        onChange={setFilters}
        tab={tab}
        categories={roots.map((cat) => ({ id: cat.id, label: cat.nameFr || cat.nameEn || cat.slug }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  tools: { paddingHorizontal: 16, gap: 10, paddingBottom: 8 },
  tabs: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  list: { flex: 1 },
  articleRow: { gap: 10, paddingHorizontal: 16 },
  articleList: { gap: 10, paddingTop: 8, paddingBottom: 32 },
  shopList: { paddingTop: 4, paddingBottom: 32, gap: 12 },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', gap: 6, paddingHorizontal: 16, marginTop: 8 },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.text },
  emptyLine: { paddingHorizontal: 16 },
  shopItem: { paddingHorizontal: 16 },
});
