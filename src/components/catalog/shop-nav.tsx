import { router } from 'expo-router';

import { AppTabBar, goToSell, type TabItem } from '@/components/tab-bar';
import { goToHomeRoot } from '@/lib/nav';
import { mediaUrl } from '@/lib/api';
import { useAccountType } from '@/hooks/use-account-type';
import { useAuth, useMe, useUnreadMessagesCount } from '@/hooks/queries';
import { useCart } from '@/hooks/use-cart';

const HREFS = {
  index: '/',
  explorer: '/explorer',
  messages: '/messages',
  panier: '/panier',
  espace: '/espace',
  compte: '/compte',
} as const;

export function useShopTabItems(): TabItem[] {
  const { isConsumer, isAdmin } = useAuth();
  const { data: me } = useMe();
  const { type } = useAccountType();
  const unread = useUnreadMessagesCount();
  const { count } = useCart();
  if (isAdmin || me?.isAdmin) {
    return [
      { route: 'index', label: 'Accueil', icon: 'home-outline', activeIcon: 'home' },
      { route: 'explorer', label: 'Explorer', icon: 'grid-outline', activeIcon: 'grid' },
      { route: 'admin', label: 'Admin', icon: 'speedometer-outline', activeIcon: 'speedometer', href: '/admin' },
    ];
  }
  const tail: TabItem = type.isSeller
    ? { route: 'espace', label: 'Boutique', icon: 'storefront-outline', activeIcon: 'storefront' }
    : isConsumer
      ? {
          route: 'compte',
          label: 'Profil',
          icon: 'person-outline',
          activeIcon: 'person',
          profile: true,
          avatarUri: mediaUrl(me?.avatarUrl),
          avatarName: me?.displayName,
        }
      : { route: 'panier', label: 'Panier', icon: 'bag-outline', activeIcon: 'bag', badge: count || undefined };
  return [
    { route: 'index', label: 'Accueil', icon: 'home-outline', activeIcon: 'home' },
    { route: 'explorer', label: 'Explorer', icon: 'grid-outline', activeIcon: 'grid' },
    {
      route: 'messages',
      label: 'Messages',
      icon: 'chatbubble-outline',
      activeIcon: 'chatbubble',
      badge: unread || undefined,
    },
    tail,
  ];
}

/** Barre basse sur les écrans empilés (univers), alignée sur la navigation des onglets. */
export function ShopBottomNav({ active }: { active?: string }) {
  const items = useShopTabItems();
  const { isConsumer, isAdmin } = useAuth();
  const { type } = useAccountType();
  const index = active ? items.findIndex((item) => item.route === active) : -1;
  const state = {
    index,
    routes: items.map((item) => ({ key: item.route, name: item.route })),
  };
  const emitter = { emit: () => ({ defaultPrevented: false }) };
  const navigateToTab = (routeKey: string) => {
    if (routeKey === 'index') {
      goToHomeRoot();
      return;
    }
    router.navigate(HREFS[routeKey as keyof typeof HREFS] ?? '/');
  };
  return (
    <AppTabBar
      state={state}
      emitter={emitter}
      navigateToTab={navigateToTab}
      items={items}
      onCenterPress={isAdmin ? undefined : () => goToSell(isConsumer, type.canPublish)}
    />
  );
}
