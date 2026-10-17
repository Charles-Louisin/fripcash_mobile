import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';

import { errorMessage } from '@/lib/api';
import { colors, radius } from '@/theme';

import { Button } from './button';
import { Txt } from './text';

export function Loading({ label }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} size="large" />
      {label ? <Txt variant="caption">{label}</Txt> : null}
    </View>
  );
}

export function EmptyState({
  icon = 'file-tray-outline',
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon?: ComponentProps<typeof Ionicons>['name'];
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.center}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={30} color={colors.primary} />
      </View>
      <Txt variant="h3" align="center">
        {title}
      </Txt>
      {message ? (
        <Txt variant="caption" align="center" style={{ maxWidth: 280 }}>
          {message}
        </Txt>
      ) : null}
      {actionLabel && onAction ? <Button title={actionLabel} onPress={onAction} size="sm" style={{ marginTop: 6 }} /> : null}
    </View>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <EmptyState
      icon="cloud-offline-outline"
      title="Oups, un souci"
      message={errorMessage(error)}
      actionLabel={onRetry ? 'Réessayer' : undefined}
      onAction={onRetry}
    />
  );
}

export function Skeleton({
  width = '100%',
  height = 16,
  radius: r = radius.sm,
  style,
}: {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[{ width, height, borderRadius: r, backgroundColor: colors.surfaceMuted }, style]} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32, minHeight: 220 },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
});
