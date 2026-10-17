import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, type ImageSource } from 'expo-image';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { mediaUrl } from '@/lib/api';
import { colors, fonts } from '@/theme';

import { Txt } from '@/components/ui';

type IconName = ComponentProps<typeof Ionicons>['name'];

export function markSource(value?: string | null): ImageSource | null {
  if (!value) return null;
  const uri = mediaUrl(value);
  return uri ? { uri } : null;
}

export function ShopMark({
  value,
  name,
  size = 40,
  ring = true,
}: {
  value?: string | null;
  name?: string;
  size?: number;
  ring?: boolean;
}) {
  const border = ring ? { borderWidth: 2, borderColor: colors.white } : null;
  if (value?.startsWith('mono|') || value?.startsWith('icon|')) {
    const [, label, bg, fg] = value.split('|');
    const icon = value.startsWith('icon|') ? (label as IconName) : null;
    return (
      <View style={[styles.mark, border, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg || colors.secondary }]}>
        {icon ? (
          <Ionicons name={icon} size={size * 0.42} color={fg || colors.primary} />
        ) : (
          <Txt style={{ fontFamily: fonts.bold, fontSize: Math.max(9, size * (label.length > 3 ? 0.22 : 0.34)), color: fg || colors.primary }}>
            {label}
          </Txt>
        )}
      </View>
    );
  }
  const source = markSource(value);
  if (source) {
    return <Image source={source} style={[styles.photo, border, { width: size, height: size, borderRadius: size / 2 }]} contentFit="cover" />;
  }
  const letter = (name || '?').trim().charAt(0).toUpperCase();
  return (
    <View style={[styles.mark, border, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.secondary }]}>
      <Txt style={{ fontFamily: fonts.bold, fontSize: size * 0.36, color: colors.primary }}>{letter}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  mark: { alignItems: 'center', justifyContent: 'center' },
  photo: { backgroundColor: colors.surfaceMuted },
});
