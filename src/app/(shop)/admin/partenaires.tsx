import { useQuery } from '@tanstack/react-query';

import { Badge, Card, EmptyState, Screen, ScreenHeader, Txt } from '@/components/ui';
import { fetchAdminPartners } from '@/lib/api';

export default function AdminPartners() {
  const list = useQuery({ queryKey: ['admin', 'partners'], queryFn: fetchAdminPartners });
  return (
    <Screen>
      <ScreenHeader title="Enseignes" subtitle="Partenaires et comptes enseigne" />
      {list.isLoading ? <Txt variant="caption">Chargement…</Txt> : null}
      {!list.isLoading && !(list.data ?? []).length ? <EmptyState title="Aucune enseigne" /> : null}
      {(list.data ?? []).map((row) => (
        <Card key={`${row.kind}-${row.id}`} style={{ marginBottom: 10, gap: 4 }}>
          <Txt variant="bodyStrong">{row.name}</Txt>
          <Txt variant="caption">{row.contactEmail || row.kind || 'enseigne'}</Txt>
          <Badge label={row.status || row.note || '—'} tone={row.status === 'active' ? 'success' : 'warning'} />
        </Card>
      ))}
    </Screen>
  );
}
