import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

export function usePullRefresh() {
  const client = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await client.refetchQueries({ type: 'active' });
    } finally {
      setRefreshing(false);
    }
  }, [client]);
  return { refreshing, onRefresh };
}
