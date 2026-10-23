import { Platform } from 'react-native';

export type FontTokens = {
  light: string;
  regular: string;
  medium: string;
  semibold: string;
  bold: string;
  display: string;
  displayBold: string;
};

/** Polices natives du téléphone — aucun .ttf embarqué ni téléchargé. */
export const systemFonts: FontTokens = Platform.select({
  ios: {
    light: 'System',
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
    display: 'Georgia',
    displayBold: 'Georgia',
  },
  android: {
    light: 'sans-serif-light',
    regular: 'sans-serif',
    medium: 'sans-serif-medium',
    semibold: 'sans-serif-medium',
    bold: 'sans-serif-black',
    display: 'serif',
    displayBold: 'serif',
  },
  default: {
    light: 'System',
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
    display: 'serif',
    displayBold: 'serif',
  },
})!;

export const fonts: FontTokens = systemFonts;
