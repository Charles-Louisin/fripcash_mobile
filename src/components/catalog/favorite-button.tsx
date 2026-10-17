import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet } from 'react-native';

import { useFavoriteIds, useToggleFavorite } from '@/hooks/queries';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { Txt } from '@/components/ui';
import { colors, fonts } from '@/theme';

export function FavoriteButton({
  listingId,
  size = 30,
  pill,
  count,
}: {
  listingId: string;
  size?: number;
  pill?: boolean;
  count?: number;
}) {
  const ids = useFavoriteIds();
  const toggle = useToggleFavorite();
  const requireAuth = useRequireAuth();
  const liked = ids.has(listingId);
  return (
    <Pressable
      hitSlop={8}
      accessibilityLabel={liked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      onPress={() => {
        requireAuth(() => {
          Haptics.selectionAsync().catch(() => {});
          toggle.mutate({ listingId, liked });
        }, 'Connecte-toi pour enregistrer tes favoris.');
      }}
      style={[pill ? styles.pill : styles.btn, !pill && { width: size, height: size, borderRadius: size / 2 }]}>
      <Ionicons name={liked ? 'heart' : 'heart-outline'} size={pill ? 16 : size * 0.55} color={liked || pill ? colors.primary : colors.text} />
      {pill && typeof count === 'number' ? <Txt style={styles.count}>{count}</Txt> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  count: { fontFamily: fonts.bold, fontSize: 13, color: colors.primary },
});
