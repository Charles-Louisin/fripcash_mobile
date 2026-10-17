import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, type ImageSource } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Badge, toast, Txt } from '@/components/ui';
import { useCart } from '@/hooks/use-cart';
import { errorMessage, listingImages, type Listing } from '@/lib/api';
import { discountPercent, formatGnf } from '@/lib/format';
import { colors, fonts, radius, shadow } from '@/theme';

import { FavoriteButton } from './favorite-button';

const WEEK = 7 * 24 * 60 * 60 * 1000;

export type ProductCardVariant = 'standard' | 'home' | 'secondHand' | 'newItem' | 'localStore' | 'brandStore';

export function listingBadge(listing: Listing): { label: string; tone: 'primary' | 'success' } | null {
  const pct = listing.discountEnabled ? discountPercent(listing.priceGnf, listing.compareAtPriceGnf) : 0;
  if (pct > 0) return { label: `-${pct}%`, tone: 'success' };
  if (Date.now() - new Date(listing.publishedAt || listing.createdAt).getTime() < WEEK) {
    return { label: 'Nouveau', tone: 'primary' };
  }
  if (listing.destination === 'SECONDE_MAIN') return { label: 'Seconde main', tone: 'primary' };
  return null;
}

export function listingCondition(listing: Listing) {
  if (listing.conditionNote) return listing.conditionNote;
  return listing.destination === 'SECONDE_MAIN' ? 'Seconde main' : 'Neuf';
}

export function ListingCard({
  listing,
  width,
  quickAdd = true,
  variant = 'standard',
  imageSource,
  badgeLabel,
}: {
  listing: Listing;
  width?: number;
  quickAdd?: boolean;
  variant?: ProductCardVariant;
  imageSource?: ImageSource | null;
  badgeLabel?: string;
}) {
  const cart = useCart();
  const remote = listingImages(listing)[0];
  const source = imageSource || (remote ? { uri: remote } : null);
  const badge = badgeLabel ? { label: badgeLabel, tone: 'primary' as const } : listingBadge(listing);
  const soldOut = listing.quantity <= 0 || listing.status === 'SOLD' || listing.status === 'SOLD_OUT';
  const inCart = cart.lines.some((l) => l.listingId === listing.id);
  const compact = variant !== 'standard';
  const brand = variant === 'brandStore';
  const brandMeta = brand ? listing.description || (listing.conditionNote && listing.conditionNote !== 'Neuf' ? listing.conditionNote : '') : '';
  const showHeart = variant !== 'localStore';
  const showPhotoCart = variant === 'localStore' || (variant === 'standard' && quickAdd);
  const showBodyCart = variant === 'newItem' || variant === 'brandStore';

  const add = async () => {
    if (inCart || soldOut) return;
    try {
      await cart.add({ listing, quantity: 1 });
      toast.success('Ajouté au panier');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const open = () => {
    router.push({ pathname: '/article/[id]', params: { id: listing.id } });
  };

  return (
    <Pressable
      onPress={open}
      style={({ pressed }) => [
        styles.card,
        width ? { width } : { flex: 1 },
        compact && styles.cardCompact,
        brand && styles.cardBrand,
        { opacity: pressed ? 0.94 : 1 },
      ]}>
      <View style={[styles.imageWrap, variant === 'home' && styles.imageHome, (variant === 'localStore' || brand) && styles.imageLocal, brand && styles.imageBrand]}>
        {source ? <Image source={source} style={StyleSheet.absoluteFill} contentFit="cover" transition={220} recyclingKey={listing.id} /> : null}
        {showPhotoCart && !soldOut ? (
          <Pressable
            onPress={add}
            disabled={inCart}
            hitSlop={6}
            style={[variant === 'localStore' ? styles.plusCorner : styles.plus, inCart && styles.cartDone]}
            accessibilityLabel={inCart ? 'Déjà dans le panier' : 'Ajouter au panier'}>
            <Ionicons
              name={inCart ? 'checkmark' : variant === 'localStore' ? 'add' : 'bag-add-outline'}
              size={variant === 'localStore' ? 16 : 15}
              color={inCart ? colors.success : colors.primary}
            />
          </Pressable>
        ) : null}
        {showHeart ? (
          <View style={styles.fav}>
            <FavoriteButton listingId={listing.id} size={brand ? 22 : compact ? 24 : 28} />
          </View>
        ) : null}
        {variant === 'secondHand' && badge ? (
          <View style={styles.softBadge}>
            <Txt style={styles.softBadgeText}>{badge.label}</Txt>
          </View>
        ) : null}
        {variant === 'standard' && badge ? (
          <Badge label={badge.label} tone={badge.tone} solid={badge.tone === 'success'} style={styles.badge} />
        ) : null}
        {soldOut ? (
          <View style={styles.soldOut}>
            <Txt variant="label" color={colors.white}>
              Épuisé
            </Txt>
          </View>
        ) : null}
      </View>
      <View style={[styles.body, compact && styles.bodyCompact, brand && styles.bodyBrand]}>
        <Txt style={[styles.title, compact && styles.titleCompact, brand && styles.titleBrand]} numberOfLines={2}>
          {listing.title}
        </Txt>
        {brand ? (
          brandMeta ? (
            <Txt style={styles.meta} numberOfLines={1}>
              {brandMeta}
            </Txt>
          ) : null
        ) : variant !== 'localStore' ? (
          <Txt style={styles.meta} numberOfLines={1}>
            {listingCondition(listing)}
          </Txt>
        ) : listing.description ? (
          <Txt style={styles.meta} numberOfLines={1}>
            {listing.description}
          </Txt>
        ) : null}
        <View style={styles.priceRow}>
          <Txt style={[styles.price, compact && styles.priceCompact, brand && styles.priceBrand]} numberOfLines={1}>
            {formatGnf(listing.priceGnf)}
          </Txt>
          {showBodyCart ? (
            <Pressable
              onPress={add}
              hitSlop={6}
              style={[styles.bag, brand && styles.bagSolid]}
              accessibilityLabel="Ajouter au panier">
              <Ionicons
                name={inCart ? 'checkmark' : brand ? 'cart-outline' : 'bag-handle-outline'}
                size={brand ? 14 : 13}
                color={brand ? colors.white : colors.primary}
              />
            </Pressable>
          ) : null}
        </View>
        {variant === 'standard' && listing.discountEnabled && listing.compareAtPriceGnf && listing.compareAtPriceGnf > listing.priceGnf ? (
          <Txt variant="small" style={{ textDecorationLine: 'line-through' }} numberOfLines={1}>
            {formatGnf(listing.compareAtPriceGnf)}
          </Txt>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow,
  },
  cardCompact: { borderRadius: 14 },
  cardBrand: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderRadius: 0,
    overflow: 'visible',
    elevation: 0,
    shadowOpacity: 0,
  },
  imageWrap: { aspectRatio: 1.05, backgroundColor: colors.surfaceMuted },
  imageHome: { aspectRatio: 0.92 },
  imageLocal: { aspectRatio: 1 },
  imageBrand: { borderRadius: 18, overflow: 'hidden' },
  plus: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusCorner: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartDone: { backgroundColor: colors.successSoft },
  fav: { position: 'absolute', top: 6, right: 6 },
  badge: { position: 'absolute', left: 8, bottom: 8 },
  softBadge: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    backgroundColor: 'rgba(255,248,244,0.92)',
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  softBadgeText: { fontFamily: fonts.semibold, fontSize: 9, color: colors.primaryDark },
  soldOut: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(36,20,18,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingHorizontal: 8, paddingTop: 7, paddingBottom: 8, gap: 2 },
  bodyCompact: { paddingHorizontal: 6, paddingTop: 6, paddingBottom: 7, minHeight: 62 },
  bodyBrand: { paddingHorizontal: 2, paddingTop: 8, paddingBottom: 0, minHeight: 0, gap: 1, backgroundColor: 'transparent' },
  title: { fontFamily: fonts.semibold, fontSize: 12.5, lineHeight: 16, color: colors.text },
  titleCompact: { fontSize: 11, lineHeight: 14 },
  titleBrand: { fontSize: 12.5, lineHeight: 16 },
  priceBrand: { fontSize: 12.5, lineHeight: 16 },
  meta: { fontFamily: fonts.medium, fontSize: 10.5, lineHeight: 14, color: colors.textMuted },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4, marginTop: 1 },
  price: { fontFamily: fonts.bold, fontSize: 13, lineHeight: 16, color: colors.primary, flex: 1 },
  priceCompact: { fontSize: 11.5, lineHeight: 15 },
  bag: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bagSolid: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primary },
});
