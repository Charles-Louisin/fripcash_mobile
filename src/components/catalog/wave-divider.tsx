import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme';

export function WaveDivider({
  width,
  height = 34,
  color = colors.white,
}: {
  width: number;
  height?: number;
  color?: string;
}) {
  const w = Math.max(width, 1);
  const h = height;
  const fill = [
    `M0 ${h * 0.52}`,
    `C ${w * 0.1} ${h * 0.98}, ${w * 0.2} ${h * 0.06}, ${w * 0.34} ${h * 0.4}`,
    `C ${w * 0.48} ${h * 0.78}, ${w * 0.58} ${h * 0.02}, ${w * 0.72} ${h * 0.46}`,
    `C ${w * 0.84} ${h * 0.84}, ${w * 0.92} ${h * 0.18}, ${w} ${h * 0.5}`,
    `L ${w} ${h} L 0 ${h} Z`,
  ].join(' ');
  const crest = [
    `M0 ${h * 0.52}`,
    `C ${w * 0.1} ${h * 0.98}, ${w * 0.2} ${h * 0.06}, ${w * 0.34} ${h * 0.4}`,
    `C ${w * 0.48} ${h * 0.78}, ${w * 0.58} ${h * 0.02}, ${w * 0.72} ${h * 0.46}`,
    `C ${w * 0.84} ${h * 0.84}, ${w * 0.92} ${h * 0.18}, ${w} ${h * 0.5}`,
  ].join(' ');

  return (
    <View style={[styles.wrap, { width: w, height: h }]} pointerEvents="none">
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Path d={crest} stroke={colors.primarySoft} strokeWidth={3} fill="none" strokeLinecap="round" />
        <Path d={fill} fill={color} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
