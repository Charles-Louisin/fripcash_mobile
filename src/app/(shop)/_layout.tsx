import { Redirect, Stack, usePathname } from 'expo-router';

import { DashboardMenuProvider } from '@/components/dashboard/dashboard-menu';
import { useAuth, useMe } from '@/hooks/queries';
import { fadeMotion, sheetMotion, stackMotion } from '@/theme/motion';

const ADMIN_EXACT = [
  '/',
  '/explorer',
  '/recherche',
  '/reglages',
  '/a-propos',
  '/mentions-legales',
  '/profil',
];
const ADMIN_PREFIXES = ['/admin', '/article/', '/boutique/', '/univers/'];

function adminAllowed(pathname: string) {
  if (ADMIN_EXACT.includes(pathname)) return true;
  return ADMIN_PREFIXES.some((path) => pathname === path || pathname.startsWith(path.endsWith('/') ? path : `${path}/`));
}

export default function ShopLayout() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  const me = useMe();

  if ((isAdmin || me.data?.isAdmin) && !adminAllowed(pathname)) return <Redirect href="/admin" />;

  return (
    <DashboardMenuProvider>
    <Stack screenOptions={stackMotion}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="recherche" options={fadeMotion} />
      <Stack.Screen name="article/[id]" />
      <Stack.Screen name="boutique/[id]" />
      <Stack.Screen name="univers/[destination]" />
      <Stack.Screen name="checkout" options={sheetMotion} />
      <Stack.Screen name="paiement/[ref]" options={{ ...fadeMotion, gestureEnabled: false }} />
      <Stack.Screen name="commandes/[id]" />
    </Stack>
    </DashboardMenuProvider>
  );
}
