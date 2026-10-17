import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Button, Card, Chip, EmptyState, IconButton, Input, Screen, ScreenHeader, toast, Txt } from '@/components/ui';
import { errorMessage, fetchAdminTariffs, fetchZones, saveAdminTariffs, type AdminTariff } from '@/lib/api';
import { formatGnf } from '@/lib/format';
import { colors } from '@/theme';

type Item = Pick<AdminTariff, 'fromZoneId' | 'toZoneId' | 'amountGnf'>;

const toItems = (rows: AdminTariff[]): Item[] =>
  rows.map((row) => ({ fromZoneId: row.fromZoneId, toZoneId: row.toZoneId, amountGnf: row.amountGnf }));

export default function AdminTariffs() {
  const client = useQueryClient();
  const tariffs = useQuery({ queryKey: ['admin', 'tariffs'], queryFn: fetchAdminTariffs });
  const zones = useQuery({ queryKey: ['admin', 'zones'], queryFn: fetchZones });
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const name = (id: string) => zones.data?.find((z) => z.id === id)?.nameFr || 'Zone supprimée';
  const save = useMutation({
    mutationFn: (items: Item[]) => saveAdminTariffs(items),
    onSuccess: () => {
      toast.success('Tarifs enregistrés');
      setDrafts({});
      client.invalidateQueries({ queryKey: ['admin', 'tariffs'] });
      client.invalidateQueries({ queryKey: ['catalog', 'tariffs'] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const rows = tariffs.data ?? [];
  const parse = (raw: string) => Number(raw.replace(/\s/g, ''));

  const commit = (row: AdminTariff) => {
    const value = parse(drafts[row.id] ?? String(row.amountGnf));
    if (!Number.isFinite(value) || value < 0) return toast.error('Montant invalide.');
    save.mutate(toItems(rows).map((item, i) => (rows[i].id === row.id ? { ...item, amountGnf: value } : item)));
  };

  const remove = (row: AdminTariff) => save.mutate(toItems(rows.filter((r) => r.id !== row.id)));

  const add = () => {
    const value = parse(amount);
    if (!from || !to) return toast.error('Choisis la zone de départ et d’arrivée.');
    if (!Number.isFinite(value) || value < 0) return toast.error('Montant invalide.');
    const others = toItems(rows).filter((item) => !(item.fromZoneId === from && item.toZoneId === to));
    save.mutate([...others, { fromZoneId: from, toZoneId: to, amountGnf: value }], {
      onSuccess: () => {
        setAmount('');
        setFrom(null);
        setTo(null);
      },
    });
  };

  const zoneChips = (value: string | null, onChange: (id: string) => void) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {(zones.data ?? []).map((z) => (
        <Chip key={z.id} label={z.nameFr} active={value === z.id} onPress={() => onChange(z.id)} />
      ))}
    </ScrollView>
  );

  return (
    <Screen keyboard refreshing={tariffs.isRefetching} onRefresh={() => tariffs.refetch()}>
      <ScreenHeader title="Tarifs livraison" subtitle={`${rows.length} trajet(s) configuré(s)`} />

      <Card style={{ marginBottom: 16, gap: 10 }}>
        <Txt variant="bodyStrong">Ajouter ou remplacer un trajet</Txt>
        {!(zones.data ?? []).length ? (
          <Txt variant="caption">Crée d’abord des zones dans le menu Zones.</Txt>
        ) : (
          <>
            <Txt variant="small">Départ</Txt>
            {zoneChips(from, setFrom)}
            <Txt variant="small">Arrivée</Txt>
            {zoneChips(to, setTo)}
            <Input label="Prix (GNF)" value={amount} onChangeText={setAmount} keyboardType="number-pad" placeholder="15000" />
            <Button title="Enregistrer le trajet" onPress={add} loading={save.isPending} disabled={!from || !to || !amount.trim()} full />
          </>
        )}
      </Card>

      {tariffs.isLoading ? <Txt variant="caption">Chargement…</Txt> : null}
      {!tariffs.isLoading && !rows.length ? <EmptyState icon="pricetag-outline" title="Aucun tarif" message="Ajoute un premier trajet ci-dessus." /> : null}
      {rows.map((row) => (
        <Card key={row.id} style={{ marginBottom: 10, gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Txt variant="bodyStrong">
                {name(row.fromZoneId)} › {name(row.toZoneId)}
              </Txt>
              <Txt variant="caption">Actuel : {formatGnf(row.amountGnf)}</Txt>
            </View>
            <IconButton icon="trash-outline" label="Supprimer le trajet" color={colors.error} onPress={() => remove(row)} />
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Input
              value={drafts[row.id] ?? String(row.amountGnf)}
              onChangeText={(value) => setDrafts((prev) => ({ ...prev, [row.id]: value }))}
              keyboardType="number-pad"
              containerStyle={{ flex: 1 }}
            />
            <Button
              title="Enregistrer"
              size="sm"
              onPress={() => commit(row)}
              loading={save.isPending}
              disabled={drafts[row.id] == null || parse(drafts[row.id]) === row.amountGnf}
            />
          </View>
        </Card>
      ))}
    </Screen>
  );
}
