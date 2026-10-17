import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ShopCard, type ShopCardVariant } from '@/components/catalog/shop-card';
import { EmptyState, ErrorState, SectionHeader, Skeleton } from '@/components/ui';
import type { PublicShop } from '@/lib/api';
import type { Universe } from '@/lib/domain';
import { radius } from '@/theme';

const GAP = 10;

export const UNIVERSE_VARIANT: Record<Universe['destination'], ShopCardVariant> = {
  SECONDE_MAIN: 'dressing',
  ARTICLES_NEUFS: 'neuf',
  QUARTIER_BOUTIQUES: 'quartier',
  ENSEIGNES: 'enseigne',
};

export function variantForShop(shop: PublicShop): ShopCardVariant {
  if (shop.sellerKind === 'particulier' || !shop.shopKind) return 'dressing';
  if (shop.shopKind === 'proximite') return 'quartier';
  if (shop.shopKind === 'enseigne') return 'enseigne';
  return 'neuf';
}

export function cardWidthFor(variant: ShopCardVariant, screenWidth: number) {
  if (variant === 'dressing') return 156;
  if (variant === 'quartier') return 172;
  return screenWidth - 32;
}

/** Rangée horizontale de boutiques, au design de leur univers ; les grandes cartes s’arrêtent une par une. */
export function ShopSlider({
  universe,
  shops,
  loading,
  error,
  onRetry,
  screenWidth,
}: {
  universe: Universe;
  shops: PublicShop[];
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  screenWidth: number;
}) {
  const variant = UNIVERSE_VARIANT[universe.destination];
  const cardW = cardWidthFor(variant, screenWidth);
  const paged = variant === 'neuf' || variant === 'enseigne';

  return (
    <View style={{ marginBottom: 22 }}>
      <View style={{ paddingHorizontal: 16 }}>
        <SectionHeader
          title={universe.title}
          onAction={() => router.push({ pathname: '/univers/[destination]', params: { destination: universe.slug } })}
        />
      </View>
      {loading ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {[0, 1].map((i) => (
            <Skeleton key={i} width={cardW} height={paged ? 200 : 180} radius={radius.lg} />
          ))}
        </ScrollView>
      ) : error && !shops.length ? (
        <ErrorState error={error} onRetry={onRetry} />
      ) : !shops.length ? (
        <EmptyState icon="storefront-outline" title={`Aucune boutique dans ${universe.title.toLowerCase()}.`} />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={paged ? cardW + GAP : undefined}
          snapToAlignment="start"
          contentContainerStyle={styles.row}>
          {shops.map((shop) => (
            <ShopCard key={shop.id} shop={shop} variant={variant} width={cardW} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: GAP, paddingHorizontal: 16, paddingVertical: 4 },
});
