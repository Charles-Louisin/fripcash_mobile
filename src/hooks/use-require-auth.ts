import { router } from 'expo-router';
import { useCallback } from 'react';

import { toast } from '@/components/ui';

import { useAuth } from './queries';

export function useRequireAuth() {
  const { isConsumer } = useAuth();
  return useCallback(
    (action: () => void, message = 'Connecte-toi pour continuer.') => {
      if (!isConsumer) {
        toast.info(message);
        router.push('/connexion');
        return;
      }
      action();
    },
    [isConsumer]
  );
}
