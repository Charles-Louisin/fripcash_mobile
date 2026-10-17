import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/catalog/app-header';
import { useDashboardMenu } from '@/components/dashboard/dashboard-menu-context';
import { Avatar, EmptyState, ErrorState, IconButton, LazyMount, Txt } from '@/components/ui';
import { useAuth, useConversations } from '@/hooks/queries';
import { formatRelative } from '@/lib/format';
import { colors } from '@/theme';

export default function MessagesTab() {
  const { isConsumer } = useAuth();
  const openMenu = useDashboardMenu();
  const convos = useConversations(isConsumer ? 8_000 : undefined);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <AppHeader />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginBottom: 8 }}>
        {isConsumer && openMenu ? (
          <IconButton icon="menu" label="Ouvrir le menu" onPress={openMenu} background={colors.white} />
        ) : null}
        <Txt variant="h1">Messages</Txt>
      </View>
      <LazyMount kind="list">
      {!isConsumer ? (
        <EmptyState
          icon="lock-closed-outline"
          title="Connecte-toi pour discuter"
          message="Tes échanges avec les vendeurs et le suivi de tes commandes apparaissent ici."
          actionLabel="Se connecter"
          onAction={() => router.push('/connexion')}
        />
      ) : convos.isError ? (
        <ErrorState error={convos.error} onRetry={() => convos.refetch()} />
      ) : (
        <FlatList
          data={convos.data ?? []}
          keyExtractor={(c) => c.id}
          refreshing={convos.isFetching}
          onRefresh={() => convos.refetch()}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, flexGrow: 1 }}
          ListEmptyComponent={
            <EmptyState
              icon="chatbubble-ellipses-outline"
              title="Aucune discussion"
              message="Le suivi de tes commandes et tes messages vendeurs s’afficheront ici."
            />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                item.orderId
                  ? router.push({ pathname: '/commandes/[id]', params: { id: item.orderId } })
                  : router.push({ pathname: '/messages/[id]', params: { id: item.id } })
              }
              style={({ pressed }) => [styles.row, { opacity: pressed ? 0.75 : 1 }]}>
              <Avatar name={item.peer?.name} size={48} />
              <View style={{ flex: 1, gap: 3 }}>
                <View style={styles.top}>
                  <Txt variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                    {item.peer?.name || 'Conversation'}
                  </Txt>
                  <Txt variant="small">{formatRelative(item.lastMessageAt)}</Txt>
                </View>
                <Txt variant="caption" numberOfLines={1}>
                  {item.lastMessage || (item.orderId ? 'Suivi de commande' : 'Nouvelle conversation')}
                </Txt>
                {item.orderId ? (
                  <Txt variant="small" color={colors.primary}>
                    Suivi de commande
                  </Txt>
                ) : null}
              </View>
            </Pressable>
          )}
        />
      )}
      </LazyMount>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
