import { Tabs } from 'expo-router';

import { AppTabBar, goToSell } from '@/components/tab-bar';
import { useShopTabItems } from '@/components/catalog/shop-nav';
import { useAccountType } from '@/hooks/use-account-type';
import { useAuth } from '@/hooks/queries';
import { colors } from '@/theme';

export default function ShopTabsLayout() {
  const { isConsumer, isAdmin } = useAuth();
  const { type } = useAccountType();
  const items = useShopTabItems();

  return (
    <Tabs
      tabBar={(props) => (
        <AppTabBar
          state={props.state}
          navigation={props.navigation}
          items={items}
          onCenterPress={isAdmin ? undefined : () => goToSell(isConsumer, type.canPublish)}
        />
      )}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarStyle: { backgroundColor: 'transparent', borderTopWidth: 0, elevation: 0 },
        animation: 'fade',
      }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="explorer" />
      <Tabs.Screen name="messages" />
      <Tabs.Screen name="panier" options={type.isSeller || isConsumer ? { href: null } : {}} />
      <Tabs.Screen name="espace" options={type.isSeller ? {} : { href: null }} />
      <Tabs.Screen name="compte" options={!type.isSeller && isConsumer ? {} : { href: null }} />
    </Tabs>
  );
}
