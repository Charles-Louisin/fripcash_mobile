import { useState } from 'react';

import { ConfirmDialog } from '@/components/ui';
import { useSessionActions } from '@/hooks/use-session-actions';

export function LogoutDialog({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { logout } = useSessionActions();
  const [loading, setLoading] = useState(false);

  return (
    <ConfirmDialog
      visible={visible}
      onClose={onClose}
      loading={loading}
      tone="danger"
      icon="log-out-outline"
      title="Confirmer la déconnexion"
      message="Es-tu sûr de vouloir te déconnecter ?"
      confirmLabel="Se déconnecter"
      onConfirm={async () => {
        if (loading) return;
        setLoading(true);
        onClose();
        try {
          await logout();
        } finally {
          setLoading(false);
        }
      }}
    />
  );
}
