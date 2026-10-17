import { createContext, useContext } from 'react';

export const DashboardMenuContext = createContext<(() => void) | null>(null);

export function useDashboardMenu() {
  return useContext(DashboardMenuContext);
}

const DASHBOARD_ROOTS = [
  '/compte',
  '/espace',
  '/vue-ensemble',
  '/profil',
  '/parametres',
  '/evoluer',
  '/commandes',
  '/favoris',
  '/offres',
  '/litiges',
  '/notifications',
  '/messages',
  '/vendeur',
  '/admin',
];

export function isDashboardPath(pathname: string) {
  return DASHBOARD_ROOTS.some((root) => pathname === root || pathname.startsWith(`${root}/`));
}
