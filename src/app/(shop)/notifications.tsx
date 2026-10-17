import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { EmptyState, Screen, ScreenHeader, Txt } from '@/components/ui';
import { qk, useNotifications } from '@/hooks/queries';
import { markNotificationRead } from '@/lib/api';
import { notificationHref } from '@/lib/notifications';
import { useSession } from '@/stores/session';
import { formatRelative } from '@/lib/format';
import { colors, fonts, radius } from '@/theme';
import { useQueryClient } from '@tanstack/react-query';

export default function NotificationsScreen() {
  const notifs = useNotifications();
  const client = useQueryClient();
  const [busy, setBusy] = useState(false);
  const unread = (notifs.data ?? []).filter((n) => !n.read);

  const markAll = async () => {
    if (!unread.length || busy) return;
    setBusy(true);
    try {
      await Promise.all(unread.map((n) => markNotificationRead(n.id)));
      client.invalidateQueries({ queryKey: qk.notifications });
    } finally {
      setBusy(false);
    }
  };

  const open = async (n: NonNullable<typeof notifs.data>[number]) => {
    if (!n.read) {
      try {
        await markNotificationRead(n.id);
        client.invalidateQueries({ queryKey: qk.notifications });
      } catch {
        /* ignore */
      }
    }
    const href = notificationHref(n.data, useSession.getState().audience);
    if (href) router.push(href);
  };

  return (
    <Screen>
      <ScreenHeader
        title="Notifications"
        subtitle={unread.length ? `${unread.length} non lue${unread.length > 1 ? 's' : ''}` : undefined}
        right={
          unread.length ? (
            <Pressable onPress={markAll} disabled={busy} hitSlop={8}>
              <Txt style={styles.markAll}>{busy ? '…' : 'Tout marquer comme lu'}</Txt>
            </Pressable>
          ) : null
        }
      />
      {!(notifs.data ?? []).length ? (
        <EmptyState icon="notifications-outline" title="Rien de nouveau" />
      ) : (
        <View style={{ gap: 8 }}>
          {(notifs.data ?? []).map((n) => (
            <Pressable key={n.id} onPress={() => open(n)} style={[styles.row, !n.read && styles.unread]}>
              <View style={{ flex: 1, gap: 3 }}>
                <Txt variant="bodyStrong">{n.title}</Txt>
                <Txt variant="caption">{n.body}</Txt>
                <Txt variant="small">{formatRelative(n.createdAt)}</Txt>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  markAll: { fontFamily: fonts.semibold, fontSize: 12, color: colors.primary, maxWidth: 110, textAlign: 'right' },
  row: { padding: 14, borderRadius: radius.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.borderSoft },
  unread: { backgroundColor: colors.secondary, borderColor: colors.primarySoft },
});
