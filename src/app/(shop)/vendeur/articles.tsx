import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { Badge, Button, EmptyState, Screen, ScreenHeader, Segmented, toast, Txt } from '@/components/ui';
import { qk, useListings } from '@/hooks/queries';
import { deleteListing, errorMessage, listingImages, type Listing } from '@/lib/api';
import { formatGnf } from '@/lib/format';
import { colors, radius } from '@/theme';

const TABS = [
  { value: 'active' as const, label: 'En vente' },
  { value: 'sold' as const, label: 'Vendus' },
  { value: 'other' as const, label: 'Autres' },
];

function inTab(listing: Listing, tab: (typeof TABS)[number]['value']) {
  if (tab === 'active') return listing.status === 'ACTIVE';
  if (tab === 'sold') return listing.status === 'SOLD' || listing.status === 'SOLD_OUT';
  return !['ACTIVE', 'SOLD', 'SOLD_OUT'].includes(listing.status);
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'En vente',
  SOLD: 'Vendu',
  SOLD_OUT: 'Épuisé',
  DRAFT: 'Brouillon',
  REJECTED: 'Refusé',
  FLAGGED: 'Signalé',
  ARCHIVED: 'Archivé',
};

export default function MesArticlesScreen() {
  const client = useQueryClient();
  const mine = useListings({ mine: '1' });
  const [tab, setTab] = useState<(typeof TABS)[number]['value']>('active');
  const shown = useMemo(() => (mine.data ?? []).filter((listing) => inTab(listing, tab)), [mine.data, tab]);

  const remove = (listing: Listing) => {
    Alert.alert('Supprimer l’annonce', `Supprimer « ${listing.title} » ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteListing(listing.id);
            await client.invalidateQueries({ queryKey: qk.listings({ mine: '1' }) });
            toast.success('Annonce supprimée');
          } catch (e) {
            toast.error(errorMessage(e));
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <ScreenHeader
        title="Mes annonces"
        right={
          <Button
            title="Nouveau"
            size="sm"
            onPress={() => router.push({ pathname: '/vendeur/article/[id]', params: { id: 'nouveau' } })}
          />
        }
      />
      <View style={{ marginBottom: 12 }}>
        <Segmented value={tab} onChange={setTab} options={TABS} />
      </View>
      {!shown.length ? (
        <EmptyState
          icon="shirt-outline"
          title={tab === 'other' ? 'Aucun article retiré ou refusé' : tab === 'sold' ? 'Aucun article vendu' : 'Aucun article en vente'}
          actionLabel={tab === 'active' ? 'Publier' : undefined}
          onAction={tab === 'active' ? () => router.push({ pathname: '/vendeur/article/[id]', params: { id: 'nouveau' } }) : undefined}
        />
      ) : (
        <View style={{ gap: 10 }}>
          {shown.map((listing) => (
            <View key={listing.id} style={styles.row}>
              <Pressable
                onPress={() => router.push({ pathname: '/vendeur/article/[id]', params: { id: listing.id } })}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {listingImages(listing)[0] ? (
                  <Image source={{ uri: listingImages(listing)[0] }} style={styles.thumb} contentFit="cover" />
                ) : (
                  <View style={styles.thumb} />
                )}
                <View style={{ flex: 1, gap: 3 }}>
                  <Txt variant="bodyStrong" numberOfLines={1}>
                    {listing.title}
                  </Txt>
                  <Txt variant="caption">{formatGnf(listing.priceGnf)}</Txt>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Badge label={STATUS_LABEL[listing.status] || listing.status} />
                    <Txt variant="caption">{listing.favoritesCount ?? 0} favoris</Txt>
                  </View>
                </View>
              </Pressable>
              <Button title="Supprimer" size="sm" variant="ghost" onPress={() => remove(listing)} />
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  thumb: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
});
