import { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

/** Même teinte que le splash natif (app.json → expo-splash-screen) : aucun saut à la relève. */
const SPLASH_BG = '#C0603C';
/** Largeur du sac sur le splash natif (image 200 pt, le sac occupe ~48 % de l'image). */
const BAG_W = 104;
const BAG_H = Math.round((BAG_W * 560) / 530);
/** Sac du logo de l'en-tête (LogoMark 28 pt : corps de 21 pt de large). */
const HEADER_BAG_W = 21;
/** Multiplicateur de durée pour régler l'animation à l'œil (laisser à 1). */
const SLOW = 1;

/** Le sac du logo, dessiné en vectoriel : rendu dès la première image, net à toute taille. */
function Bag({ width }: { width: number }) {
  return (
    <Svg width={width} height={(width * 560) / 530} viewBox="250 220 530 560">
      <Path d="M432 366 V318 a80 80 0 0 1 160 0 V366" stroke="#FFFFFF" strokeWidth={32} fill="none" />
      <Path
        d="M318 362 H706 a16 16 0 0 1 16 14 L760 722 a36 36 0 0 1 -36 38 H302 a36 36 0 0 1 -36 -38 L302 376 a16 16 0 0 1 16 -14 Z"
        fill="#FFFFFF"
      />
      <Path
        d="M478 632 V508 H572 M478 568 H560"
        stroke={SPLASH_BG}
        strokeWidth={26}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

/**
 * Ouverture animée : reprend le splash natif à l'identique, puis
 *  1. le sac « respire » (il se tasse et rebondit, comme un sac qu'on soulève) ;
 *  2. le fond terracotta se contracte en cercle vers le logo de l'en-tête de l'accueil,
 *     dévoilant la page depuis les bords ;
 *  3. le sac rétrécit et rejoint sa place dans l'en-tête, où il se fond dans le vrai logo.
 * Tout tourne sur le thread UI (Reanimated) : l'accueil se charge pendant l'animation.
 */
export function AnimatedSplash({ ready }: { ready: boolean }) {
  const [done, setDone] = useState(false);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();

  // Centre du logo dans l'en-tête (AppHeader : marge 16, logo 28 pt centré à 28 pt sous la zone
  // sûre), corrigé de l'anse pour que le corps du sac se superpose exactement (mesuré sur le web).
  const targetX = 16 + 14 - width / 2;
  const targetY = insets.top + 29.5 - height / 2;
  // Cercle assez grand pour couvrir tout l'écran depuis le centre.
  const diameter = Math.ceil(Math.hypot(width, height)) + 8;

  const bagScale = useSharedValue(1);
  const travel = useSharedValue(0);
  const circle = useSharedValue(1);
  const fade = useSharedValue(1);

  useEffect(() => {
    if (!ready) return;
    const finish = () => setDone(true);
    if (reduceMotion) {
      // Mouvement réduit demandé : simple fondu, sans déplacement.
      fade.set(withTiming(0, { duration: 220 }, (ok) => ok && scheduleOnRN(finish)));
      return;
    }
    const ease = Easing.bezier(0.65, 0, 0.35, 1);
    const t = (ms: number) => ms * SLOW;
    // Durées fixes (pas de ressort) : le sac atteint la taille du logo au moment où il s'y pose.
    // 1. Respiration du sac (0 → 360 ms).
    bagScale.set(
      withSequence(
        withTiming(0.9, { duration: t(160), easing: Easing.out(Easing.quad) }),
        withTiming(1.06, { duration: t(200), easing: Easing.out(Easing.back(2)) }),
        // 2. Vol vers l'en-tête (360 → 980 ms).
        withTiming(HEADER_BAG_W / BAG_W, { duration: t(620), easing: ease }),
      ),
    );
    // Contraction du fond vers le logo de l'en-tête, en même temps que le vol.
    circle.set(withDelay(t(360), withTiming(0, { duration: t(640), easing: ease })));
    travel.set(withDelay(t(360), withTiming(1, { duration: t(620), easing: ease })));
    // 3. Le sac blanc s'efface en se posant sur le vrai logo (terracotta) de l'en-tête.
    fade.set(withDelay(t(900), withTiming(0, { duration: t(160) }, (ok) => ok && scheduleOnRN(finish))));
  }, [ready, reduceMotion, bagScale, circle, travel, fade]);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: targetX * travel.get() },
      { translateY: targetY * travel.get() },
      { scale: circle.get() },
    ],
  }));
  const bagStyle = useAnimatedStyle(() => ({
    opacity: fade.get(),
    transform: [
      { translateX: targetX * travel.get() },
      { translateY: targetY * travel.get() },
      { scale: bagScale.get() },
    ],
  }));
  const rootStyle = useAnimatedStyle(() => ({ opacity: reduceMotion ? fade.get() : 1 }));

  if (done) return null;
  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, rootStyle]} pointerEvents="none">
      <Animated.View
        style={[
          styles.circle,
          { width: diameter, height: diameter, borderRadius: diameter / 2 },
          circleStyle,
        ]}
      />
      <Animated.View style={bagStyle}>
        <View style={{ width: BAG_W, height: BAG_H }}>
          <Bag width={BAG_W} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center', zIndex: 1000, elevation: 1000 },
  circle: { position: 'absolute', backgroundColor: SPLASH_BG },
});
