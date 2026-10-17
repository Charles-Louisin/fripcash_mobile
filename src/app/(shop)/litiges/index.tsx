import { router } from 'expo-router';
import { View } from 'react-native';

import { Badge, Card, EmptyState, Screen, ScreenHeader, Txt } from '@/components/ui';
import { useDisputes } from '@/hooks/queries';
import { formatRelative } from '@/lib/format';

const LABELS = { open: 'Ouvert', under_review: 'En examen', resolved: 'Résolu', closed: 'Clos' } as const;

export default function LitigesScreen() {
  const disputes = useDisputes();
  return (
    <Screen refreshing={disputes.isRefetching} onRefresh={() => disputes.refetch()}>
      <ScreenHeader title="Litiges" />
      {!(disputes.data ?? []).length ? (
        <EmptyState icon="alert-circle-outline" title="Aucun litige" />
      ) : (
        <View style={{ gap: 10 }}>
          {(disputes.data ?? []).map((d) => {
            const last = d.messages[d.messages.length - 1];
            return (
              <Card key={d.id} onPress={() => router.push({ pathname: '/litiges/[id]', params: { id: d.id } })}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                  <Txt variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                    {d.productTitle || d.reason}
                  </Txt>
                  <Badge
                    label={LABELS[d.status]}
                    tone={d.status === 'open' || d.status === 'under_review' ? 'warning' : d.status === 'resolved' ? 'success' : 'neutral'}
                  />
                </View>
                <Txt variant="caption" numberOfLines={2}>
                  {last ? `${last.fromAdmin ? 'Équipe FripCash' : last.senderName} : ${last.body || 'Pièce jointe'}` : d.reason}
                </Txt>
                <Txt variant="small">
                  {d.buyerName} · {d.sellerName} · {formatRelative(last?.createdAt ?? d.createdAt)}
                </Txt>
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
