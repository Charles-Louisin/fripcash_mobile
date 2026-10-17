import { router, useLocalSearchParams } from 'expo-router';
import { commandesHref, homeHref } from '@/lib/nav';
import { useEffect } from 'react';
import { View } from 'react-native';

import { Button, Loading, Screen, ScreenHeader, Txt } from '@/components/ui';
import { fetchPayment } from '@/lib/api';
import { formatGnf } from '@/lib/format';
import { colors } from '@/theme';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/hooks/queries';

export default function PaiementScreen() {
  const { ref } = useLocalSearchParams<{ ref: string }>();
  const client = useQueryClient();
  const pay = useQuery({
    queryKey: ['payment', ref],
    queryFn: () => fetchPayment(ref),
    enabled: !!ref,
    refetchInterval: (q) => (q.state.data?.payment.status === 'pending' ? 2500 : false),
  });
  const status = pay.data?.payment.status;
  const orders = pay.data?.orders;

  useEffect(() => {
    if (status === 'success') {
      client.invalidateQueries({ queryKey: qk.cart });
      client.invalidateQueries({ queryKey: ['orders'] });
    }
  }, [status, client]);

  useEffect(() => {
    const first = orders?.[0];
    if (status === 'success' && first) {
      const t = setTimeout(() => router.replace({ pathname: '/commandes/[id]', params: { id: first.id } }), 1200);
      return () => clearTimeout(t);
    }
  }, [status, orders]);

  return (
    <Screen scroll={false} edges={['top', 'bottom']}>
      <ScreenHeader title="Paiement" onBack={() => router.replace(homeHref)} />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14, padding: 24 }}>
        {status === 'pending' || pay.isLoading ? (
          <>
            <Loading label="En attente de confirmation…" />
            <Txt variant="caption" align="center">
              Valide le paiement sur ton téléphone si une notification Mobile Money apparaît.
            </Txt>
          </>
        ) : null}
        {status === 'success' ? (
          <>
            <Txt variant="h1" align="center">
              Paiement confirmé
            </Txt>
            <Txt variant="body" color={colors.textMuted} align="center">
              {formatGnf(pay.data?.payment.amountGnf)} bloqués en séquestre jusqu’à la réception.
            </Txt>
            <Button
              title="Voir la commande"
              onPress={() =>
                orders?.[0]
                  ? router.replace({ pathname: '/commandes/[id]', params: { id: orders[0].id } })
                  : router.replace(commandesHref)
              }
            />
          </>
        ) : null}
        {status === 'failed' || status === 'expired' ? (
          <>
            <Txt variant="h1" align="center">
              Paiement {status === 'expired' ? 'expiré' : 'échoué'}
            </Txt>
            <Txt variant="body" color={colors.textMuted} align="center">
              {pay.data?.payment.message || 'Réessaie depuis le panier.'}
            </Txt>
            <Button title="Retour au panier" onPress={() => router.replace('/panier')} />
          </>
        ) : null}
      </View>
    </Screen>
  );
}
