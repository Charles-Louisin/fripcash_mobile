import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { toast } from '@/components/ui';
import { authApi, type AuthUser } from '@/lib/api';
import { goHomeAfterLogout } from '@/lib/nav';
import { useSession, type VerificationState } from '@/stores/session';

import { syncGuestCartToServer } from './use-cart';

export function useSessionActions() {
  const client = useQueryClient();
  const signIn = useSession((s) => s.signIn);
  const signOut = useSession((s) => s.signOut);

  const login = useCallback(
    async (
      token: string,
      user: AuthUser,
      opts?: { dashboard?: boolean; verification?: Partial<VerificationState> }
    ) => {
      client.clear();
      await signIn(token, user, opts);
      if (user.authAudience !== 'COURIER') {
        await syncGuestCartToServer();
      }
    },
    [client, signIn]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.signOut();
    } catch {
      // La session peut déjà être expirée côté serveur.
    }
    await signOut();
    client.clear();
    goHomeAfterLogout();
    toast.success('Tu es déconnecté.');
  }, [client, signOut]);

  return { login, logout };
}
