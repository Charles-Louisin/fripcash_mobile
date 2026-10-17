import { router, Stack } from 'expo-router';
import { useEffect } from 'react';

import { AdminMenuProvider } from '@/components/dashboard/admin-menu';
import { Loading } from '@/components/ui';
import { useAuth, useMe } from '@/hooks/queries';
import { fadeMotion, stackMotion } from '@/theme/motion';

export default function AdminLayout() {
  const { isAdmin } = useAuth();
  const me = useMe();
  const allowed = isAdmin || !!me.data?.isAdmin;

  useEffect(() => {
    if (isAdmin) return;
    if (!me.isLoading && !me.data?.isAdmin) router.replace('/');
  }, [isAdmin, me.isLoading, me.data?.isAdmin]);

  if (!allowed) return <Loading label="Ouverture de l’administration…" />;

  return (
    <AdminMenuProvider>
      <Stack screenOptions={stackMotion}>
        <Stack.Screen name="index" options={fadeMotion} />
      </Stack>
    </AdminMenuProvider>
  );
}
