import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import type { Href } from 'expo-router';
import { Platform } from 'react-native';

import type { Audience } from '@/lib/api';

type NotificationsModule = typeof import('expo-notifications');

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** Les push distantes demandent un vrai téléphone (et un build de dev sur Android). */
export const pushSupported = Platform.OS !== 'web' && Device.isDevice && !(isExpoGo && Platform.OS === 'android');

let modulePromise: Promise<NotificationsModule | null> | null = null;
let permissionPromise: Promise<boolean> | null = null;

export function loadNotifications() {
  if (!pushSupported) return Promise.resolve(null);
  modulePromise ??= import('expo-notifications')
    .then((Notifications) => {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'FripCash',
          importance: Notifications.AndroidImportance.HIGH,
          lightColor: '#BC5C40',
          vibrationPattern: [0, 200, 120, 200],
        }).catch(() => {});
      }
      return Notifications;
    })
    .catch(() => null);
  return modulePromise;
}

/** Demande l'autorisation une seule fois par lancement ; les appels suivants attendent la même réponse. */
export function ensureNotificationPermission() {
  permissionPromise ??= (async () => {
    const Notifications = await loadNotifications();
    if (!Notifications) return false;
    try {
      const current = await Notifications.getPermissionsAsync();
      if (current.granted) return true;
      if (!current.canAskAgain) return false;
      const asked = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
      });
      return asked.granted;
    } catch {
      return false;
    }
  })();
  return permissionPromise;
}

export function expoProjectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

/** Écran à ouvrir quand on touche une notification. */
export function notificationHref(
  data: Record<string, unknown> | undefined,
  audience: Audience | null,
  isAdmin = audience === 'ADMIN',
): Href | null {
  if (!data) return null;
  const disputeId = typeof data.disputeId === 'string' ? data.disputeId : null;
  const orderId = typeof data.orderId === 'string' ? data.orderId : null;
  const conversationId = typeof data.conversationId === 'string' ? data.conversationId : null;

  if (audience === 'COURIER') {
    if (orderId) return { pathname: '/livreur/mission/[id]', params: { id: orderId } };
    if (conversationId) return { pathname: '/livreur/messages/[id]', params: { id: conversationId } };
    return null;
  }
  if (isAdmin) {
    if (disputeId) return `/admin/litige/${disputeId}` as Href;
    if (orderId) return '/admin/commandes';
    if (typeof data.listingId === 'string') return { pathname: '/article/[id]', params: { id: data.listingId } };
    return '/admin';
  }
  if (disputeId) return { pathname: '/litiges/[id]', params: { id: disputeId } };
  if (orderId) return { pathname: '/commandes/[id]', params: { id: orderId } };
  if (conversationId) return { pathname: '/messages/[id]', params: { id: conversationId } };
  if (typeof data.listingId === 'string') return { pathname: '/article/[id]', params: { id: data.listingId } };
  return null;
}
