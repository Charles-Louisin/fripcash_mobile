import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Card, ChipRow, ConfirmDialog, EmptyState, IconButton, Input, Screen, ScreenHeader, toast, Txt } from '@/components/ui';
import { createCategory, deleteCategory, errorMessage, fetchCategories, type Category } from '@/lib/api';
import { UNIVERSES, universeByDestination } from '@/lib/domain';
import { colors } from '@/theme';

type Dest = 'ALL' | (typeof UNIVERSES)[number]['destination'];

const DEST_OPTIONS: { value: Dest; label: string }[] = [
  { value: 'ALL', label: 'Toutes' },
  ...UNIVERSES.map((u) => ({ value: u.destination as Dest, label: u.title })),
];

export default function AdminCategories() {
  const client = useQueryClient();
  const categories = useQuery({ queryKey: ['admin', 'categories'], queryFn: fetchCategories });
  const [name, setName] = useState('');
  const [dest, setDest] = useState<Dest>('ALL');
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const refresh = () => {
    client.invalidateQueries({ queryKey: ['admin', 'categories'] });
    client.invalidateQueries({ queryKey: ['catalog', 'categories'] });
  };
  const add = useMutation({
    mutationFn: () => createCategory(name.trim(), dest === 'ALL' ? null : dest),
    onSuccess: () => {
      setName('');
      toast.success('Catégorie créée');
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      toast.success('Catégorie supprimée');
      setToDelete(null);
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const rows = (categories.data ?? []).filter((c) => dest === 'ALL' || c.destination === dest);

  return (
    <Screen keyboard refreshing={categories.isRefetching} onRefresh={() => categories.refetch()}>
      <ScreenHeader title="Catégories" subtitle={`${(categories.data ?? []).length} catégorie(s)`} />
      <ChipRow options={DEST_OPTIONS} value={dest} onChange={setDest} />
      <View style={{ flexDirection: 'row', gap: 8, marginVertical: 14 }}>
        <Input
          placeholder={dest === 'ALL' ? 'Nouvelle catégorie (tous univers)' : `Nouvelle catégorie · ${universeByDestination(dest)?.title}`}
          value={name}
          onChangeText={setName}
          containerStyle={{ flex: 1 }}
        />
        <Button title="Ajouter" size="sm" onPress={() => add.mutate()} disabled={!name.trim()} loading={add.isPending} />
      </View>
      {!categories.isLoading && !rows.length ? <EmptyState icon="pricetags-outline" title="Aucune catégorie" /> : null}
      {rows.map((cat) => (
        <Card key={cat.id} style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Txt variant="bodyStrong">{cat.nameFr}</Txt>
            <Txt variant="caption">{universeByDestination(cat.destination)?.title || 'Tous les univers'}</Txt>
          </View>
          <IconButton icon="trash-outline" label="Supprimer" color={colors.error} onPress={() => setToDelete(cat)} />
        </Card>
      ))}
      <ConfirmDialog
        visible={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Supprimer la catégorie ?"
        message={`« ${toDelete?.nameFr ?? ''} » ne sera plus proposée aux vendeurs.`}
        confirmLabel="Supprimer"
        tone="danger"
        icon="trash-outline"
        loading={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
      />
    </Screen>
  );
}
