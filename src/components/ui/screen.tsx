import { usePathname } from 'expo-router';
import type { ReactNode } from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { isDashboardPath, useDashboardMenu } from '@/components/dashboard/dashboard-menu-context';
import { usePullRefresh } from '@/hooks/use-pull-refresh';
import { useKeyboardSpace } from '@/lib/keyboard-space';
import { goHome } from '@/lib/nav';
import { colors, shadow } from '@/theme';

import { IconButton } from './icon-button';
import { LazyMount, type SkeletonKind } from './lazy-page';
import { Txt } from './text';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  padded?: boolean;
  background?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  keyboard?: boolean;
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  lazy?: boolean;
  skeleton?: SkeletonKind;
};

export function Screen({
  children,
  scroll = true,
  edges = ['top'],
  padded = true,
  background = colors.background,
  refreshing,
  onRefresh,
  footer,
  contentStyle,
  lazy = true,
  skeleton = 'list',
}: ScreenProps) {
  const keyboardSpace = useKeyboardSpace();
  const pull = usePullRefresh();
  const refreshHandler = onRefresh ?? pull.onRefresh;
  const isRefreshing = onRefresh ? !!refreshing : pull.refreshing;
  const content = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="none"
      automaticallyAdjustKeyboardInsets={Platform.OS !== 'web'}
      showsVerticalScrollIndicator={false}
      style={{ flex: 1 }}
      contentContainerStyle={[padded && styles.padded, { paddingBottom: 32 }, contentStyle]}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={refreshHandler} tintColor={colors.primary} colors={[colors.primary]} />
      }>
      {lazy ? <LazyMount kind={skeleton}>{children}</LazyMount> : children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, padded && styles.padded, contentStyle]}>
      {lazy ? <LazyMount kind={skeleton}>{children}</LazyMount> : children}
    </View>
  );

  return (
    <SafeAreaView edges={edges} style={[styles.root, { backgroundColor: background }]}>
      <Animated.View entering={FadeIn.duration(220)} style={{ flex: 1, paddingBottom: keyboardSpace }}>
        {content}
        {footer}
      </Animated.View>
    </SafeAreaView>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  right,
  onBack,
  dark,
  hideBack,
  menu,
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  onBack?: () => void;
  dark?: boolean;
  hideBack?: boolean;
  menu?: () => void;
}) {
  const fg = dark ? colors.onDark : colors.text;
  const pathname = usePathname();
  const dashboardMenu = useDashboardMenu();
  const onMenu = menu ?? (dashboardMenu && isDashboardPath(pathname) ? dashboardMenu : undefined);
  return (
    <View style={styles.header}>
      {hideBack ? null : (
      <IconButton
        icon="chevron-back"
        label="Retour"
        color={fg}
        background={dark ? colors.darkSoft : colors.white}
        onPress={onBack ?? goHome}
      />
      )}
      {onMenu && hideBack ? (
        <IconButton
          icon="menu"
          label="Ouvrir le menu"
          color={fg}
          background={dark ? colors.darkSoft : colors.white}
          onPress={onMenu}
        />
      ) : null}
      <View style={{ flex: 1 }}>
        {title ? (
          <Txt variant="h2" color={fg} numberOfLines={1}>
            {title}
          </Txt>
        ) : null}
        {subtitle ? (
          <Txt variant="caption" color={dark ? colors.onDarkMuted : colors.textMuted} numberOfLines={1}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {onMenu && !hideBack ? (
        <IconButton
          icon="menu"
          label="Ouvrir le menu"
          color={fg}
          background={dark ? colors.darkSoft : colors.white}
          onPress={onMenu}
        />
      ) : null}
      {right}
    </View>
  );
}

export function StickyFooter({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView edges={['bottom']} style={styles.footer}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  padded: { paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
  },
  footer: {
    zIndex: 4,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    ...shadow,
  },
});
