import { useState } from 'react';

import { ConfirmDialog } from '@/components/ui';
import { useSessionActions } from '@/hooks/use-session-actions';

/** Durée minimale pour que le Modal natif ait fini de se fermer (fade ~250 ms). */
const MODAL_CLOSE_MS = 400;

/** Fermeture du drawer (280 ms) + marge, avant de changer de session. */
export const DRAWER_CLOSE_MS = 350;

export function LogoutDialog({
  visible,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm?: () => Promise<void> | void;
}) {
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
        // Ne jamais changer de session tant qu'un Modal natif est en train de se
        // fermer : démonter le sous-arbre pendant l'animation gèle toute l'UI
        // (Android / New Architecture), plus rien n'est cliquable.
        await new Promise((resolve) => setTimeout(resolve, MODAL_CLOSE_MS));
        try {
          if (onConfirm) await onConfirm();
          else await logout();
        } finally {
          setLoading(false);
        }
      }}
    />
  );
}
