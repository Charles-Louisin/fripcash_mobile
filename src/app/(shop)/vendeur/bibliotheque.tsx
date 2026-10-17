import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button, Card, EmptyState, Input, Screen, ScreenHeader, toast, Txt } from '@/components/ui';
import { useAccountType } from '@/hooks/use-account-type';
import { createLibraryItem, errorMessage, fetchLibrary, type LibraryItem } from '@/lib/api';

export default function BibliothequeScreen() {
  const { type } = useAccountType();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const load = () =>
    fetchLibrary()
      .then(setItems)
      .catch(() => {});

  useEffect(() => {
    if (type.productLibrary || type.seesLibrary) load();
  }, [type.productLibrary, type.seesLibrary]);

  const add = async () => {
    if (!title.trim()) return;
    try {
      await createLibraryItem({ title: title.trim(), description: description.trim() || undefined });
      setTitle('');
      setDescription('');
      load();
      toast.success('Ajouté à la bibliothèque');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <Screen keyboard>
      <ScreenHeader title="Bibliothèque" />
      {!type.seesLibrary ? (
        <EmptyState icon="library-outline" title="Réservé aux commerces locaux" />
      ) : (
        <View style={{ gap: 12 }}>
          <Input label="Titre" value={title} onChangeText={setTitle} />
          <Input label="Description" value={description} onChangeText={setDescription} />
          <Button title="Ajouter" onPress={add} disabled={!type.productLibrary} />
          {items.map((i) => (
            <Card key={i.id}>
              <Txt variant="bodyStrong">{i.title}</Txt>
              {i.description ? <Txt variant="caption">{i.description}</Txt> : null}
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}
