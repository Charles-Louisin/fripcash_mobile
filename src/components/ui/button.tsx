import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts, radius } from '@/theme';

import { Txt } from './text';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'dark' | 'light';

export type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  icon?: ComponentProps<typeof Ionicons>['name'];
  iconRight?: ComponentProps<typeof Ionicons>['name'];
  loading?: boolean;
  disabled?: boolean;
  full?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

const PALETTE: Record<Variant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: colors.primary, fg: colors.white },
  secondary: { bg: colors.secondary, fg: colors.primaryDark },
  outline: { bg: 'transparent', fg: colors.primary, border: colors.primary },
  ghost: { bg: 'transparent', fg: colors.primary },
  danger: { bg: colors.errorSoft, fg: colors.error },
  dark: { bg: colors.dark, fg: colors.onDark },
  light: { bg: colors.white, fg: colors.text, border: colors.border },
};

const SIZES = {
  sm: { h: 36, px: 14, font: 13, icon: 15 },
  md: { h: 48, px: 18, font: 15, icon: 18 },
  lg: { h: 56, px: 22, font: 16, icon: 20 },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading,
  disabled,
  full,
  style,
}: ButtonProps) {
  const p = PALETTE[variant];
  const s = SIZES[size];
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        {
          height: s.h,
          paddingHorizontal: s.px,
          backgroundColor: p.bg,
          borderColor: p.border ?? 'transparent',
          borderWidth: p.border ? 1.5 : 0,
          opacity: inactive ? 0.55 : pressed ? 0.85 : 1,
          alignSelf: full ? 'stretch' : 'auto',
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <Ionicons name={icon} size={s.icon} color={p.fg} /> : null}
          <Txt style={{ color: p.fg, fontFamily: fonts.bold, fontSize: s.font }} numberOfLines={1}>
            {title}
          </Txt>
          {iconRight ? <Ionicons name={iconRight} size={s.icon} color={p.fg} /> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
