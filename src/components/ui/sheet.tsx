import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { Extrapolation, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useKeyboardSpace } from '@/lib/keyboard-space';
import { colors, radius } from '@/theme';

import { Button } from './button';
import { Txt } from './text';

const SPRING = { damping: 28, stiffness: 210, mass: 0.85 };

export function Sheet({
  visible,
  onClose,
  title,
  icon,
  showClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
  showClose?: boolean;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const keyboardSpace = useKeyboardSpace();
  const [mounted, setMounted] = useState(visible);
  const opened = useRef(false);
  const translateY = useSharedValue(560);
  const drag = useSharedValue(0);
  const backdrop = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opened.current = true;
      setMounted(true);
      drag.value = 0;
      translateY.value = 560;
      translateY.value = withSpring(0, SPRING);
      backdrop.value = withTiming(1, { duration: 340 });
      return;
    }
    if (!opened.current) return;
    translateY.value = translateY.value + drag.value;
    drag.value = 0;
    backdrop.value = withTiming(0, { duration: 260 });
    translateY.value = withTiming(560, { duration: 300 }, (finished) => {
      if (finished) runOnJS(setMounted)(false);
    });
  }, [backdrop, drag, translateY, visible]);

  const pan = Gesture.Pan()
    .activeOffsetY(6)
    .onUpdate((e) => {
      drag.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > 72 || e.velocityY > 850) {
        runOnJS(onClose)();
        return;
      }
      drag.value = withSpring(0, SPRING);
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value + drag.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdrop.value * interpolate(drag.value, [0, 320], [1, 0], Extrapolation.CLAMP),
  }));

  if (!mounted && !visible) return null;

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <GestureHandlerRootView style={styles.flex}>
        <View style={styles.flex}>
          <Animated.View style={[styles.backdrop, backdropStyle]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fermer" />
          </Animated.View>
          <GestureDetector gesture={pan}>
            <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + 16 + keyboardSpace }, sheetStyle]}>
              <View style={styles.handleZone}>
                <View style={styles.handle} />
              </View>
              {title || showClose || icon ? (
                <View style={styles.head}>
                  {icon ? <Ionicons name={icon} size={20} color={colors.text} /> : null}
                  {title ? (
                    <Txt variant="h2" style={{ flex: 1 }} numberOfLines={1}>
                      {title}
                    </Txt>
                  ) : (
                    <View style={{ flex: 1 }} />
                  )}
                  {showClose ? (
                    <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Fermer">
                      <Ionicons name="close" size={22} color={colors.text} />
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
              <ScrollView
                keyboardShouldPersistTaps="always"
                keyboardDismissMode="none"
                bounces={false}
                style={{ maxHeight: 560 }}>
                {children}
              </ScrollView>
            </Animated.View>
          </GestureDetector>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

export function ConfirmDialog({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  icon = 'help-circle-outline',
  tone = 'primary',
  loading,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
  tone?: 'primary' | 'danger';
  loading?: boolean;
  children?: ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.center}>
        <Pressable style={StyleSheet.absoluteFill} onPress={loading ? undefined : onClose} />
        <View style={styles.dialog}>
          <View style={[styles.iconWrap, tone === 'danger' && { backgroundColor: colors.errorSoft }]}>
            <Ionicons name={icon} size={28} color={tone === 'danger' ? colors.error : colors.primary} />
          </View>
          <Txt variant="h2" align="center">
            {title}
          </Txt>
          {message ? (
            <Txt variant="body" color={colors.textMuted} align="center">
              {message}
            </Txt>
          ) : null}
          {children}
          <View style={{ gap: 10, alignSelf: 'stretch', marginTop: 6 }}>
            <Button
              title={confirmLabel}
              onPress={onConfirm}
              loading={loading}
              variant={tone === 'danger' ? 'danger' : 'primary'}
              full
            />
            <Button title={cancelLabel} onPress={onClose} variant="ghost" disabled={loading} full />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  handleZone: { alignItems: 'center', paddingTop: 4, paddingBottom: 12 },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  center: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    padding: 22,
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
