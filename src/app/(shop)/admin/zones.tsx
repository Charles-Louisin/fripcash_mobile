import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';

import { Badge, Button, Card, Input, Screen, ScreenHeader, toast, Txt } from '@/components/ui';
import { createZone, deleteZone, errorMessage, fetchZones, updateZone } from '@/lib/api';

export default function AdminZones() {
  const client = useQueryClient();
  const zones = useQuery({ queryKey: ['admin', 'zones'], queryFn: fetchZones });
  const [name, setName] = useState('');
  const refresh = () => client.invalidateQueries({ queryKey: ['admin', 'zones'] });
  const add = useMutation({
    mutationFn: () => {
      const label = name.trim();
      const code = label
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
        .slice(0, 32);
      return createZone({ code: code || `ZONE_${Date.now()}`, nameFr: label, nameEn: label });
    },
    onSuccess: () => {
      setName('');
      toast.success('Zone créée');
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <Screen keyboard>
      <ScreenHeader title="Zones" />
      <View style={{ gap: 10, marginBottom: 16 }}>
        <Input label="Nom de la zone" value={name} onChangeText={setName} placeholder="Ratoma" />
        <Button title="Ajouter la zone" onPress={() => add.mutate()} loading={add.isPending} disabled={!name.trim()} />
      </View>
      {(zones.data ?? []).map((zone) => (
        <Card key={zone.id} style={{ marginBottom: 10, gap: 8 }}>
          <Txt variant="bodyStrong">{zone.nameFr}</Txt>
          <Badge label={zone.isActive === false ? 'Inactive' : 'Active'} tone={zone.isActive === false ? 'neutral' : 'success'} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button
              title={zone.isActive === false ? 'Activer' : 'Désactiver'}
              size="sm"
              variant="secondary"
              onPress={() =>
                updateZone(zone.id, { isActive: zone.isActive === false })
                  .then(refresh)
                  .catch((e) => toast.error(errorMessage(e)))
              }
            />
            <Button
              title="Supprimer"
              size="sm"
              variant="danger"
              onPress={() => deleteZone(zone.id).then(refresh).catch((e) => toast.error(errorMessage(e)))}
            />
          </View>
        </Card>
      ))}
    </Screen>
  );
}
