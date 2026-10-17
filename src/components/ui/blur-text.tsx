import { useEffect } from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

type Props = {
  text: string;
  /** Décalage entre deux morceaux, en millisecondes. */
  delay?: number;
  animateBy?: 'words' | 'letters';
  direction?: 'top' | 'bottom';
  /** Durée d'apparition d'un morceau, en secondes. */
  stepDuration?: number;
  /** Changer cette clé rejoue l'animation. */
  animationKey?: string | number;
  textStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
  align?: 'left' | 'center';
};

function Piece({
  children,
  index,
  delay,
  stepDuration,
  offset,
  textStyle,
}: {
  children: string;
  index: number;
  delay: number;
  stepDuration: number;
  offset: number;
  textStyle?: StyleProp<TextStyle>;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      index * delay,
      withTiming(1, { duration: stepDuration * 2000, easing: Easing.out(Easing.cubic) })
    );
  }, [delay, index, progress, stepDuration]);

  const animated = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * offset }],
  }));

  return (
    <Animated.View style={animated}>
      <Text style={textStyle}>{children}</Text>
    </Animated.View>
  );
}

/** Équivalent mobile du BlurText du site : apparition mot par mot (ou lettre par lettre). */
export function BlurText({
  text,
  delay = 200,
  animateBy = 'words',
  direction = 'top',
  stepDuration = 0.35,
  animationKey = 0,
  textStyle,
  style,
  align = 'center',
}: Props) {
  const pieces =
    animateBy === 'words'
      ? text.split(' ').map((w, i, all) => (i < all.length - 1 ? `${w}\u00A0` : w))
      : text.split('').map((c) => (c === ' ' ? '\u00A0' : c));
  const offset = direction === 'top' ? -30 : 30;

  return (
    <View
      key={`${animationKey}-${text}`}
      style={[styles.row, { justifyContent: align === 'center' ? 'center' : 'flex-start' }, style]}>
      {pieces.map((piece, i) => (
        <Piece key={`${i}-${piece}`} index={i} delay={delay} stepDuration={stepDuration} offset={offset} textStyle={textStyle}>
          {piece}
        </Piece>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap' },
});
