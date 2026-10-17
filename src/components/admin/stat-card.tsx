import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Txt } from '@/components/ui';
import { colors, fonts, shadow } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

export const STAT_CARD_WIDTH = 236;

/** Carte KPI de l'admin, reprise du StatCard du site : libellé, valeur, description, lien d'action. */
export function AdminStatCard({
  label,
  value,
  description,
  actionLabel = 'Voir',
  icon,
  onPress,
}: {
  label: string;
  value: string;
  description?: string;
  actionLabel?: string;
  icon: IconName;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { borderColor: colors.primary }]}>
      <View style={styles.head}>
        <View style={{ flex: 1, gap: 4 }}>
          <Txt variant="caption" numberOfLines={1}>
            {label}
          </Txt>
          <Txt style={styles.value} numberOfLines={1}>
            {value}
          </Txt>
        </View>
        <View style={styles.icon}>
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
      </View>
      {description ? (
        <Txt variant="small" color={colors.textMuted} numberOfLines={2} style={{ marginTop: 6 }}>
          {description}
        </Txt>
      ) : null}
      <View style={styles.footer}>
        <Txt style={styles.action}>{actionLabel}</Txt>
        <Ionicons name="chevron-forward" size={13} color={colors.primary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: STAT_CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    ...shadow,
  },
  head: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  value: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 30, color: colors.text },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  action: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.primary },
});
