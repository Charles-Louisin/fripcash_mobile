import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts, radius } from '@/theme';

import { Txt } from './text';

export type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'dark' | 'light';

const TONES: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: colors.surfaceMuted, fg: colors.textMuted },
  primary: { bg: colors.secondary, fg: colors.primaryDark },
  success: { bg: colors.successSoft, fg: colors.success },
  warning: { bg: colors.warningSoft, fg: colors.warning },
  danger: { bg: colors.errorSoft, fg: colors.error },
  dark: { bg: colors.darkMuted, fg: colors.onDark },
  light: { bg: 'rgba(255,255,255,0.9)', fg: colors.text },
};

export function Badge({
  label,
  tone = 'primary',
  icon,
  solid,
  style,
}: {
  label: string;
  tone?: Tone;
  icon?: ComponentProps<typeof Ionicons>['name'];
  solid?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const t = TONES[tone];
  const bg = solid ? t.fg : t.bg;
  const fg = solid ? colors.white : t.fg;
  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      {icon ? <Ionicons name={icon} size={12} color={fg} /> : null}
      <Txt style={[styles.text, { color: fg }]} numberOfLines={1}>
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  text: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 14 },
});
