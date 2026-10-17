import { useQuery } from '@tanstack/react-query';

import { BarChart, Card, Screen, ScreenHeader, Txt } from '@/components/ui';
import { fetchAdminStats } from '@/lib/api';
import { formatGnf, formatNumber } from '@/lib/format';

export default function AdminReports() {
  const stats = useQuery({ queryKey: ['admin', 'stats', 'reports'], queryFn: () => fetchAdminStats(30) });
  const data = stats.data;
  return (
    <Screen>
      <ScreenHeader title="Rapports" subtitle="30 derniers jours" />
      {stats.isLoading || !data ? <Txt variant="caption">Chargement…</Txt> : null}
      {data ? (
        <>
          <Card style={{ marginBottom: 12, gap: 4 }}>
            <Txt variant="bodyStrong">Volume</Txt>
            <Txt variant="caption">GMV {formatGnf(data.gmv)}</Txt>
            <Txt variant="caption">Commissions {formatGnf(data.totalRevenue)}</Txt>
            <Txt variant="caption">Livraison {formatGnf(data.gmvCourier)} · retrait {formatGnf(data.gmvPickup)}</Txt>
            <Txt variant="caption">{formatNumber(data.totalUsers)} utilisateurs · {formatNumber(data.totalListings)} articles</Txt>
          </Card>
          <Card>
            <Txt variant="bodyStrong" style={{ marginBottom: 8 }}>Catalogue par catégorie</Txt>
            <BarChart data={(data.categoryChart ?? []).slice(0, 6).map((row) => ({ label: row.category.slice(0, 8), value: row.volume }))} />
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
