import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts } from '@/theme';

import { Txt } from './text';

type Props = {
  icon: ComponentProps<typeof Ionicons>['name'];
  onPress?: () => void;
  size?: number;
  color?: string;
  background?: string;
  badge?: number | boolean;
  label?: string;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({ icon, onPress, size = 22, color = colors.text, background, badge, label, style }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        background ? { backgroundColor: background } : null,
        { opacity: pressed ? 0.6 : 1 },
        style,
      ]}>
      <Ionicons name={icon} size={size} color={color} />
      {badge ? (
        <View style={[styles.badge, typeof badge === 'boolean' && styles.dot]}>
          {typeof badge === 'number' ? (
            <Txt style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Txt>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 0,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  dot: { minWidth: 10, width: 10, height: 10, top: 6, right: 8 },
  badgeText: { color: colors.white, fontSize: 9.5, lineHeight: 12, fontFamily: fonts.bold },
});
