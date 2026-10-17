import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Line, Path, Stop, Text as SvgText } from 'react-native-svg';

import { Txt } from '@/components/ui';
import { formatNumber } from '@/lib/format';
import { colors, fonts } from '@/theme';

export const CHART_COLORS = [colors.primary, colors.gold, colors.sage, '#8C6A5D', '#D9A38C', colors.textSubtle];

type Series = { key: string; label: string; color: string };

function shortDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

/** Regroupe des points quotidiens en au plus `max` paquets pour rester lisible sur mobile. */
export function bucket<T extends { date: string }>(rows: T[], keys: (keyof T)[], max = 12): T[] {
  if (rows.length <= max) return rows;
  const size = Math.ceil(rows.length / max);
  const out: T[] = [];
  for (let i = 0; i < rows.length; i += size) {
    const chunk = rows.slice(i, i + size);
    const merged = { ...chunk[chunk.length - 1] };
    for (const k of keys) {
      (merged as Record<string, unknown>)[k as string] = chunk.reduce((s, r) => s + (Number(r[k]) || 0), 0);
    }
    out.push(merged);
  }
  return out;
}

export function AreaChart<T extends { date: string }>({
  data,
  series,
  height = 210,
}: {
  data: T[];
  series: Series[];
  height?: number;
}) {
  const [width, setWidth] = useState(0);
  const left = 54;
  const bottom = 22;
  const top = 8;
  const chartH = height - bottom - top;
  const values = data.flatMap((d) => series.map((s) => Number((d as Record<string, unknown>)[s.key]) || 0));
  const max = Math.max(1, ...values);
  const step = data.length > 1 ? (width - left - 6) / (data.length - 1) : 0;
  const x = (i: number) => left + step * i;
  const y = (v: number) => top + chartH - (v / max) * chartH;
  const ticks = [0, 0.5, 1];
  const labelEvery = Math.max(1, Math.ceil(data.length / 4));

  return (
    <View>
      <View onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)} style={{ height }}>
        {width > 0 && data.length ? (
          <Svg width={width} height={height}>
            <Defs>
              {series.map((s) => (
                <LinearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={s.color} stopOpacity={0.35} />
                  <Stop offset="1" stopColor={s.color} stopOpacity={0.02} />
                </LinearGradient>
              ))}
            </Defs>
            {ticks.map((t) => (
              <Line key={t} x1={left} x2={width} y1={y(max * t)} y2={y(max * t)} stroke={colors.borderSoft} strokeWidth={1} />
            ))}
            {ticks.map((t) => (
              <SvgText key={`l${t}`} x={0} y={y(max * t) + 4} fontSize={10} fill={colors.textMuted} fontFamily={fonts.medium}>
                {formatNumber(max * t)}
              </SvgText>
            ))}
            {series.map((s) => {
              const pts = data.map((d, i) => `${x(i)},${y(Number((d as Record<string, unknown>)[s.key]) || 0)}`);
              const line = `M${pts.join(' L')}`;
              const area = `${line} L${x(data.length - 1)},${top + chartH} L${x(0)},${top + chartH} Z`;
              return (
                <Path key={s.key} d={area} fill={`url(#fill-${s.key})`} stroke={s.color} strokeWidth={2} />
              );
            })}
            {data.map((d, i) =>
              i % labelEvery === 0 ? (
                <SvgText
                  key={d.date}
                  x={x(i)}
                  y={height - 4}
                  fontSize={10}
                  fill={colors.textMuted}
                  fontFamily={fonts.medium}
                  textAnchor="middle">
                  {shortDate(d.date)}
                </SvgText>
              ) : null
            )}
          </Svg>
        ) : null}
      </View>
      <Legend items={series.map((s) => ({ label: s.label, color: s.color }))} />
    </View>
  );
}

export function DonutChart({
  data,
  size = 150,
  thickness = 22,
  centerLabel,
  centerValue,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const total = data.reduce((s, d) => s + d.value, 0);
  let offset = 0;

  return (
    <View style={{ alignItems: 'center', gap: 12 }}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.surfaceMuted} strokeWidth={thickness} fill="none" />
          {total > 0
            ? data.map((d) => {
                const len = (d.value / total) * c;
                const node = (
                  <Circle
                    key={d.label}
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    stroke={d.color}
                    strokeWidth={thickness}
                    fill="none"
                    strokeDasharray={`${len} ${c - len}`}
                    strokeDashoffset={c / 4 - offset}
                  />
                );
                offset += len;
                return node;
              })
            : null}
        </Svg>
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
          {centerValue ? <Txt variant="h3">{centerValue}</Txt> : null}
          {centerLabel ? <Txt variant="small">{centerLabel}</Txt> : null}
        </View>
      </View>
      <Legend items={data.map((d) => ({ label: `${d.label} · ${formatNumber(d.value)}`, color: d.color }))} />
    </View>
  );
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 6 }}>
      {items.map((item) => (
        <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: item.color }} />
          <Txt variant="small">{item.label}</Txt>
        </View>
      ))}
    </View>
  );
}
