import { Text, type TextProps, type TextStyle } from 'react-native';

import { colors, fonts } from '@/theme';

type Variant = 'display' | 'h1' | 'h2' | 'h3' | 'title' | 'body' | 'bodyStrong' | 'caption' | 'label' | 'small';

const VARIANTS: Record<Variant, TextStyle> = {
  display: { fontFamily: fonts.displayBold, fontSize: 30, lineHeight: 36, color: colors.text },
  h1: { fontFamily: fonts.display, fontSize: 26, lineHeight: 32, color: colors.text },
  h2: { fontFamily: fonts.display, fontSize: 21, lineHeight: 27, color: colors.text },
  h3: { fontFamily: fonts.display, fontSize: 17, lineHeight: 23, color: colors.text },
  title: { fontFamily: fonts.display, fontSize: 15, lineHeight: 21, color: colors.text },
  body: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: colors.text },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: colors.text },
  caption: { fontFamily: fonts.medium, fontSize: 12.5, lineHeight: 17, color: colors.textMuted },
  label: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18, color: colors.text },
  small: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14, color: colors.textMuted },
};

export type TxtProps = TextProps & {
  variant?: Variant;
  color?: string;
  align?: TextStyle['textAlign'];
  weight?: keyof typeof fonts;
};

export function Txt({ variant = 'body', color, align, weight, style, ...rest }: TxtProps) {
  return (
    <Text
      {...rest}
      style={[
        VARIANTS[variant],
        color ? { color } : null,
        align ? { textAlign: align } : null,
        weight ? { fontFamily: fonts[weight] } : null,
        style,
      ]}
    />
  );
}
