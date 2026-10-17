import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, ErrorState, Input, Screen, ScreenHeader, Skeleton, toast } from '@/components/ui';
import { errorMessage, fetchPlatformSettings, updatePlatformSettings, type PlatformSettings } from '@/lib/api';

const percent = (rate?: number) => String(Math.round((rate || 0) * 10000) / 100);

function SettingsForm({ initial }: { initial: PlatformSettings }) {
  const client = useQueryClient();
  const [standard, setStandard] = useState(() => percent(initial.commissionRateStandard));
  const [proximite, setProximite] = useState(() => percent(initial.commissionRateProximite));
  const [windowHours, setWindowHours] = useState(() => String(initial.disputeWindowHours ?? ''));
  const [maintenance, setMaintenance] = useState(() => !!initial.maintenanceMode);

  const save = useMutation({
    mutationFn: () =>
      updatePlatformSettings({
        commissionRateStandard: Number(standard.replace(',', '.')) / 100,
        commissionRateProximite: Number(proximite.replace(',', '.')) / 100,
        disputeWindowHours: Number(windowHours) || undefined,
        maintenanceMode: maintenance,
      }),
    onSuccess: () => {
      toast.success('Paramètres enregistrés');
      client.invalidateQueries({ queryKey: ['admin', 'settings'] });
      client.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <View style={{ gap: 12 }}>
      <Input label="Commission standard (%)" value={standard} onChangeText={setStandard} keyboardType="decimal-pad" />
      <Input label="Commission proximité (%)" value={proximite} onChangeText={setProximite} keyboardType="decimal-pad" />
      <Input label="Fenêtre de litige (heures)" value={windowHours} onChangeText={setWindowHours} keyboardType="number-pad" />
      <Button
        title={maintenance ? 'Maintenance activée' : 'Maintenance désactivée'}
        variant={maintenance ? 'danger' : 'secondary'}
        onPress={() => setMaintenance((v) => !v)}
      />
      <Button title="Enregistrer" onPress={() => save.mutate()} loading={save.isPending} full />
    </View>
  );
}

export default function AdminSettings() {
  const settings = useQuery({ queryKey: ['admin', 'settings'], queryFn: fetchPlatformSettings });

  return (
    <Screen keyboard>
      <ScreenHeader title="Paramètres" subtitle={settings.data?.platformName || 'FripCash'} />
      {settings.isLoading ? (
        <View style={{ gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={52} radius={12} />
          ))}
        </View>
      ) : settings.isError || !settings.data ? (
        <ErrorState error={settings.error} onRetry={() => settings.refetch()} />
      ) : (
        <SettingsForm key={settings.dataUpdatedAt} initial={settings.data} />
      )}
    </Screen>
  );
}
