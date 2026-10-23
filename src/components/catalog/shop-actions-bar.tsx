import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Txt } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';

type Props = {
  onContact: () => void;
  onReviews: () => void;
};

export function ShopActionsBar({ onContact, onReviews }: Props) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onContact}
        accessibilityLabel="Contacter"
        style={({ pressed }) => [styles.outline, styles.flex, pressed && styles.pressed]}>
        <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
        <Txt style={styles.outlineText}>Contacter</Txt>
      </Pressable>
      <Pressable
        onPress={onReviews}
        accessibilityLabel="Voir les avis"
        style={({ pressed }) => [styles.outline, styles.flex, pressed && styles.pressed]}>
        <Ionicons name="star-outline" size={18} color={colors.primary} />
        <Txt style={styles.outlineText}>Voir les avis</Txt>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, marginTop: 14 },
  flex: { flex: 1 },
  outline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  outlineText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.primary },
  pressed: { opacity: 0.88 },
});
