import { Image } from 'expo-image';
import { useCallback, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, useWindowDimensions, View, type ViewToken } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Logo, Txt } from '@/components/ui';
import { useSession } from '@/stores/session';
import { colors, fonts, radius } from '@/theme';

const SLIDES = [
  {
    key: 'placard',
    image: require('@/assets/onboarding/onboarding-1.jpg'),
    title: 'Transforme ton placard en argent',
    text: 'Vends les vêtements que tu ne portes plus à des acheteurs partout en Guinée.',
  },
  {
    key: 'gratuit',
    image: require('@/assets/onboarding/onboarding-2.jpg'),
    title: "Vendre, c'est gratuit",
    text: 'Pas de frais de publication. Gagne plus sur chaque vente.',
  },
  {
    key: 'livraison',
    image: require('@/assets/onboarding/onboarding-3.jpg'),
    title: 'Livré chez toi',
    text: 'Les livreurs FripCash apportent tes trouvailles partout en Guinée — rapide et fiable.',
  },
  {
    key: 'bienvenue',
    image: require('@/assets/onboarding/onboarding-4.jpg'),
    title: 'Bienvenue sur FripCash',
    text: 'Achète, vends et découvre mode, maison et plus au même endroit.',
  },
];

export default function OnboardingScreen() {
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const completeOnboarding = useSession((s) => s.completeOnboarding);
  const last = index === SLIDES.length - 1;
  const imageSize = Math.min(width * 0.72, height * 0.34);

  const onViewable = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index != null) setIndex(viewableItems[0].index);
  }, []);

  const next = () => {
    if (last) {
      void completeOnboarding();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.top}>
        <Logo size={22} />
        {!last ? (
          <Pressable onPress={() => void completeOnboarding()} style={styles.skip} accessibilityRole="button">
            <Txt variant="label" color={colors.textMuted}>
              Passer
            </Txt>
          </Pressable>
        ) : (
          <View style={{ width: 72 }} />
        )}
      </View>

      <FlatList
        ref={listRef}
        style={styles.list}
        data={SLIDES}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(s) => s.key}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 60 }}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Image source={item.image} style={{ width: imageSize, height: imageSize }} contentFit="contain" />
            <View style={styles.texts}>
              <Txt style={styles.title} align="center">
                {item.title}
              </Txt>
              <Txt variant="body" color={colors.textMuted} align="center" style={{ fontSize: 15, lineHeight: 22 }}>
                {item.text}
              </Txt>
            </View>
          </View>
        )}
      />

      <View style={styles.bottom}>
        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <View key={s.key} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <Button title={last ? 'Commencer' : 'Continuer'} onPress={next} size="lg" full />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 52,
    zIndex: 2,
  },
  skip: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
  },
  list: { flex: 1 },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  texts: { gap: 10, marginTop: 8, paddingHorizontal: 8 },
  title: { fontFamily: fonts.displayBold, fontSize: 26, lineHeight: 33, color: colors.text },
  bottom: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 18,
    backgroundColor: colors.background,
    zIndex: 3,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { width: 24, backgroundColor: colors.primary },
});
