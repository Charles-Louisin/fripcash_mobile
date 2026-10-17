import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { BarChart, Card, Screen, Txt } from '@/components/ui';
import { useCourierGains, useCourierMe } from '@/hooks/queries';
import { formatGnf, formatMonthYear } from '@/lib/format';
import { colors, radius } from '@/theme';

export default function GainsScreen() {
  const gains = useCourierGains();
  const me = useCourierMe();
  const data = gains.data;
  const [now] = useState(() => Date.now());
  const todayLabel = useMemo(() => new Date(now).toDateString(), [now]);
  const chart = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of data?.entries ?? []) {
      if (!e.isCredit) continue;
      const d = new Date(e.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      map.set(key, (map.get(key) ?? 0) + e.amountGnf);
    }
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      return {
        label: formatMonthYear(d).slice(0, 4),
        value: map.get(key) ?? 0,
        highlight: i === 5,
      };
    });
  }, [data]);

  const week = (data?.entries ?? [])
    .filter((e) => e.isCredit && now - new Date(e.createdAt).getTime() < 7 * 86400000)
    .reduce((s, e) => s + e.amountGnf, 0);
  const today = (data?.entries ?? [])
    .filter((e) => e.isCredit && new Date(e.createdAt).toDateString() === todayLabel)
    .reduce((s, e) => s + e.amountGnf, 0);

  return (
    <Screen>
      <Txt variant="h1" style={{ marginBottom: 10 }}>
        Mes gains
      </Txt>
      <Card style={{ backgroundColor: colors.dark, marginBottom: 14, borderRadius: radius.xl }}>
        <Txt variant="caption" color={colors.onDarkMuted}>
          Cette semaine
        </Txt>
        <Txt variant="display" weight="bold" color={colors.onDark}>
          {formatGnf(week)}
        </Txt>
        <Txt variant="caption" color={colors.onDarkMuted}>
          Versé sur ton Mobile Money
        </Txt>
        <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
          <View>
            <Txt variant="caption" color={colors.onDarkMuted}>
              Gains du jour
            </Txt>
            <Txt variant="title" weight="bold" color={colors.onDark}>
              {formatGnf(today)}
            </Txt>
          </View>
          <View>
            <Txt variant="caption" color={colors.onDarkMuted}>
              Total versé
            </Txt>
            <Txt variant="title" weight="bold" color={colors.onDark}>
              {formatGnf(data?.availableGnf ?? me.data?.stats.availableGnf)}
            </Txt>
          </View>
        </View>
      </Card>

      <Txt variant="h3" style={{ marginBottom: 8 }}>
        Historique des gains
      </Txt>
      <Card>
        <BarChart data={chart} />
      </Card>
    </Screen>
  );
}
