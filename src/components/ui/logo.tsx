import { StyleSheet, View } from 'react-native';
import Svg, { Path, Rect, Text as SvgText } from 'react-native-svg';

import { colors, fonts } from '@/theme';

import { Txt } from './text';

export function LogoMark({ size = 30, color = colors.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Path d="M11 10V8a5 5 0 0 1 10 0v2" stroke={color} strokeWidth={2.4} fill="none" strokeLinecap="round" />
      <Rect x={4} y={10} width={24} height={20} rx={4} fill={color} />
      <SvgText x={16} y={25.5} fontSize={13} fontWeight="bold" fill={colors.white} textAnchor="middle">
        F
      </SvgText>
    </Svg>
  );
}

export function Logo({ size = 28, light }: { size?: number; light?: boolean }) {
  return (
    <View style={styles.row}>
      <LogoMark size={size} color={light ? colors.white : colors.primary} />
      <Txt style={{ fontFamily: fonts.displayBold, fontSize: size * 0.78, color: light ? colors.white : colors.primary }}>FripCash</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 7 },
});
