import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Badge, Card, EmptyState, ErrorState, Input, Screen, ScreenHeader, Skeleton, Txt } from '@/components/ui';
import { fetchAdminWallets } from '@/lib/api';
import { formatGnf } from '@/lib/format';
import { colors } from '@/theme';

const KIND_LABEL: Record<string, string> = {
  particulier: 'Particulier',
  standard: 'Boutique',
  proximite: 'Commerce local',
  enseigne: 'Enseigne',
};

export default function AdminWalletsScreen() {
  const wallets = useQuery({ queryKey: ['admin', 'wallets'], queryFn: fetchAdminWallets });
  const [search, setSearch] = useState('');

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (wallets.data ?? []).filter(
      (w) => !needle || `${w.user?.name ?? ''} ${w.user?.email ?? ''} ${w.user?.phone ?? ''}`.toLowerCase().includes(needle)
    );
  }, [search, wallets.data]);
  const totalBalance = (wallets.data ?? []).reduce((s, w) => s + w.availableGnf, 0);
  const totalEscrow = (wallets.data ?? []).reduce((s, w) => s + w.reservedGnf, 0);

  return (
    <Screen keyboard refreshing={wallets.isRefetching} onRefresh={() => wallets.refetch()}>
      <ScreenHeader title="Porte-monnaies" subtitle="Soldes disponibles et fonds encore en séquestre" />

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
        <Card style={{ flex: 1 }}>
          <Txt variant="caption">Solde total vendeurs</Txt>
          <Txt variant="h3" style={{ marginTop: 4 }}>
            {formatGnf(totalBalance)}
          </Txt>
        </Card>
        <Card style={{ flex: 1 }}>
          <Txt variant="caption">Escrow en attente</Txt>
          <Txt variant="h3" color={colors.warning} style={{ marginTop: 4 }}>
            {formatGnf(totalEscrow)}
          </Txt>
        </Card>
      </View>

      <Input icon="search-outline" placeholder="Rechercher un vendeur" value={search} onChangeText={setSearch} />

      <View style={{ gap: 10, marginTop: 14 }}>
        {wallets.isLoading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} height={74} radius={14} />)
        ) : wallets.isError ? (
          <ErrorState error={wallets.error} onRetry={() => wallets.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState icon="wallet-outline" title="Aucun porte-monnaie" message="Les soldes vendeurs apparaîtront ici." />
        ) : (
          rows.map((w) => {
            const kind = w.user?.shopKind || w.user?.kind;
            return (
              <Card key={w.id} style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Txt variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                    {w.user?.name || w.userId}
                  </Txt>
                  {kind ? <Badge label={KIND_LABEL[kind] ?? kind} tone="neutral" /> : null}
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View>
                    <Txt variant="small">Solde</Txt>
                    <Txt variant="bodyStrong">{formatGnf(w.availableGnf)}</Txt>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Txt variant="small">Escrow</Txt>
                    <Txt variant="bodyStrong" color={colors.warning}>
                      {formatGnf(w.reservedGnf)}
                    </Txt>
                  </View>
                </View>
              </Card>
            );
          })
        )}
      </View>
    </Screen>
  );
}
