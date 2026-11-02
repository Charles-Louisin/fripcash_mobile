import { router, useLocalSearchParams } from 'expo-router';
import { commandesHref, homeHref } from '@/lib/nav';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { Button, Loading, Screen, ScreenHeader, toast, Txt } from '@/components/ui';
import { errorMessage, fetchPayment, verifyPayment } from '@/lib/api';
import { formatGnf } from '@/lib/format';
import { colors } from '@/theme';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/hooks/queries';

const UNPAID = new Set(['failed', 'expired', 'canceled']);

export default function PaiementScreen() {
  const { ref, cancel } = useLocalSearchParams<{ ref: string; cancel?: string }>();
  const client = useQueryClient();
  const [checking, setChecking] = useState(false);
  const pay = useQuery({
    queryKey: ['payment', ref],
    queryFn: () => fetchPayment(ref),
    enabled: !!ref,
    // Le serveur vérifie lui-même auprès du prestataire : le retour du navigateur ne vaut pas preuve.
    refetchInterval: (q) => (q.state.data?.payment.status === 'pending' ? 3000 : false),
  });
  const payment = pay.data?.payment;
  const status = payment?.status;
  const orders = pay.data?.orders;
  const multi = (orders?.length ?? 0) > 1;
  const firstOrder = orders?.[0];
  const hosted = payment?.provider === 'chapchappay';

  useEffect(() => {
    if (status === 'success') {
      client.invalidateQueries({ queryKey: qk.cart });
      client.invalidateQueries({ queryKey: ['orders'] });
    }
  }, [status, client]);

  useEffect(() => {
    if (status !== 'success' || !firstOrder) return;
    const t = setTimeout(() => {
      if (multi) router.replace(commandesHref);
      else router.replace({ pathname: '/commandes/[id]', params: { id: firstOrder.id } });
    }, 1200);
    return () => clearTimeout(t);
  }, [status, firstOrder, multi]);

  const openOrders = () => {
    if (multi || !firstOrder) router.replace(commandesHref);
    else router.replace({ pathname: '/commandes/[id]', params: { id: firstOrder.id } });
  };

  const resume = async () => {
    if (!payment?.paymentUrl) return;
    await WebBrowser.openAuthSessionAsync(payment.paymentUrl, Linking.createURL('paiement'));
    pay.refetch();
  };

  const checkNow = async () => {
    if (!ref) return;
    setChecking(true);
    try {
      const res = await verifyPayment(ref);
      client.setQueryData(['payment', ref], (prev: typeof pay.data) => (prev ? { ...prev, payment: res.payment } : prev));
      if (res.payment.status === 'pending') toast.info('Pas encore confirmé par l’opérateur. Réessaie dans un instant.');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setChecking(false);
    }
  };

  return (
    <Screen scroll={false} edges={['top', 'bottom']}>
      <ScreenHeader title="Paiement" onBack={() => router.replace(homeHref)} />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14, padding: 24 }}>
        {status === 'pending' || pay.isLoading ? (
          <>
            <Loading label="En attente de confirmation…" />
            <Txt variant="caption" align="center">
              {cancel
                ? 'Tu as quitté la page de paiement. Si tu as déjà validé sur ton téléphone, la confirmation peut arriver dans quelques instants.'
                : hosted
                  ? 'Valide le paiement sur ton téléphone si une demande Mobile Money apparaît. La confirmation arrive automatiquement.'
                  : 'Valide le paiement sur ton téléphone si une notification Mobile Money apparaît.'}
            </Txt>
            {payment?.message?.includes('réessayer') ? (
              <Txt variant="caption" align="center" color={colors.error}>
                {payment.message}
              </Txt>
            ) : null}
            {hosted && payment?.paymentUrl ? (
              <View style={{ gap: 10, alignSelf: 'stretch' }}>
                <Button title="Reprendre le paiement" onPress={resume} full />
                <Button title="J’ai payé, vérifier" variant="secondary" onPress={checkNow} loading={checking} full />
              </View>
            ) : null}
          </>
        ) : null}
        {status === 'success' ? (
          <>
            <Txt variant="h1" align="center">
              Paiement confirmé
            </Txt>
            <Txt variant="body" color={colors.textMuted} align="center">
              {formatGnf(payment?.amountGnf)} reçus. Chaque vendeur sera payé après ta confirmation de réception de son colis.
            </Txt>
            {multi ? (
              <Txt variant="caption" align="center">
                {orders?.length} commandes séparées par vendeur : chaque pack garde sa propre livraison et sa propre discussion.
              </Txt>
            ) : null}
            <Button title={multi ? 'Voir mes commandes' : 'Voir la commande'} onPress={openOrders} />
          </>
        ) : null}
        {status && UNPAID.has(status) ? (
          <>
            <Txt variant="h1" align="center">
              Paiement {status === 'expired' ? 'expiré' : status === 'canceled' ? 'annulé' : 'échoué'}
            </Txt>
            <Txt variant="body" color={colors.textMuted} align="center">
              {payment?.message || 'Aucun montant n’a été prélevé. Réessaie depuis le panier.'}
            </Txt>
            <Button title="Retour au panier" onPress={() => router.replace('/panier')} />
          </>
        ) : null}
        {status === 'refunded' || status === 'partially_refunded' ? (
          <>
            <Txt variant="h1" align="center">
              {status === 'refunded' ? 'Paiement remboursé' : 'Remboursement partiel'}
            </Txt>
            <Button title="Voir mes commandes" onPress={openOrders} />
          </>
        ) : null}
      </View>
    </Screen>
  );
}
