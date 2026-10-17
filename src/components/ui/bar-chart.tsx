import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';

import { formatNumber } from '@/lib/format';
import { colors, fonts } from '@/theme';

export type BarPoint = { label: string; value: number; highlight?: boolean };

export function BarChart({ data, height = 190 }: { data: BarPoint[]; height?: number }) {
  const [width, setWidth] = useState(0);
  const max = Math.max(1, ...data.map((d) => d.value));
  const left = 52;
  const bottom = 22;
  const chartH = height - bottom - 8;
  const slot = data.length ? (width - left) / data.length : 0;
  const barW = Math.min(30, slot * 0.55);
  const ticks = [0, 0.33, 0.66, 1];

  return (
    <View onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)} style={{ height }}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          {ticks.map((t) => {
            const y = 8 + chartH - chartH * t;
            return (
              <Line key={t} x1={left} x2={width} y1={y} y2={y} stroke={colors.borderSoft} strokeWidth={1} />
            );
          })}
          {ticks.map((t) => {
            const y = 8 + chartH - chartH * t;
            return (
              <SvgText key={`l${t}`} x={0} y={y + 4} fontSize={10} fill={colors.textMuted} fontFamily={fonts.medium}>
                {formatNumber(max * t)}
              </SvgText>
            );
          })}
          {data.map((d, i) => {
            const h = Math.max(3, (d.value / max) * chartH);
            const x = left + slot * i + (slot - barW) / 2;
            return (
              <Rect
                key={d.label + i}
                x={x}
                y={8 + chartH - h}
                width={barW}
                height={h}
                rx={5}
                fill={d.highlight ? colors.primary : colors.primarySoft}
              />
            );
          })}
          {data.map((d, i) => (
            <SvgText
              key={`x${d.label}${i}`}
              x={left + slot * i + slot / 2}
              y={height - 4}
              fontSize={10}
              fill={colors.textMuted}
              textAnchor="middle"
              fontFamily={fonts.semibold}>
              {d.label}
            </SvgText>
          ))}
        </Svg>
      ) : null}
    </View>
  );
}
