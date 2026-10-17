import { resolveAccountType } from '@/lib/account-type';

import { useMe } from './queries';

export function useAccountType() {
  const me = useMe();
  return { me: me.data, loading: me.isLoading, type: resolveAccountType(me.data) };
}
