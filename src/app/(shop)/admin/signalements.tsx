import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { View } from 'react-native';

import { Badge, Button, Card, EmptyState, Screen, ScreenHeader, toast, Txt } from '@/components/ui';
import { errorMessage, fetchAdminReports, resolveAdminReport } from '@/lib/api';

export default function AdminReports() {
  const client = useQueryClient();
  const list = useQuery({ queryKey: ['admin', 'reports'], queryFn: fetchAdminReports });
  const resolve = useMutation({
    mutationFn: resolveAdminReport,
    onSuccess: () => {
      toast.success('Signalement traité');
      client.invalidateQueries({ queryKey: ['admin', 'reports'] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <Screen>
      <ScreenHeader title="Signalements" />
      {list.isLoading ? <Txt variant="caption">Chargement…</Txt> : null}
      {!list.isLoading && !(list.data ?? []).length ? <EmptyState title="Aucun signalement" /> : null}
      {(list.data ?? []).map((row) => (
        <Card key={row.id} style={{ marginBottom: 10, gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Txt variant="bodyStrong" style={{ flex: 1 }}>{row.target}</Txt>
            <Badge label={row.status} />
          </View>
          <Txt variant="caption">{row.reason} · {row.reporterName}</Txt>
          {row.status !== 'resolved' ? <Button title="Marquer traité" size="sm" onPress={() => resolve.mutate(row.id)} /> : null}
        </Card>
      ))}
    </Screen>
  );
}
