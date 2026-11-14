import { Text, type TextProps, type TextStyle } from 'react-native';

import { fonts, colors, type FontTokens } from '@/theme';
import { fontScaleForScreen, MAX_FONT_MULTIPLIER } from '@/theme/responsive';

type Variant = 'display' | 'h1' | 'h2' | 'h3' | 'title' | 'body' | 'bodyStrong' | 'caption' | 'label' | 'small';

const BASE: Record<Variant, { family: keyof FontTokens; size: number; line: number; color: string }> = {
  display: { family: 'displayBold', size: 30, line: 36, color: colors.text },
  h1: { family: 'display', size: 26, line: 32, color: colors.text },
  h2: { family: 'display', size: 21, line: 27, color: colors.text },
  h3: { family: 'display', size: 17, line: 23, color: colors.text },
  title: { family: 'display', size: 15, line: 21, color: colors.text },
  body: { family: 'medium', size: 14, line: 20, color: colors.text },
  bodyStrong: { family: 'semibold', size: 14, line: 20, color: colors.text },
  caption: { family: 'medium', size: 12.5, line: 17, color: colors.textMuted },
  label: { family: 'semibold', size: 13, line: 18, color: colors.text },
  small: { family: 'semibold', size: 11, line: 14, color: colors.textMuted },
};

/** Styles calculés une seule fois par échelle (et non à chaque rendu de chaque texte). */
const cache = new Map<number, Record<Variant, TextStyle>>();
function variantsFor(scale: number) {
  let v = cache.get(scale);
  if (!v) {
    v = {} as Record<Variant, TextStyle>;
    for (const key of Object.keys(BASE) as Variant[]) {
      const b = BASE[key];
      // Les titres réduisent un peu plus que le corps de texte, qui doit rester lisible.
      const s = b.size >= 17 ? scale * scale : scale;
      v[key] = {
        fontFamily: fonts[b.family],
        fontSize: Math.round(b.size * s * 2) / 2,
        lineHeight: Math.round(b.line * s),
        color: b.color,
      };
    }
    cache.set(scale, v);
  }
  return v;
}

export type TxtProps = TextProps & {
  variant?: Variant;
  color?: string;
  align?: TextStyle['textAlign'];
  weight?: keyof FontTokens;
};

export function Txt({ variant = 'body', color, align, weight, style, maxFontSizeMultiplier, ...rest }: TxtProps) {
  return (
    <Text
      {...rest}
      // Grossissement système respecté, mais borné : au-delà, la page paraît « zoomée » et casse.
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? MAX_FONT_MULTIPLIER}
      style={[
        variantsFor(fontScaleForScreen())[variant],
        color ? { color } : null,
        align ? { textAlign: align } : null,
        weight ? { fontFamily: fonts[weight] } : null,
        style,
      ]}
    />
  );
}
