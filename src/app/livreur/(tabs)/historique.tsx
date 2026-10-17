import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card, EmptyState, Screen, Txt } from '@/components/ui';
import { useCourierGains, useMyMissions, useZones } from '@/hooks/queries';
import { DONE_STATUSES } from '@/lib/domain';
import { formatGnf, formatRelative, shortOrderId } from '@/lib/format';
import { colors, radius } from '@/theme';

export default function HistoriqueLivreurScreen() {
  const missions = useMyMissions();
  const gains = useCourierGains();
  const zones = useZones();
  const done = (missions.data ?? []).filter((o) => DONE_STATUSES.includes(o.status));
  const zoneName = (id?: string | null) => zones.data?.find((z) => z.id === id)?.nameFr || '—';

  return (
    <Screen>
      <Txt variant="h1">Historique</Txt>
      <Txt variant="caption" style={{ marginBottom: 14 }}>
        Toutes tes courses terminées.
      </Txt>
      <Card style={{ backgroundColor: colors.dark, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-around' }}>
        <View>
          <Txt variant="caption" color={colors.onDarkMuted}>
            Livraisons
          </Txt>
          <Txt variant="h2" color={colors.onDark}>
            {gains.data?.deliveredCount ?? done.length}
          </Txt>
        </View>
        <View>
          <Txt variant="caption" color={colors.onDarkMuted}>
            Total gagné
          </Txt>
          <Txt variant="h2" color={colors.onDark}>
            {formatGnf(gains.data?.totalFeesGnf)}
          </Txt>
        </View>
      </Card>

      {!done.length ? (
        <EmptyState icon="time-outline" title="Pas encore de course terminée" />
      ) : (
        <View style={{ gap: 8 }}>
          {done.map((o) => (
            <Pressable
              key={o.id}
              onPress={() => router.push({ pathname: '/livreur/mission/[id]', params: { id: o.id } })}
              style={styles.row}>
              <View style={{ flex: 1 }}>
                <Txt variant="bodyStrong">{shortOrderId(o.id)}</Txt>
                <Txt variant="caption">
                  {formatRelative(o.updatedAt)} · {zoneName(o.pickupZoneId)}
                </Txt>
              </View>
              <Txt variant="title" color={colors.primary}>
                +{formatGnf(o.shippingCostGnf)}
              </Txt>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
});
