import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { IconButton, Logo, Txt } from '@/components/ui';
import { useAuth, useFavoriteIds, useUnreadCount } from '@/hooks/queries';
import { useCart } from '@/hooks/use-cart';
import { colors, fonts, radius } from '@/theme';

export function AppHeader() {
  const { isConsumer, isAdmin } = useAuth();
  const unread = useUnreadCount();
  const favorites = useFavoriteIds().size;
  const { count } = useCart();
  const guard = (path: '/notifications' | '/favoris') => () => router.push(isConsumer ? path : '/connexion');
  if (isAdmin) {
    return (
      <View style={styles.header}>
        <Logo size={28} />
        <View style={{ flex: 1 }} />
        <IconButton icon="speedometer-outline" label="Tableau de bord admin" onPress={() => router.push('/admin')} />
      </View>
    );
  }
  return (
    <View style={styles.header}>
      <Logo size={28} />
      <View style={{ flex: 1 }} />
      <IconButton icon="notifications-outline" label="Notifications" badge={unread > 0} onPress={guard('/notifications')} />
      <IconButton icon="heart-outline" label="Favoris" badge={favorites || undefined} onPress={guard('/favoris')} />
      <IconButton icon="bag-outline" label="Panier" badge={count || undefined} onPress={() => router.push('/panier')} />
      {isConsumer ? (
        <IconButton icon="settings-outline" label="Paramètres" onPress={() => router.push('/reglages')} />
      ) : (
        <Pressable
          onPress={() => router.push('/connexion')}
          accessibilityLabel="Connexion"
          hitSlop={6}
          style={{ marginLeft: 4 }}>
          <View style={styles.guest}>
            <Ionicons name="person" size={19} color={colors.white} />
          </View>
        </Pressable>
      )}
    </View>
  );
}

export function SearchBar({
  placeholder = 'Rechercher un article, une boutique…',
  value,
  onChangeText,
  onSubmit,
  onPress,
  onFilter,
  filterActive,
  autoFocus,
  tone = 'muted',
}: {
  placeholder?: string;
  value?: string;
  onChangeText?: (v: string) => void;
  onSubmit?: () => void;
  onPress?: () => void;
  onFilter?: () => void;
  filterActive?: boolean;
  autoFocus?: boolean;
  tone?: 'muted' | 'plain';
}) {
  const content = (
    <>
      <Ionicons name="search-outline" size={20} color={colors.textMuted} />
      {onPress ? (
        <Txt variant="body" color={colors.textSubtle} style={{ flex: 1 }} numberOfLines={1}>
          {placeholder}
        </Txt>
      ) : (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          placeholder={placeholder}
          placeholderTextColor={colors.textSubtle}
          returnKeyType="search"
          autoFocus={autoFocus}
          autoCorrect={false}
          style={[styles.input, tone === 'plain' && styles.inputPlain]}
        />
      )}
      {value && onChangeText ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={8} accessibilityLabel="Effacer">
          <Ionicons name="close-circle" size={18} color={colors.textSubtle} />
        </Pressable>
      ) : null}
      {onFilter ? (
        <Pressable onPress={onFilter} hitSlop={8} accessibilityLabel="Filtres">
          <Ionicons name="options-outline" size={20} color={filterActive ? colors.primary : colors.text} />
        </Pressable>
      ) : null}
    </>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={[styles.search, tone === 'plain' && styles.searchPlain]} accessibilityRole="search">
        {content}
      </Pressable>
    );
  }
  return <View style={[styles.search, tone === 'plain' && styles.searchPlain]}>{content}</View>;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 16, paddingVertical: 8 },
  guest: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 16,
  },
  searchPlain: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.borderSoft },
  input: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 0,
    ...(Platform.OS === 'web' ? { outlineWidth: 0 } : null),
  },
  inputPlain: { fontSize: 13 },
});
