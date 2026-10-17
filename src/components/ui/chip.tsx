import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { colors, fonts, radius } from '@/theme';

import { Txt } from './text';

type ChipProps = {
  label: string;
  active?: boolean;
  icon?: ComponentProps<typeof Ionicons>['name'];
  onPress?: () => void;
};

export function Chip({ label, active, icon, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => [styles.chip, active && styles.active, { opacity: pressed ? 0.8 : 1 }]}>
      {icon ? <Ionicons name={icon} size={15} color={active ? colors.white : colors.text} /> : null}
      <Txt style={[styles.text, active && { color: colors.white }]}>{label}</Txt>
    </Pressable>
  );
}

export function ChipRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon?: ComponentProps<typeof Ionicons>['name'] }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroller}
      contentContainerStyle={styles.row}>
      {options.map((o) => (
        <Chip key={o.value} label={o.label} icon={o.icon} active={o.value === value} onPress={() => onChange(o.value)} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 15,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  active: { backgroundColor: colors.primary, borderColor: colors.primary },
  text: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text },
  scroller: { flexGrow: 0, flexShrink: 0, maxHeight: 54 },
  row: { gap: 8, paddingHorizontal: 16, paddingVertical: 4, alignItems: 'center' },
});
