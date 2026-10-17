import { useLocalSearchParams } from 'expo-router';

import { ShopSheet } from '@/components/catalog/shop-sheet';
import { ErrorState, PageSkeleton, Screen, ScreenHeader } from '@/components/ui';
import { useSeller } from '@/hooks/queries';

export default function BoutiqueScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const shop = useSeller(id);

  if (shop.isLoading) {
    return (
      <Screen scroll={false} padded={false} skeleton="product">
        <ScreenHeader />
        <PageSkeleton kind="product" />
      </Screen>
    );
  }
  if (shop.isError || !shop.data) {
    return (
      <Screen>
        <ScreenHeader />
        <ErrorState error={shop.error ?? new Error('Boutique introuvable')} onRetry={() => shop.refetch()} />
      </Screen>
    );
  }

  return <ShopSheet shop={shop.data} />;
}
