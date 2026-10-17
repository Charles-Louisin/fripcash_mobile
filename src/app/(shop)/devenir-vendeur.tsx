import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { ZoneSelect } from '@/components/select-field';
import { Button, Input, Screen, ScreenHeader, toast, Txt } from '@/components/ui';
import { qk } from '@/hooks/queries';
import { useAccountType } from '@/hooks/use-account-type';
import { becomeParticulier, errorMessage } from '@/lib/api';
import { colors } from '@/theme';
import { useQueryClient } from '@tanstack/react-query';

export default function DevenirVendeurScreen() {
  const { type } = useAccountType();
  const client = useQueryClient();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!zoneId) {
      toast.error('Choisis ta zone d’expédition.');
      return;
    }
    setLoading(true);
    try {
      await becomeParticulier({ displayName: name || undefined, bio: bio || undefined, shippingZoneId: zoneId });
      await client.invalidateQueries({ queryKey: qk.me });
      toast.success('Tu peux maintenant vendre en seconde main.');
      router.replace('/espace');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen keyboard>
      <ScreenHeader title="Devenir vendeur" />
      <Txt variant="body" color={colors.textMuted} style={{ marginBottom: 16 }}>
        Passe en vendeur particulier pour publier dans Seconde main. Pour une boutique, un commerce local ou une enseigne,
        ouvre un dossier.
      </Txt>
      {type.isSeller ? (
        <Button title="Aller à mon espace" onPress={() => router.replace('/espace')} full />
      ) : (
        <View style={{ gap: 12 }}>
          <Input label="Nom d’affichage" value={name} onChangeText={setName} />
          <Input label="Bio" value={bio} onChangeText={setBio} multiline />
          <ZoneSelect label="Zone d’expédition" value={zoneId} onChange={setZoneId} />
          <Button title="Activer le compte particulier" onPress={submit} loading={loading} full />
          <Button title="Ouvrir un dossier boutique" variant="secondary" onPress={() => router.push('/vendeur/demande')} full />
        </View>
      )}
    </Screen>
  );
}
