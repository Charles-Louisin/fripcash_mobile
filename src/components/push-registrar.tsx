import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { qk } from '@/hooks/queries';
import { registerDevice, type Audience } from '@/lib/api';
import {
  ensureNotificationPermission,
  expoProjectId,
  loadNotifications,
  notificationHref,
  pushSupported,
} from '@/lib/notifications';
import { isAdminUser, useSession } from '@/stores/session';

type Data = Record<string, unknown> | undefined;

/** Monté dès l'ouverture : demande l'autorisation, rafraîchit les écrans et ouvre la bonne page au tap. */
export function NotificationsBootstrap() {
  const client = useQueryClient();

  useEffect(() => {
    let cancelled = false;
    const subs: { remove: () => void }[] = [];

    const refresh = (data: Data) => {
      client.invalidateQueries({ queryKey: qk.notifications });
      if (typeof data?.orderId === 'string') {
        client.invalidateQueries({ queryKey: qk.order(data.orderId) });
        client.invalidateQueries({ queryKey: qk.purchases });
        client.invalidateQueries({ queryKey: qk.sales });
      }
      if (typeof data?.disputeId === 'string') {
        client.invalidateQueries({ queryKey: qk.disputes });
        client.invalidateQueries({ queryKey: ['admin', 'disputes'] });
      }
      if (typeof data?.conversationId === 'string') {
        client.invalidateQueries({ queryKey: qk.messages(data.conversationId) });
        client.invalidateQueries({ queryKey: qk.conversations });
      }
    };

    const open = (data: Data) => {
      const { token, audience, user } = useSession.getState();
      if (!token) return;
      const href = notificationHref(data, audience, isAdminUser(audience, user));
      if (href) router.push(href);
    };

    (async () => {
      await ensureNotificationPermission();
      const Notifications = await loadNotifications();
      if (!Notifications || cancelled) return;
      subs.push(
        Notifications.addNotificationReceivedListener((n) => refresh(n.request.content.data as Data)),
        Notifications.addNotificationResponseReceivedListener((r) => {
          const data = r.notification.request.content.data as Data;
          refresh(data);
          open(data);
        })
      );
      const last = Notifications.getLastNotificationResponse();
      if (last) {
        Notifications.clearLastNotificationResponse();
        setTimeout(() => open(last.notification.request.content.data as Data), 400);
      }
    })();

    return () => {
      cancelled = true;
      subs.forEach((s) => s.remove());
    };
  }, [client]);

  return null;
}

/** Enregistre le jeton Expo du téléphone pour le compte connecté. */
export function PushRegistrar({ audience }: { audience: Audience }) {
  useEffect(() => {
    if (!pushSupported) return;
    let cancelled = false;

    (async () => {
      try {
        const granted = await ensureNotificationPermission();
        const Notifications = await loadNotifications();
        const projectId = expoProjectId();
        if (!granted || !Notifications || !projectId || cancelled) return;
        const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
        if (!cancelled) await registerDevice(data, Platform.OS, audience);
      } catch {
        // Les notifications push sont facultatives.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [audience]);

  return null;
}
