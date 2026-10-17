import { useState } from 'react';
import { CourierDossier } from '@/components/courier/courier-dossier';
import { LogoutDialog } from '@/components/dashboard/logout-dialog';
import { Button, Screen, Txt } from '@/components/ui';
import { useCourierMe } from '@/hooks/queries';

export default function LivreurProfilScreen() {
  const me = useCourierMe();
  const [logoutOpen, setLogoutOpen] = useState(false);

  return (
    <Screen>
      <Txt variant="h1" style={{ marginBottom: 14 }}>
        Mon profil
      </Txt>
      {me.data ? <CourierDossier profile={me.data} /> : <Txt variant="caption">Chargement…</Txt>}
      <Button title="Se déconnecter" variant="danger" onPress={() => setLogoutOpen(true)} full style={{ marginTop: 16 }} />
      <LogoutDialog visible={logoutOpen} onClose={() => setLogoutOpen(false)} />
    </Screen>
  );
}
