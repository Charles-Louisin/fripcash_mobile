import { Text, type TextProps, type TextStyle } from 'react-native';

import { fonts, colors, type FontTokens } from '@/theme';

type Variant = 'display' | 'h1' | 'h2' | 'h3' | 'title' | 'body' | 'bodyStrong' | 'caption' | 'label' | 'small';

function variants(f: FontTokens): Record<Variant, TextStyle> {
  return {
    display: { fontFamily: f.displayBold, fontSize: 30, lineHeight: 36, color: colors.text },
    h1: { fontFamily: f.display, fontSize: 26, lineHeight: 32, color: colors.text },
    h2: { fontFamily: f.display, fontSize: 21, lineHeight: 27, color: colors.text },
    h3: { fontFamily: f.display, fontSize: 17, lineHeight: 23, color: colors.text },
    title: { fontFamily: f.display, fontSize: 15, lineHeight: 21, color: colors.text },
    body: { fontFamily: f.medium, fontSize: 14, lineHeight: 20, color: colors.text },
    bodyStrong: { fontFamily: f.semibold, fontSize: 14, lineHeight: 20, color: colors.text },
    caption: { fontFamily: f.medium, fontSize: 12.5, lineHeight: 17, color: colors.textMuted },
    label: { fontFamily: f.semibold, fontSize: 13, lineHeight: 18, color: colors.text },
    small: { fontFamily: f.semibold, fontSize: 11, lineHeight: 14, color: colors.textMuted },
  };
}

export type TxtProps = TextProps & {
  variant?: Variant;
  color?: string;
  align?: TextStyle['textAlign'];
  weight?: keyof FontTokens;
};

export function Txt({ variant = 'body', color, align, weight, style, ...rest }: TxtProps) {
  const f = fonts;
  return (
    <Text
      {...rest}
      style={[
        variants(f)[variant],
        color ? { color } : null,
        align ? { textAlign: align } : null,
        weight ? { fontFamily: f[weight] } : null,
        style,
      ]}
    />
  );
}
