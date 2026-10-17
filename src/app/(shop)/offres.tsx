import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Badge, Button, Card, EmptyState, Screen, ScreenHeader, Segmented, toast, Txt } from '@/components/ui';
import { qk, useMe, useOffers } from '@/hooks/queries';
import { useCart } from '@/hooks/use-cart';
import { acceptOffer, errorMessage, fetchListing, refuseOffer, type Offer } from '@/lib/api';
import { formatGnf, formatRelative } from '@/lib/format';
import { useQueryClient } from '@tanstack/react-query';

function statusBadge(o: Offer) {
  if (o.status === 'accepted' && o.used) return { label: 'Utilisée', tone: 'neutral' as const };
  if (o.status === 'accepted') return { label: 'Acceptée', tone: 'success' as const };
  if (o.status === 'refused') return { label: 'Refusée', tone: 'danger' as const };
  return { label: 'En attente', tone: 'warning' as const };
}

export default function OffresScreen() {
  const offers = useOffers();
  const me = useMe();
  const cart = useCart();
  const client = useQueryClient();
  const [picked, setPicked] = useState<'received' | 'sent' | null>(null);
  const [adding, setAdding] = useState<string | null>(null);

  const act = async (id: string, accept: boolean) => {
    try {
      if (accept) await acceptOffer(id);
      else await refuseOffer(id);
      client.invalidateQueries({ queryKey: qk.offers });
      toast.success(accept ? 'Offre acceptée' : 'Offre refusée');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const buy = async (o: Offer) => {
    setAdding(o.id);
    try {
      const listing = await fetchListing(o.listingId);
      await cart.add({ listing, quantity: 1 });
      client.invalidateQueries({ queryKey: qk.cart });
      router.push('/panier');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setAdding(null);
    }
  };

  const rows = offers.data ?? [];
  const uid = me.data?.id;
  const received = rows.filter((o) => o.sellerId === uid);
  const sent = rows.filter((o) => o.buyerId === uid);
  const tab = picked ?? (me.data?.seller && received.length ? 'received' : 'sent');
  const shown = tab === 'received' ? received : sent;

  return (
    <Screen>
      <ScreenHeader title="Offres" />
      <View style={{ marginBottom: 12 }}>
        <Segmented
          value={tab}
          onChange={setPicked}
          options={[
            { value: 'received', label: `Reçues${received.length ? ` (${received.length})` : ''}` },
            { value: 'sent', label: `Envoyées${sent.length ? ` (${sent.length})` : ''}` },
          ]}
        />
      </View>
      {!shown.length ? (
        <EmptyState icon="pricetag-outline" title={tab === 'sent' ? 'Aucune offre envoyée' : 'Aucune offre reçue'} />
      ) : (
        <View style={{ gap: 10 }}>
          {shown.map((o) => {
            const badge = statusBadge(o);
            return (
              <Card key={o.id}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Txt variant="h3" weight="bold">
                    {formatGnf(o.amountGnf)}
                  </Txt>
                  <Badge label={badge.label} tone={badge.tone} />
                </View>
                {o.message ? <Txt variant="caption">{o.message}</Txt> : null}
                <Txt variant="small">{formatRelative(o.createdAt)}</Txt>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                  <Button
                    title="Voir l’article"
                    size="sm"
                    variant="ghost"
                    onPress={() => router.push({ pathname: '/article/[id]', params: { id: o.listingId } })}
                  />
                  {tab === 'sent' && o.status === 'accepted' && !o.used ? (
                    <Button title="Acheter à ce prix" size="sm" loading={adding === o.id} onPress={() => buy(o)} />
                  ) : null}
                  {tab === 'received' && o.status === 'pending' ? (
                    <>
                      <Button title="Accepter" size="sm" onPress={() => act(o.id, true)} />
                      <Button title="Refuser" size="sm" variant="outline" onPress={() => act(o.id, false)} />
                    </>
                  ) : null}
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
