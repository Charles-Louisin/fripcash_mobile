import { usePathname, type Href } from 'expo-router';
import { useCallback, useMemo, useState, type ReactNode } from 'react';

import { useAccountType } from '@/hooks/use-account-type';
import { useAuth, usePurchases, useSales, useUnreadMessagesCount } from '@/hooks/queries';
import { useSessionActions } from '@/hooks/use-session-actions';
import { commandesHref, litigesHref } from '@/lib/nav';

import { DashboardMenuContext } from './dashboard-menu-context';
import { DRAWER_CLOSE_MS, LogoutDialog } from './logout-dialog';
import { SideDrawer, type DrawerItem } from './side-drawer';

function active(pathname: string, href: Href) {
  if (typeof href !== 'string') return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardMenuProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isConsumer, isCourier } = useAuth();
  const { me, type } = useAccountType();
  const sales = useSales(type.isSeller);
  const purchases = usePurchases();
  const unreadMessages = useUnreadMessagesCount();
  const [open, setOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const { logout } = useSessionActions();

  // Le dialog de confirmation s'ouvre par-dessus le drawer (deux Modals natifs
  // empilés) ; on ne referme le drawer qu'une fois confirmé, pendant l'attente
  // qui précède le changement de session — jamais en ouvrant un autre Modal.
  const runLogout = useCallback(async () => {
    setOpen(false);
    await new Promise((resolve) => setTimeout(resolve, DRAWER_CLOSE_MS));
    await logout();
  }, [logout]);

  const sections = useMemo(() => {
    const sellerOrders = sales.data ?? [];
    const buyerOrders = purchases.data ?? [];
    const orderBadge =
      sellerOrders.filter((order) => order.status === 'PAID' || order.status === 'SELLER_NOTIFIED').length +
      buyerOrders.filter((order) => order.status === 'IN_TRANSIT' || order.status === 'DELIVERED').length;
    const rows: { title: string; rows: DrawerItem[] }[] = [
      {
        title: 'Compte',
        rows: [
          { icon: 'grid-outline', title: "Vue d'ensemble", href: '/vue-ensemble' },
          { icon: 'person-outline', title: 'Mon profil', href: '/profil' },
          { icon: 'trending-up-outline', title: 'Évoluer', href: '/evoluer' },
          { icon: 'cart-outline', title: 'Mes commandes', href: commandesHref, badge: orderBadge || undefined },
          { icon: 'heart-outline', title: 'Mes favoris', href: '/favoris' },
        ],
      },
      {
        title: type.isShop ? 'Ma boutique' : 'Vente',
        rows: [
          ...(type.isSeller
            ? [
                { icon: 'shirt-outline' as const, title: 'Mes annonces', href: '/vendeur/articles' as Href },
                { icon: 'pricetag-outline' as const, title: 'Offres', href: '/offres' as Href },
              ]
            : []),
          ...(type.seesExcel
            ? [
                {
                  icon: 'document-outline' as const,
                  title: type.excelImport ? 'Import Excel' : 'Import Excel (verrouillé)',
                  href: '/vendeur/import-excel' as Href,
                  locked: !type.excelImport,
                },
              ]
            : []),
          ...(type.seesLibrary
            ? [
                {
                  icon: 'library-outline' as const,
                  title: type.productLibrary ? 'Bibliothèque' : 'Bibliothèque (verrouillée)',
                  href: '/vendeur/bibliotheque' as Href,
                  locked: !type.productLibrary,
                },
              ]
            : []),
        ],
      },
      {
        title: 'Activité',
        rows: [
          { icon: 'chatbubble-outline', title: 'Messages', href: '/messages', badge: unreadMessages || undefined },
          { icon: 'notifications-outline', title: 'Notifications', href: '/notifications' },
          ...(!type.isSeller ? [{ icon: 'pricetag-outline' as const, title: 'Mes offres', href: '/offres' as Href }] : []),
          { icon: 'alert-circle-outline', title: 'Litiges', href: litigesHref },
        ],
      },
      {
        title: 'Réglages',
        rows: [
          { icon: 'settings-outline', title: 'Paramètres', href: '/parametres' },
          { icon: 'home-outline', title: 'Accueil', href: '/' },
        ],
      },
    ];
    return rows
      .map((section) => ({
        ...section,
        rows: section.rows.map((row) => ({ ...row, active: row.href ? active(pathname, row.href) : false })),
      }))
      .filter((section) => section.rows.length);
  }, [pathname, purchases.data, sales.data, type, unreadMessages]);

  return (
    <DashboardMenuContext.Provider value={isConsumer ? () => setOpen(true) : null}>
      {children}
      {isConsumer ? (
        <SideDrawer
          visible={open}
          onClose={() => setOpen(false)}
          title="Tableau de bord"
          subtitle={
            isCourier && !type.isSeller
              ? 'Livreur'
              : me?.seller?.shopName
                ? `${type.label} · ${me.seller.shopName}`
                : type.label
          }
          sections={sections}
          onLogout={() => setLogoutOpen(true)}
        />
      ) : null}
      <LogoutDialog
        visible={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={runLogout}
      />
    </DashboardMenuContext.Provider>
  );
}
