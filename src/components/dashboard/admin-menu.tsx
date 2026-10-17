import { usePathname, type Href } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useMe } from '@/hooks/queries';
import { fetchAdminStats } from '@/lib/api';

import { DashboardMenuContext } from './dashboard-menu-context';
import { LogoutDialog } from './logout-dialog';
import { SideDrawer, type DrawerItem } from './side-drawer';

type Row = { icon: DrawerItem['icon']; title: string; href: string; exact?: boolean; also?: string[] };

const SECTIONS: { title: string; rows: Row[] }[] = [
  {
    title: 'Monitoring',
    rows: [
      { icon: 'home-outline', title: 'Accueil', href: '/', exact: true },
      { icon: 'speedometer-outline', title: 'Tableau de bord', href: '/admin', exact: true },
      { icon: 'bar-chart-outline', title: 'Rapports', href: '/admin/rapports' },
    ],
  },
  {
    title: 'Cartographie',
    rows: [
      { icon: 'map-outline', title: 'Zones', href: '/admin/zones' },
      { icon: 'apps-outline', title: 'Tarifs livraison', href: '/admin/tarifs' },
    ],
  },
  {
    title: 'Logistique',
    rows: [{ icon: 'bicycle-outline', title: 'Livreurs', href: '/admin/livreurs' }],
  },
  {
    title: 'Catalogue & modération',
    rows: [
      { icon: 'people-outline', title: 'Utilisateurs', href: '/admin/utilisateurs' },
      { icon: 'shield-checkmark-outline', title: 'Validations', href: '/admin/validations' },
      { icon: 'bag-handle-outline', title: 'Articles', href: '/admin/articles' },
      { icon: 'cart-outline', title: 'Commandes', href: '/admin/commandes' },
      { icon: 'pricetags-outline', title: 'Catégories', href: '/admin/categories' },
      { icon: 'flag-outline', title: 'Signalements', href: '/admin/signalements' },
      { icon: 'warning-outline', title: 'Litiges', href: '/admin/litiges', also: ['/admin/litige'] },
    ],
  },
  {
    title: 'Finances & partenaires',
    rows: [
      { icon: 'wallet-outline', title: 'Porte-monnaies', href: '/admin/porte-monnaies' },
      { icon: 'briefcase-outline', title: 'Enseignes', href: '/admin/partenaires' },
      { icon: 'settings-outline', title: 'Paramètres', href: '/admin/parametres' },
    ],
  },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href || pathname === `${href}/index`;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminMenuProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const me = useMe();
  const [open, setOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const stats = useQuery({ queryKey: ['admin', 'stats', 30], queryFn: () => fetchAdminStats(30), staleTime: 60_000 });

  const sections = useMemo(() => {
    const badges: Record<string, number | undefined> = {
      '/admin/litiges': stats.data?.openDisputeCount || undefined,
      '/admin/validations': stats.data?.pendingShopCount || undefined,
      '/admin/articles': stats.data?.pendingListingCount || undefined,
    };
    return SECTIONS.map((section) => ({
      title: section.title,
      rows: section.rows.map(
        ({ exact, href, also, ...row }): DrawerItem => ({
          ...row,
          href: href as Href,
          badge: badges[href],
          active: isActive(pathname, href, exact) || !!also?.some((alt) => isActive(pathname, alt)),
        })
      ),
    }));
  }, [pathname, stats.data]);

  return (
    <DashboardMenuContext.Provider value={() => setOpen(true)}>
      {children}
      <SideDrawer
        visible={open}
        onClose={() => setOpen(false)}
        title="FripCash Admin"
        subtitle={me.data?.displayName || me.data?.email || 'Administration'}
        sections={sections}
        onLogout={() => {
          setOpen(false);
          setLogoutOpen(true);
        }}
      />
      <LogoutDialog visible={logoutOpen} onClose={() => setLogoutOpen(false)} />
    </DashboardMenuContext.Provider>
  );
}
