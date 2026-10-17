import { router } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader, SearchBar } from '@/components/catalog/app-header';
import { ShopSlider } from '@/components/catalog/shop-slider';
import { LazyMount } from '@/components/ui';
import { useShops } from '@/hooks/queries';
import { usePullRefresh } from '@/hooks/use-pull-refresh';
import { UNIVERSES, type Universe } from '@/lib/domain';
import { colors } from '@/theme';

export default function ExplorerScreen() {
  const { width } = useWindowDimensions();
  const pull = usePullRefresh();
  const seconde = useShops({ shopKind: 'particulier', limit: 8 });
  const neufs = useShops({ shopKind: 'standard', limit: 6 });
  const quartier = useShops({ shopKind: 'proximite', limit: 6 });
  const enseignes = useShops({ shopKind: 'enseigne', limit: 6 });
  const queries: Record<Universe['shopKind'], ReturnType<typeof useShops>> = {
    particulier: seconde,
    standard: neufs,
    proximite: quartier,
    enseigne: enseignes,
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <AppHeader />
      <LazyMount kind="list">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
          refreshControl={
            <RefreshControl refreshing={pull.refreshing} onRefresh={pull.onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
          }>
          <View style={{ paddingHorizontal: 16, marginBottom: 18 }}>
            <SearchBar onPress={() => router.push('/recherche')} placeholder="Rechercher une boutique, un article…" />
          </View>
          {UNIVERSES.map((universe) => {
            const query = queries[universe.shopKind];
            return (
              <ShopSlider
                key={universe.destination}
                universe={universe}
                shops={query.data ?? []}
                loading={query.isLoading}
                error={query.error}
                onRetry={() => query.refetch()}
                screenWidth={width}
              />
            );
          })}
        </ScrollView>
      </LazyMount>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
});
