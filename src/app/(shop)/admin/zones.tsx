import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';

import { Badge, Button, Card, Input, Screen, ScreenHeader, toast, Txt } from '@/components/ui';
import { createZone, deleteZone, errorMessage, fetchZones, updateZone } from '@/lib/api';

export default function AdminZones() {
  const client = useQueryClient();
  const zones = useQuery({ queryKey: ['admin', 'zones'], queryFn: fetchZones });
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const refresh = () => client.invalidateQueries({ queryKey: ['admin', 'zones'] });
  const add = useMutation({
    mutationFn: () => createZone({ code: code.trim(), nameFr: name.trim(), nameEn: name.trim() }),
    onSuccess: () => {
      setCode('');
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
        <Input label="Code" value={code} onChangeText={setCode} placeholder="RAT" />
        <Input label="Nom" value={name} onChangeText={setName} placeholder="Ratoma" />
        <Button title="Ajouter la zone" onPress={() => add.mutate()} loading={add.isPending} disabled={!code.trim() || !name.trim()} />
      </View>
      {(zones.data ?? []).map((zone) => (
        <Card key={zone.id} style={{ marginBottom: 10, gap: 8 }}>
          <Txt variant="bodyStrong">{zone.nameFr}</Txt>
          <Txt variant="caption">{zone.code}</Txt>
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
