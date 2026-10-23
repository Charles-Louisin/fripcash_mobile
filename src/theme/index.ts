import { Platform } from 'react-native';

export {
  fonts,
  systemFonts,
  type FontTokens,
} from '@/theme/fonts';

export const colors = {
  primary: '#BC5C40',
  primaryDark: '#A94E35',
  primarySoft: '#F6E4DA',
  background: '#FFFAF6',
  surface: '#FFFFFF',
  surfaceMuted: '#F8EEE6',
  secondary: '#F8EEE6',
  text: '#2B1714',
  textMuted: '#8D7D76',
  textSubtle: '#B9A9A0',
  border: '#F0E4DC',
  borderSoft: '#F3E8E1',
  error: '#A32E28',
  errorSoft: '#F8E1DF',
  success: '#54A968',
  successSoft: '#E3F0E6',
  warning: '#C6853A',
  warningSoft: '#F8ECDC',
  sage: '#6E8A72',
  gold: '#C6985A',
  star: '#F3B51B',
  dark: '#2B1A15',
  darkSoft: '#3B2621',
  darkMuted: '#4A332C',
  onDark: '#FBF5F1',
  onDarkMuted: '#C9B5AB',
  overlay: 'rgba(46, 33, 28, 0.55)',
  white: '#FFFFFF',
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
};

export const shadow = Platform.select({
  ios: {
    shadowColor: '#5A3526',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  default: { elevation: 2 },
});
