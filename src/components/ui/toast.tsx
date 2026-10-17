import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { colors, radius, shadow } from '@/theme';

import { Txt } from './text';

type ToastKind = 'success' | 'error' | 'info';
type ToastState = {
  message: string | null;
  kind: ToastKind;
  id: number;
  show: (message: string, kind?: ToastKind) => void;
  hide: () => void;
};

const useToastStore = create<ToastState>((set) => ({
  message: null,
  kind: 'info',
  id: 0,
  show: (message, kind = 'info') => set((s) => ({ message, kind, id: s.id + 1 })),
  hide: () => set({ message: null }),
}));

export const toast = {
  success: (m: string) => useToastStore.getState().show(m, 'success'),
  error: (m: string) => useToastStore.getState().show(m, 'error'),
  info: (m: string) => useToastStore.getState().show(m, 'info'),
};

const ICONS = { success: 'checkmark-circle', error: 'alert-circle', info: 'information-circle' } as const;
const TINTS = { success: colors.success, error: colors.error, info: colors.primary };

export function ToastHost() {
  const { message, kind, id, hide } = useToastStore();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(hide, 3200);
    return () => clearTimeout(t);
  }, [id, message, hide]);

  if (!message) return null;
  return (
    <View pointerEvents="none" style={[styles.host, { top: insets.top + 8 }]}>
      <Animated.View key={id} entering={FadeInUp} exiting={FadeOutUp} style={[styles.toast, shadow]}>
        <Ionicons name={ICONS[kind]} size={20} color={TINTS[kind]} />
        <Txt variant="bodyStrong" style={{ flex: 1 }}>
          {message}
        </Txt>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 16, right: 16, zIndex: 1000 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
});
