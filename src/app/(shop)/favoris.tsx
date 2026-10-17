import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { ListingCard } from '@/components/catalog/listing-card';
import { Chip, EmptyState, Screen, ScreenHeader } from '@/components/ui';
import { useFavorites } from '@/hooks/queries';

const SORTS = [
  { id: 'recent', label: 'Plus récent' },
  { id: 'price-asc', label: 'Prix croissant' },
  { id: 'price-desc', label: 'Prix décroissant' },
] as const;

export default function FavorisScreen() {
  const { width } = useWindowDimensions();
  const cardW = (width - 42) / 2;
  const favs = useFavorites();
  const [sort, setSort] = useState<(typeof SORTS)[number]['id']>('recent');
  const listings = useMemo(() => {
    const rows = (favs.data ?? []).map((f) => f.listing).filter((l) => !!l);
    const copy = [...rows];
    if (sort === 'price-asc') copy.sort((a, b) => a.priceGnf - b.priceGnf);
    else if (sort === 'price-desc') copy.sort((a, b) => b.priceGnf - a.priceGnf);
    return copy;
  }, [favs.data, sort]);
  const n = listings.length;

  return (
    <Screen>
      <ScreenHeader
        title="Favoris"
        subtitle={n ? `${n} article${n > 1 ? 's' : ''} sauvegardé${n > 1 ? 's' : ''}` : undefined}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {SORTS.map((item) => (
          <Chip key={item.id} label={item.label} active={sort === item.id} onPress={() => setSort(item.id)} />
        ))}
      </View>
      {!listings.length ? (
        <EmptyState
          icon="heart-outline"
          title="Aucun favori"
          message="Explore les articles et ajoute tes coups de cœur."
          actionLabel="Parcourir les articles"
          onAction={() => router.push('/recherche')}
        />
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} width={cardW} />
          ))}
        </View>
      )}
    </Screen>
  );
}
