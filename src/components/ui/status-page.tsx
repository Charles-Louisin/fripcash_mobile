import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts } from '@/theme';

import { BlurText } from './blur-text';
import { Txt } from './text';

const ILLUSTRATION = require('../../../assets/images/not-found.svg');

type Action = { label: string; onPress: () => void; icon?: boolean };

/** Mise en page des pages 404 et erreur, reprise du site web (illustration + textes animés). */
export function StatusPage({
  label,
  texts,
  description,
  note,
  primary,
  secondary,
  details,
}: {
  label: string;
  texts: string[];
  description: string;
  note: string;
  primary: Action;
  secondary: Action;
  details?: string;
}) {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % texts.length), 4000);
    return () => clearInterval(t);
  }, [texts.length]);

  const align = wide ? 'left' : 'center';

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.grid, wide && styles.gridWide]}>
          <View style={[styles.art, wide && { flex: 1 }]}>
            <Image source={ILLUSTRATION} style={styles.image} contentFit="contain" accessibilityLabel={label} />
          </View>

          <View style={[styles.content, wide && { flex: 1 }]}>
            <BlurText
              text={label}
              delay={80}
              animateBy="letters"
              direction="top"
              stepDuration={0.25}
              animationKey={`label-${index}`}
              align={align}
              textStyle={styles.label}
              style={{ marginBottom: 8 }}
            />
            <BlurText
              text={texts[index]}
              delay={80}
              direction="top"
              stepDuration={0.3}
              animationKey={index}
              align={align}
              textStyle={styles.title}
              style={{ marginBottom: 16 }}
            />
            <BlurText
              text={description}
              delay={60}
              direction="bottom"
              stepDuration={0.3}
              animationKey={`desc-${index}`}
              align={align}
              textStyle={styles.description}
              style={{ marginBottom: 8 }}
            />
            <BlurText
              text={note}
              delay={50}
              direction="bottom"
              stepDuration={0.25}
              animationKey={`note-${index}`}
              align={align}
              textStyle={styles.note}
              style={{ marginBottom: details ? 12 : 32 }}
            />
            {details ? (
              <Txt variant="small" color={colors.textSubtle} align={align} style={{ marginBottom: 24 }} numberOfLines={3}>
                {details}
              </Txt>
            ) : null}

            <Animated.View entering={FadeInUp.delay(800).duration(600)} style={[styles.actions, wide && { justifyContent: 'flex-start' }]}>
              <Pressable
                onPress={primary.onPress}
                style={({ pressed }) => [styles.btn, styles.btnPrimary, { opacity: pressed ? 0.9 : 1 }]}>
                <Txt style={styles.btnPrimaryText}>{primary.label}</Txt>
                {primary.icon !== false ? <Ionicons name="chevron-forward" size={16} color={colors.white} /> : null}
              </Pressable>
              <Pressable
                onPress={secondary.onPress}
                style={({ pressed }) => [styles.btn, styles.btnOutline, pressed && { backgroundColor: colors.primary }]}>
                {({ pressed }) => (
                  <Txt style={[styles.btnOutlineText, pressed && { color: colors.white }]}>{secondary.label}</Txt>
                )}
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 24 },
  grid: { width: '100%', maxWidth: 1024, alignSelf: 'center', gap: 32, alignItems: 'center' },
  gridWide: { flexDirection: 'row' },
  art: { width: '100%', alignItems: 'center' },
  image: { width: '100%', maxWidth: 448, aspectRatio: 3 / 2 },
  content: { width: '100%' },
  label: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.primary,
    letterSpacing: 2.6,
    textTransform: 'uppercase',
  },
  title: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 34, color: colors.text },
  description: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, color: colors.textMuted },
  note: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.textSubtle, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  btn: {
    flex: 1,
    maxWidth: 200,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
  },
  btnPrimary: { backgroundColor: colors.primary },
  btnPrimaryText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.white },
  btnOutline: { borderWidth: 1, borderColor: colors.primary },
  btnOutlineText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.primary },
});
