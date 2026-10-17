import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { toast, Txt } from '@/components/ui';
import { useToggleSellerLike } from '@/hooks/queries';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { errorMessage } from '@/lib/api';
import { colors, fonts, radius } from '@/theme';

export function ShopLikeButton({
  sellerId,
  likedByMe,
  size = 36,
  style,
  inverted,
}: {
  sellerId: string;
  likedByMe?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
  inverted?: boolean;
}) {
  const requireAuth = useRequireAuth();
  const toggle = useToggleSellerLike();
  const liked =
    toggle.variables === sellerId && toggle.data != null ? toggle.data.liked : !!likedByMe;

  return (
    <Pressable
      hitSlop={8}
      accessibilityLabel={liked ? 'Retirer le like de la boutique' : 'Liker la boutique'}
      onPress={() => {
        requireAuth(() => {
          Haptics.selectionAsync().catch(() => {});
          toggle.mutate(sellerId, {
            onSuccess: (res) => toast.success(res.liked ? 'Boutique likée' : 'Like retiré'),
            onError: (err) => toast.error(errorMessage(err)),
          });
        }, 'Connecte-toi pour liker cette boutique.');
      }}
      style={[styles.btn, inverted && styles.btnDark, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <Ionicons
        name={liked ? 'heart' : 'heart-outline'}
        size={size * 0.52}
        color={liked ? (inverted ? colors.white : colors.primary) : inverted ? colors.white : colors.text}
      />
    </Pressable>
  );
}

export function FollowButton({ sellerId, likedByMe }: { sellerId: string; likedByMe?: boolean }) {
  const requireAuth = useRequireAuth();
  const toggle = useToggleSellerLike();
  const liked =
    toggle.variables === sellerId && toggle.data != null ? toggle.data.liked : !!likedByMe;

  const press = () => {
    requireAuth(() => {
      toggle.mutate(sellerId, {
        onError: (err) => toast.error(errorMessage(err)),
      });
    }, 'Connecte-toi pour suivre cette boutique.');
  };

  return (
    <Pressable
      onPress={press}
      accessibilityLabel={liked ? 'Ne plus suivre' : 'Suivre'}
      style={({ pressed }) => [styles.follow, liked && styles.followOn, { opacity: pressed ? 0.85 : 1 }]}>
      <Ionicons name={liked ? 'checkmark' : 'person-add-outline'} size={14} color={liked ? colors.primary : colors.white} />
      <Txt style={[styles.followText, liked && { color: colors.primary }]}>{liked ? 'Suivi' : 'Suivre'}</Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center' },
  btnDark: { backgroundColor: 'rgba(36,20,18,0.45)' },
  follow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    height: 36,
  },
  followOn: { backgroundColor: colors.primarySoft },
  followText: { color: colors.white, fontFamily: fonts.bold, fontSize: 13 },
});
