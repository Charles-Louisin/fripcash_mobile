import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader, SearchBar } from '@/components/catalog/app-header';
import { ListingCard } from '@/components/catalog/listing-card';
import { isPromo, PromoCarousel } from '@/components/catalog/promo-carousel';
import { ShopCard } from '@/components/catalog/shop-card';
import { cardWidthFor, variantForShop } from '@/components/catalog/shop-slider';
import { EmptyState, ErrorState, LazyMount, SectionHeader, Skeleton, Txt } from '@/components/ui';
import { useListings, useShops } from '@/hooks/queries';
import { usePullRefresh } from '@/hooks/use-pull-refresh';
import { UNIVERSES } from '@/lib/domain';
import { formatNumber } from '@/lib/format';
import { UNIVERSE_COVERS } from '@/lib/showcase';
import { colors, fonts, shadow } from '@/theme';

const NEWS_CARD_WIDTH = 142;
const NEWS_GAP = 10;

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const pull = usePullRefresh();
  const listings = useListings({ limit: 40 });
  const shops = useShops({ limit: 12 });
  const particuliers = useShops({ shopKind: 'particulier', limit: 80 });
  const standards = useShops({ shopKind: 'standard', limit: 80 });
  const proximite = useShops({ shopKind: 'proximite', limit: 80 });
  const enseignes = useShops({ shopKind: 'enseigne', limit: 80 });
  const universeCount = (destination: string) => {
    const query =
      destination === 'SECONDE_MAIN'
        ? particuliers
        : destination === 'ARTICLES_NEUFS'
          ? standards
          : destination === 'QUARTIER_BOUTIQUES'
            ? proximite
            : enseignes;
    const n = query.data?.length ?? 0;
    if (query.isLoading && query.data == null) return '…';
    return `${formatNumber(n)} boutique${n > 1 ? 's' : ''}`;
  };
  const all = listings.data ?? [];
  const promos = all.filter(isPromo).slice(0, 4);
  const news = [...all]
    .sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime())
    .slice(0, 10);
  const featured = (shops.data ?? []).slice(0, 12);
  const newsCards = news;
  const shopCards = featured;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <AppHeader />
      <LazyMount kind="home">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={pull.refreshing} onRefresh={pull.onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
          }>
          <View style={{ paddingHorizontal: 16, marginTop: 4, marginBottom: 12 }}>
            <SearchBar onPress={() => router.push('/recherche')} placeholder="Rechercher un article ou une boutique ..." />
          </View>

          <PromoCarousel listings={promos} loading={listings.isLoading} />

          <View style={styles.section}>
            <SectionHeader title="Choisis ton univers" onAction={() => router.push('/explorer')} />
            <View style={{ gap: 8 }}>
              {[UNIVERSES.slice(0, 2), UNIVERSES.slice(2)].map((row) => (
                <View key={row[0].destination} style={styles.uniRow}>
                  {row.map((u) => (
                    <Pressable
                      key={u.destination}
                      onPress={() => router.push({ pathname: '/univers/[destination]', params: { destination: u.slug } })}
                      style={({ pressed }) => [styles.uni, { opacity: pressed ? 0.92 : 1 }]}>
                      <Image source={UNIVERSE_COVERS[u.destination]} style={StyleSheet.absoluteFill} contentFit="cover" />
                      <LinearGradient
                        colors={['rgba(36,20,18,0.62)', 'rgba(36,20,18,0.08)']}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={StyleSheet.absoluteFill}
                      />
                      <View style={styles.uniArrow}>
                        <Ionicons name="chevron-forward" size={16} color={colors.text} />
                      </View>
                      <View style={{ gap: 1, paddingRight: 28 }}>
                        <Txt style={styles.uniTitle} numberOfLines={1}>
                          {u.title}
                        </Txt>
                        <Txt style={styles.uniSub} numberOfLines={1}>
                          {u.subtitle}
                        </Txt>
                        <View style={styles.uniBadge}>
                          <Txt style={styles.uniBadgeText}>{universeCount(u.destination)}</Txt>
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader title="Nouveautés" onAction={() => router.push('/recherche')} />
            {listings.isLoading ? (
              <View style={[styles.row, styles.slider, styles.sliderBleed, { overflow: 'hidden' }]}>
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} height={210} radius={14} style={{ width: NEWS_CARD_WIDTH }} />
                ))}
              </View>
            ) : listings.isError && !news.length ? (
              <ErrorState error={listings.error} onRetry={() => listings.refetch()} />
            ) : newsCards.length === 0 ? (
              <EmptyState icon="shirt-outline" title="Aucune nouveauté" message="Les articles publiés apparaîtront ici." />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={NEWS_CARD_WIDTH + NEWS_GAP}
                snapToAlignment="start"
                style={styles.sliderBleed}
                contentContainerStyle={[styles.row, styles.slider]}>
                {newsCards.map((l) => (
                  <ListingCard key={l.id} listing={l} variant="home" width={NEWS_CARD_WIDTH} />
                ))}
              </ScrollView>
            )}
          </View>

          <View style={styles.section}>
            <SectionHeader title="Boutiques à découvrir" onAction={() => router.push('/explorer')} />
            {shops.isLoading ? (
              <View style={[styles.row, styles.slider, styles.sliderBleed, { overflow: 'hidden' }]}>
                {[0, 1].map((i) => (
                  <Skeleton key={i} height={200} radius={16} style={{ width: width - 64 }} />
                ))}
              </View>
            ) : shops.isError && !shopCards.length ? (
              <ErrorState error={shops.error} onRetry={() => shops.refetch()} />
            ) : shopCards.length === 0 ? (
              <EmptyState icon="storefront-outline" title="Aucune boutique" message="Les boutiques publiées apparaîtront ici." />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                style={styles.sliderBleed}
                contentContainerStyle={[styles.row, styles.slider, { paddingVertical: 4, alignItems: 'flex-start' }]}>
                {shopCards.map((s) => {
                  const variant = variantForShop(s);
                  return <ShopCard key={s.id} shop={s} variant={variant} width={cardWidthFor(variant, width)} />;
                })}
              </ScrollView>
            )}
          </View>
        </ScrollView>
      </LazyMount>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  section: { paddingHorizontal: 16, marginTop: 18 },
  uniRow: { flexDirection: 'row', gap: 8 },
  uni: {
    flex: 1,
    height: 96,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 10,
    ...shadow,
  },
  uniArrow: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uniTitle: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 18, color: colors.white },
  uniSub: { fontFamily: fonts.medium, fontSize: 10.5, lineHeight: 13, color: 'rgba(255,255,255,0.88)' },
  uniBadge: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: 'rgba(36,20,18,0.45)',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  uniBadgeText: { color: colors.white, fontFamily: fonts.semibold, fontSize: 9 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
  sliderBleed: { marginHorizontal: -16 },
  slider: { gap: NEWS_GAP, paddingHorizontal: 16 },
});
