import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, type ImageSource } from 'expo-image';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { initials } from '@/lib/format';
import { colors, fonts, radius, shadow } from '@/theme';

import { Txt } from './text';

type IconName = ComponentProps<typeof Ionicons>['name'];

export function Card({
  children,
  style,
  onPress,
  padded = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  padded?: boolean;
}) {
  const body = [styles.card, padded && { padding: 14 }, style];
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [...body, { opacity: pressed ? 0.88 : 1 }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={body}>{children}</View>;
}

export function Avatar({
  uri,
  source,
  name,
  size = 44,
  ring,
  dark,
}: {
  uri?: string | null;
  source?: ImageSource | null;
  name?: string | null;
  size?: number;
  ring?: boolean;
  dark?: boolean;
}) {
  const ringStyle = ring ? { borderWidth: 3, borderColor: colors.white } : null;
  const photo = source || (uri ? { uri } : null);
  if (photo) {
    return (
      <Image
        source={photo}
        style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.surfaceMuted }, ringStyle]}
        contentFit="cover"
        transition={150}
      />
    );
  }
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: dark ? colors.darkMuted : colors.secondary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        ringStyle,
      ]}>
      <Txt style={{ fontFamily: fonts.bold, fontSize: size * 0.36, color: dark ? colors.onDark : colors.primary }}>
        {initials(name)}
      </Txt>
    </View>
  );
}

export function SectionHeader({
  title,
  actionLabel = 'Voir tout',
  onAction,
  right,
  style,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.section, style]}>
      <Txt style={{ flex: 1, fontFamily: fonts.display, fontSize: 20, lineHeight: 26, color: colors.text }} numberOfLines={1}>
        {title}
      </Txt>
      {right}
      {onAction ? (
        <Pressable onPress={onAction} hitSlop={8} style={styles.sectionAction}>
          <Txt variant="label" color={colors.primary}>
            {actionLabel}
          </Txt>
          <Ionicons name="chevron-forward" size={15} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function ListRow({
  icon,
  title,
  subtitle,
  onPress,
  right,
  danger,
  badge,
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: ReactNode;
  danger?: boolean;
  badge?: string | number;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}>
      {icon ? (
        <View style={[styles.rowIcon, danger && { backgroundColor: colors.errorSoft }]}>
          <Ionicons name={icon} size={19} color={danger ? colors.error : colors.primary} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Txt variant="bodyStrong" color={danger ? colors.error : colors.text}>
          {title}
        </Txt>
        {subtitle ? <Txt variant="caption">{subtitle}</Txt> : null}
      </View>
      {badge ? (
        <View style={styles.countBadge}>
          <Txt style={{ color: colors.white, fontFamily: fonts.bold, fontSize: 11 }}>{badge}</Txt>
        </View>
      ) : null}
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} /> : null)}
    </Pressable>
  );
}

export function InfoRow({ label, value, icon, dark }: { label: string; value?: string | null; icon?: IconName; dark?: boolean }) {
  return (
    <View style={styles.infoRow}>
      {icon ? <Ionicons name={icon} size={17} color={dark ? colors.onDarkMuted : colors.textSubtle} /> : null}
      <Txt variant="caption" style={{ width: 120 }} color={dark ? colors.onDarkMuted : colors.textMuted}>
        {label}
      </Txt>
      <Txt variant="bodyStrong" style={{ flex: 1 }} align="right" color={dark ? colors.onDark : colors.text}>
        {value || '—'}
      </Txt>
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: 1, backgroundColor: colors.borderSoft }, style]} />;
}

export function Rating({ value, count, size = 13 }: { value?: number; count?: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      <Ionicons name="star" size={size} color={colors.star} />
      <Txt style={{ fontFamily: fonts.bold, fontSize: size, color: colors.text }}>
        {value ? value.toFixed(1) : 'Nouveau'}
      </Txt>
      {count ? <Txt style={{ fontFamily: fonts.medium, fontSize: size - 1, color: colors.textMuted }}>({count})</Txt> : null}
    </View>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  dark,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  dark?: boolean;
}) {
  return (
    <View style={[styles.segment, dark && { backgroundColor: colors.darkSoft }]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.segmentItem, active && { backgroundColor: colors.primary }]}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}>
            <Txt
              variant="label"
              color={active ? colors.white : dark ? colors.onDarkMuted : colors.textMuted}
              numberOfLines={1}>
              {o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Stepper({ value, onChange, max = 99 }: { value: number; onChange: (n: number) => void; max?: number }) {
  return (
    <View style={styles.stepper}>
      <Pressable hitSlop={6} onPress={() => onChange(Math.max(1, value - 1))} style={styles.stepBtn} accessibilityLabel="Diminuer">
        <Ionicons name="remove" size={16} color={colors.text} />
      </Pressable>
      <Txt variant="title" style={{ minWidth: 22 }} align="center">
        {value}
      </Txt>
      <Pressable hitSlop={6} onPress={() => onChange(Math.min(max, value + 1))} style={styles.stepBtn} accessibilityLabel="Augmenter">
        <Ionicons name="add" size={16} color={colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow,
  },
  section: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    padding: 4,
  },
  segmentItem: {
    flex: 1,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    padding: 3,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
