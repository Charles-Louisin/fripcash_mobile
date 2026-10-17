import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LogoutDialog } from '@/components/dashboard/logout-dialog';
import { Card, ListRow, Screen, ScreenHeader, toast } from '@/components/ui';
import { useAuth } from '@/hooks/queries';
import { disableBiometrics, enableBiometrics, readBiometricsEnabled } from '@/lib/biometrics';
import { colors } from '@/theme';

export default function ReglagesScreen() {
  const { isConsumer } = useAuth();
  const insets = useSafeAreaInsets();
  const [bio, setBio] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    readBiometricsEnabled().then(setBio).catch(() => {});
  }, []);

  if (!isConsumer) {
    router.replace('/');
    return null;
  }

  const toggleBio = async (next: boolean) => {
    if (busy) return;
    setBusy(true);
    try {
      if (!next) {
        await disableBiometrics();
        setBio(false);
        return;
      }
      const result = await enableBiometrics();
      if (result === 'enabled') {
        setBio(true);
        toast.success('Face ID ou empreinte activé.');
        return;
      }
      if (result === 'unavailable') {
        toast.info('Face ID et empreinte ne sont pas disponibles sur cet appareil.');
      }
      setBio(false);
    } catch {
      toast.error('Impossible d’activer la biométrie.');
      setBio(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      footer={
        <View style={{ paddingHorizontal: 16, paddingBottom: Math.max(insets.bottom, 16), paddingTop: 8 }}>
          <ListRow icon="log-out-outline" title="Se déconnecter" danger onPress={() => setLogoutOpen(true)} />
        </View>
      }>
      <LogoutDialog visible={logoutOpen} onClose={() => setLogoutOpen(false)} />
      <ScreenHeader title="Paramètres" />
      <Card padded={false}>
        <ListRow icon="information-circle-outline" title="À propos" subtitle="FripCash, MBOKO CODE" onPress={() => router.push('/a-propos')} />
        <ListRow
          icon="finger-print-outline"
          title="Activer le Face ID et/ou l’empreinte"
          subtitle="Déverrouille l’application avec ton visage ou ton doigt"
          onPress={() => toggleBio(!bio)}
          right={
            <View pointerEvents="none">
              <Switch value={bio} disabled={busy} trackColor={{ true: colors.primary }} />
            </View>
          }
        />
        <ListRow icon="document-text-outline" title="Mentions légales" onPress={() => router.push('/mentions-legales')} />
        <ListRow icon="person-outline" title="Profil" subtitle="Onglet profil du tableau de bord" onPress={() => router.push('/profil')} />
      </Card>
    </Screen>
  );
}
