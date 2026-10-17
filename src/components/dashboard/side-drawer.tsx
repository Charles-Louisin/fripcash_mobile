import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Txt } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const PANEL = 300;

export type DrawerItem = {
  icon: IconName;
  title: string;
  href?: Href;
  badge?: number;
  locked?: boolean;
  active?: boolean;
};

export function SideDrawer({
  visible,
  onClose,
  title,
  subtitle,
  sections,
  onLogout,
  searchable,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  sections: { title: string; rows: DrawerItem[] }[];
  onLogout?: () => void;
  searchable?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [mounted, setMounted] = useState(visible);
  const translateX = useRef(new Animated.Value(-PANEL)).current;
  const backdrop = useRef(new Animated.Value(0)).current;
  const generation = useRef(0);
  const native = Platform.OS !== 'web';

  useEffect(() => {
    if (visible) setMounted(true);
  }, [visible]);

  useEffect(() => {
    if (!mounted) return;
    const id = ++generation.current;
    if (visible) {
      translateX.setValue(-PANEL);
      backdrop.setValue(0);
      Animated.parallel([
        Animated.timing(translateX, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: native }),
        Animated.timing(backdrop, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: native }),
      ]).start();
      return;
    }
    Animated.parallel([
      Animated.timing(translateX, { toValue: -PANEL, duration: 280, easing: Easing.in(Easing.cubic), useNativeDriver: native }),
      Animated.timing(backdrop, { toValue: 0, duration: 280, easing: Easing.in(Easing.cubic), useNativeDriver: native }),
    ]).start(({ finished }) => {
      if (finished && generation.current === id) setMounted(false);
    });
  }, [backdrop, mounted, native, translateX, visible]);

  useEffect(() => {
    if (!visible) setQuery('');
  }, [visible]);

  const needle = query.trim().toLowerCase();
  const visibleSections = sections
    .map((section) => ({
      ...section,
      rows: section.rows.filter((row) => !needle || `${section.title} ${row.title}`.toLowerCase().includes(needle)),
    }))
    .filter((section) => section.rows.length);

  const open = (item: DrawerItem) => {
    onClose();
    if (item.href) router.push(item.href);
  };

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1 }}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay, opacity: backdrop }]} />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fermer le menu" />
        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: PANEL,
            backgroundColor: colors.surface,
            borderRightWidth: 1,
            borderRightColor: colors.border,
            paddingTop: insets.top + 8,
            paddingBottom: Math.max(insets.bottom, 12),
            transform: [{ translateX }],
            zIndex: 2,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <Txt variant="h2" numberOfLines={1}>
                {title}
              </Txt>
              {subtitle ? (
                <Txt variant="caption" numberOfLines={1}>
                  {subtitle}
                </Txt>
              ) : null}
            </View>
            <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Fermer le menu">
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>

          {searchable ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginHorizontal: 16,
                marginBottom: 12,
                height: 40,
                borderRadius: radius.pill,
                backgroundColor: colors.surfaceMuted,
                paddingHorizontal: 12,
              }}>
              <Ionicons name="search-outline" size={16} color={colors.textMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Rechercher dans le menu"
                placeholderTextColor={colors.textSubtle}
                style={{ flex: 1, fontFamily: fonts.medium, fontSize: 14, color: colors.text, paddingVertical: 0 }}
              />
            </View>
          ) : null}

          <ScrollView
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="none"
            contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 12 }}>
            {visibleSections.map((section) => (
              <View key={section.title} style={{ marginBottom: 14 }}>
                <Txt variant="label" color={colors.textMuted} style={{ marginBottom: 6, marginLeft: 8 }}>
                  {section.title}
                </Txt>
                {section.rows.map((row) => (
                  <Pressable
                    key={row.title}
                    onPress={() => open(row)}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 11,
                      borderRadius: 12,
                      backgroundColor: row.active ? colors.primary : pressed ? colors.primarySoft : 'transparent',
                    })}>
                    <Ionicons name={row.icon} size={18} color={row.active ? colors.white : colors.text} />
                    <View style={{ flex: 1 }}>
                      <Txt variant="bodyStrong" color={row.active ? colors.white : colors.text} numberOfLines={1}>
                        {row.title}
                      </Txt>
                      {row.locked ? (
                        <Txt variant="caption" color={row.active ? colors.white : colors.textMuted}>
                          Disponible après validation
                        </Txt>
                      ) : null}
                    </View>
                    {row.badge ? (
                      <View
                        style={{
                          minWidth: 20,
                          height: 20,
                          borderRadius: 10,
                          backgroundColor: row.active ? colors.white : colors.primary,
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingHorizontal: 5,
                        }}>
                        <Txt style={{ color: row.active ? colors.primary : colors.white, fontFamily: fonts.bold, fontSize: 11 }}>
                          {row.badge > 9 ? '9+' : row.badge}
                        </Txt>
                      </View>
                    ) : null}
                  </Pressable>
                ))}
              </View>
            ))}
          </ScrollView>

          {onLogout ? (
            <Pressable
              onPress={onLogout}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                marginHorizontal: 12,
                marginTop: 4,
                paddingHorizontal: 12,
                paddingVertical: 12,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              }}>
              <Ionicons name="log-out-outline" size={18} color={colors.error} />
              <Txt variant="bodyStrong" color={colors.error}>
                Se déconnecter
              </Txt>
            </Pressable>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}
