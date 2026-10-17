import { colors } from './index';

export const stackMotion = {
  headerShown: false,
  contentStyle: { backgroundColor: colors.background },
  animation: 'slide_from_right' as const,
  animationDuration: 340,
  gestureEnabled: true,
  fullScreenGestureEnabled: true,
  freezeOnBlur: true,
};

export const fadeMotion = {
  ...stackMotion,
  animation: 'fade' as const,
  animationDuration: 280,
};

export const sheetMotion = {
  ...stackMotion,
  animation: 'slide_from_bottom' as const,
  animationDuration: 380,
};
