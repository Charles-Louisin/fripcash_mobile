import { Image, type ImageSource } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Txt } from '@/components/ui';
import { listingImages, type Listing } from '@/lib/api';
import { discountPercent } from '@/lib/format';
import { colors, fonts, radius } from '@/theme';

export function isPromo(l: Listing) {
  return !!l.discountEnabled && !!l.compareAtPriceGnf && l.compareAtPriceGnf > l.priceGnf;
}

type Slide = { id: string; title: string; subtitle: string; badge: string; cta: string; image?: ImageSource; medallion?: string; onPress: () => void };

export function PromoCarousel({ listings }: { listings: Listing[]; loading?: boolean }) {
  const { width } = useWindowDimensions();
  const cardWidth = width - 32;
  const [index, setIndex] = useState(0);
  const ref = useRef<FlatList<Slide>>(null);
  const slides: Slide[] = listings.slice(0, 4).map((listing) => {
    const image = listingImages(listing)[0];
    const pct = discountPercent(listing.priceGnf, listing.compareAtPriceGnf);
    return {
      id: listing.id,
      title: listing.title,
      subtitle: listing.sellerProfile?.shopName || 'Offre du moment',
      badge: pct > 0 ? `-${pct}%` : 'PROMO',
      cta: 'Voir le produit',
      image: image ? { uri: image } : undefined,
      medallion: pct > 0 ? `-${pct}%` : undefined,
      onPress: () => router.push({ pathname: '/article/[id]', params: { id: listing.id } }),
    };
  });

  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    if (slides.length < 2) return;
    let frame = 0;
    const step = cardWidth + 12;
    const t = setInterval(() => {
      const from = indexRef.current * step;
      const next = (indexRef.current + 1) % slides.length;
      const to = next * step;
      const start = Date.now();
      const duration = 1100;
      const tick = () => {
        const p = Math.min(1, (Date.now() - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        ref.current?.scrollToOffset({ offset: from + (to - from) * eased, animated: false });
        if (p < 1) frame = requestAnimationFrame(tick);
      };
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(tick);
      setIndex(next);
    }, 8000);
    return () => {
      clearInterval(t);
      cancelAnimationFrame(frame);
    };
  }, [slides.length, cardWidth]);

  if (!slides.length) return null;

  return (
    <View>
      <FlatList
        ref={ref}
        data={slides}
        horizontal
        keyExtractor={(l) => l.id}
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + 12}
        decelerationRate="normal"
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / (cardWidth + 12)))}
        renderItem={({ item }) => (
          <Pressable onPress={item.onPress} style={[styles.card, { width: cardWidth }]}>
            {item.image ? <Image source={item.image} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="right" /> : null}
            <LinearGradient
              colors={['rgba(255,250,246,0.97)', 'rgba(255,250,246,0.82)', 'rgba(255,250,246,0.08)']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 0.78, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.copy}>
              <View style={styles.badge}>
                <Txt style={styles.badgeText}>{item.badge}</Txt>
              </View>
              <Txt style={styles.title}>{item.title}</Txt>
              <Txt style={styles.sub}>
                {item.subtitle}
              </Txt>
              <View style={styles.cta}>
                <Txt style={styles.ctaText}>{item.cta}  ›</Txt>
              </View>
            </View>
            {item.medallion ? (
              <View style={styles.medal}>
                <Txt style={styles.medalText}>{item.medallion}</Txt>
              </View>
            ) : null}
          </Pressable>
        )}
      />
      <View style={styles.dots}>
        {slides.map((l, i) => (
          <View key={l.id} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 156,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F3E2D4',
  },
  copy: { flex: 1, paddingHorizontal: 16, paddingVertical: 14, maxWidth: '68%', justifyContent: 'space-between' },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryDark,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { color: colors.white, fontFamily: fonts.bold, fontSize: 9, letterSpacing: 0.4 },
  title: { fontFamily: fonts.displayBold, fontSize: 20, lineHeight: 24, color: colors.text },
  sub: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: colors.textMuted },
  cta: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  ctaText: { color: colors.white, fontFamily: fonts.bold, fontSize: 12 },
  medal: {
    position: 'absolute',
    right: 14,
    top: 16,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  medalText: { color: colors.white, fontFamily: fonts.bold, fontSize: 11, lineHeight: 13, textAlign: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E7D3C8' },
  dotActive: { width: 16, backgroundColor: colors.primary },
});
