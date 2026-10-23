import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router, type Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Txt } from '@/components/ui';
import { colors, fonts, shadow } from '@/theme';

type TabBarRenderProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: any;
};

type IconName = ComponentProps<typeof Ionicons>['name'];

export type TabItem = {
  route: string;
  label: string;
  icon: IconName;
  activeIcon: IconName;
  badge?: number;
  profile?: boolean;
  avatarUri?: string | null;
  avatarName?: string | null;
  /** Ouvre un écran hors des onglets au lieu de changer d'onglet. */
  href?: Href;
};

export function AppTabBar({
  state,
  navigation,
  items,
  onCenterPress,
  dark,
}: TabBarRenderProps & { items: TabItem[]; onCenterPress?: () => void; dark?: boolean }) {
  const insets = useSafeAreaInsets();
  const current = state.routes[state.index]?.name;
  const half = Math.ceil(items.length / 2);
  const fg = dark ? colors.onDarkMuted : colors.textMuted;

  const renderItem = (item: TabItem) => {
    const active = current === item.route;
    return (
      <Pressable
        key={item.route}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        accessibilityLabel={item.label}
        onPress={() => {
          if (item.href) {
            router.push(item.href);
            return;
          }
          const route = state.routes.find((r) => r.name === item.route);
          if (!route) return;
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (event.defaultPrevented) return;
          if (!active || item.route === 'index') navigation.navigate(item.route);
        }}
        style={styles.item}>
        <View>
          {item.profile ? (
            <View style={[styles.avatarRing, active && styles.avatarRingOn]}>
              <Avatar uri={item.avatarUri} name={item.avatarName} size={24} />
            </View>
          ) : (
            <Ionicons name={active ? item.activeIcon : item.icon} size={23} color={active ? colors.primary : fg} />
          )}
          {item.badge ? (
            <View style={styles.badge}>
              <Txt style={styles.badgeText}>{item.badge > 9 ? '9+' : item.badge}</Txt>
            </View>
          ) : null}
        </View>
        <Txt style={[styles.label, { color: active ? colors.primary : fg }]} numberOfLines={1}>
          {item.label}
        </Txt>
        {active ? <View style={styles.indicator} /> : null}
      </Pressable>
    );
  };

  return (
    <View style={[styles.slot, { paddingBottom: Math.max(insets.bottom, 8) }, dark && { backgroundColor: colors.dark }]}>
      <View style={[styles.bar, dark && { backgroundColor: colors.dark, borderColor: colors.darkSoft }]}>
        {items.slice(0, half).map(renderItem)}
        {onCenterPress ? (
          <View style={styles.centerWrap}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                onCenterPress();
              }}
              accessibilityLabel="Vendre un article"
              style={({ pressed }) => [styles.center, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}>
              <Ionicons name="add" size={32} color={colors.white} />
            </Pressable>
          </View>
        ) : null}
        {items.slice(half).map(renderItem)}
      </View>
    </View>
  );
}

export function goToSell(isConsumer: boolean, canPublish: boolean) {
  if (!isConsumer) router.push('/connexion');
  else if (canPublish) router.push({ pathname: '/vendeur/article/[id]', params: { id: 'nouveau' } });
  else router.push('/devenir-vendeur');
}

const styles = StyleSheet.create({
  slot: { backgroundColor: 'transparent', paddingHorizontal: 12, paddingTop: 18 },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.white,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 6,
    ...shadow,
  },
  item: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 2 },
  label: { fontFamily: fonts.semibold, fontSize: 11 },
  indicator: { width: 0, height: 0 },
  centerWrap: { flex: 1, alignItems: 'center' },
  center: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -26,
    borderWidth: 4,
    borderColor: colors.background,
    ...shadow,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  badgeText: { color: colors.white, fontSize: 9.5, lineHeight: 12, fontFamily: fonts.bold },
  avatarRing: { borderRadius: 16, borderWidth: 2, borderColor: 'transparent', padding: 1 },
  avatarRingOn: { borderColor: colors.primary },
});
