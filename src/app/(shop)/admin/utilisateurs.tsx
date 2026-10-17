import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';

import { Badge, Button, Card, ConfirmDialog, EmptyState, Input, Screen, ScreenHeader, toast, Txt } from '@/components/ui';
import { banAdminUser, errorMessage, fetchAdminUsers, setAdminUserRole, unbanAdminUser, type AdminUser } from '@/lib/api';

function roleLabel(user: AdminUser) {
  if (user.role === 'admin') return 'Administrateur';
  if (user.role === 'courier') return 'Livreur';
  return user.seller ? 'Vendeur' : 'Client';
}

export default function AdminUsers() {
  const client = useQueryClient();
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [toBan, setToBan] = useState<AdminUser | null>(null);
  const list = useQuery({ queryKey: ['admin', 'users', q], queryFn: () => fetchAdminUsers(q) });
  const run = useMutation({
    mutationFn: async (job: () => Promise<unknown>) => job(),
    onSuccess: () => {
      toast.success('Compte mis à jour');
      setToBan(null);
      client.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const users = list.data?.users ?? [];

  return (
    <Screen keyboard refreshing={list.isRefetching} onRefresh={() => list.refetch()}>
      <ScreenHeader title="Utilisateurs" subtitle={list.data ? `${list.data.total} compte(s)` : undefined} />
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        <Input
          placeholder="Nom, email, téléphone"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => setQ(search.trim())}
          returnKeyType="search"
          containerStyle={{ flex: 1 }}
        />
        <Button title="Chercher" size="sm" onPress={() => setQ(search.trim())} />
      </View>
      {list.isLoading ? <Txt variant="caption">Chargement…</Txt> : null}
      {!list.isLoading && !users.length ? <EmptyState icon="people-outline" title="Aucun compte" /> : null}
      {users.map((user) => (
        <Card key={user.id} style={{ marginBottom: 10, gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
            <Txt variant="bodyStrong" style={{ flex: 1 }}>
              {user.name || user.email || 'Compte'}
            </Txt>
            <Badge label={user.banned ? 'Banni' : roleLabel(user)} tone={user.banned ? 'danger' : 'primary'} />
          </View>
          <Txt variant="caption">
            {user.email || user.phone}
            {user.seller?.shopName ? ` · ${user.seller.shopName}` : ''}
          </Txt>
          {user.role === 'admin' ? null : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {user.banned ? (
                <Button title="Débannir" size="sm" variant="secondary" loading={run.isPending} onPress={() => run.mutate(() => unbanAdminUser(user.id))} />
              ) : (
                <Button title="Bannir" size="sm" variant="danger" onPress={() => setToBan(user)} />
              )}
              {user.role === 'courier' ? (
                <Button title="Repasser client" size="sm" variant="outline" loading={run.isPending} onPress={() => run.mutate(() => setAdminUserRole(user.id, 'user'))} />
              ) : (
                <Button title="Passer livreur" size="sm" variant="outline" loading={run.isPending} onPress={() => run.mutate(() => setAdminUserRole(user.id, 'courier'))} />
              )}
            </View>
          )}
        </Card>
      ))}
      <ConfirmDialog
        visible={!!toBan}
        onClose={() => setToBan(null)}
        title="Bannir ce compte ?"
        message={`${toBan?.name || toBan?.email || 'Ce compte'} sera déconnecté et ne pourra plus utiliser FripCash.`}
        confirmLabel="Bannir"
        tone="danger"
        icon="ban-outline"
        loading={run.isPending}
        onConfirm={() => toBan && run.mutate(() => banAdminUser(toBan.id))}
      />
    </Screen>
  );
}
