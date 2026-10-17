import { router, type Href } from 'expo-router';

import { fetchMe, type Me } from '@/lib/api';
import { useSession } from '@/stores/session';

export const homeHref = '/' as Href;
export const commandesHref = '/commandes' as Href;
export const litigesHref = '/litiges' as Href;

export function goHome() {
  if (router.canGoBack()) router.back();
  else router.replace(homeHref);
}

/** Ramène à l’accueil, même depuis un écran empilé. */
export function goToHomeRoot() {
  router.dismissTo(homeHref);
}

/** Après une déconnexion : on attend que les gardes de navigation aient pris en compte la session vide. */
export function goHomeAfterLogout() {
  setTimeout(() => {
    if (router.canDismiss()) router.dismissAll();
    router.replace(homeHref);
  }, 0);
}

export function dashboardHref(me: Pick<Me, 'isAdmin' | 'courier' | 'seller'>): Href {
  if (me.isAdmin) return '/admin';
  if (me.courier) return '/livreur';
  if (me.seller) return '/espace';
  return '/compte';
}

export async function openDashboard() {
  const audience = useSession.getState().audience;
  if (audience === 'COURIER') {
    router.replace('/livreur');
    return;
  }
  const me = await fetchMe();
  router.replace(dashboardHref(me));
}
