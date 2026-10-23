import { Tabs } from 'expo-router';

import { AppTabBar, type TabItem } from '@/components/tab-bar';
import { colors } from '@/theme';

const ITEMS: TabItem[] = [
  { route: 'index', label: 'Missions', icon: 'bicycle-outline', activeIcon: 'bicycle' },
  { route: 'gains', label: 'Gains', icon: 'wallet-outline', activeIcon: 'wallet' },
  { route: 'historique', label: 'Historique', icon: 'time-outline', activeIcon: 'time' },
  { route: 'profil', label: 'Profil', icon: 'person-outline', activeIcon: 'person' },
];

export default function LivreurTabs() {
  return (
    <Tabs
      tabBar={(props) => <AppTabBar state={props.state} navigation={props.navigation} items={ITEMS} dark />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="gains" />
      <Tabs.Screen name="historique" />
      <Tabs.Screen name="profil" />
    </Tabs>
  );
}
