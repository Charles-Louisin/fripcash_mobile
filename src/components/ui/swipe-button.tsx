import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { interpolate, runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { colors, fonts } from '@/theme';

import { Txt } from './text';

const KNOB = 52;
const PAD = 5;

export function SwipeButton({
  label,
  onConfirm,
  loading,
  disabled,
}: {
  label: string;
  onConfirm: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const [width, setWidth] = useState(0);
  const x = useSharedValue(0);
  const max = Math.max(0, width - KNOB - PAD * 2);

  const done = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onConfirm();
  };

  const pan = Gesture.Pan()
    .enabled(!disabled && !loading && max > 0)
    .onUpdate((e) => {
      x.value = Math.min(max, Math.max(0, e.translationX));
    })
    .onEnd(() => {
      if (x.value > max * 0.85) {
        x.value = withSpring(max, { damping: 18 });
        runOnJS(done)();
      }
      x.value = withSpring(0, { damping: 18 });
    });

  const knobStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [0, max || 1], [1, 0.15]),
  }));

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      style={[styles.track, (disabled || loading) && { opacity: 0.6 }]}
      accessibilityRole="adjustable"
      accessibilityLabel={label}>
      <Animated.View style={[styles.labelWrap, labelStyle]}>
        <Txt style={styles.label}>{label}</Txt>
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.knob, knobStyle]}>
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Ionicons name="chevron-forward-outline" size={24} color={colors.white} />
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: KNOB + PAD * 2,
    borderRadius: (KNOB + PAD * 2) / 2,
    backgroundColor: colors.dark,
    justifyContent: 'center',
    padding: PAD,
  },
  labelWrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', paddingLeft: KNOB },
  label: { color: colors.onDark, fontFamily: fonts.bold, fontSize: 15 },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
