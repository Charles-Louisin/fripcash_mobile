import { router } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/catalog/app-header';
import { useDashboardMenu } from '@/components/dashboard/dashboard-menu-context';
import { Avatar, EmptyState, ErrorState, IconButton, LazyMount, Txt } from '@/components/ui';
import { useAuth, useConversations } from '@/hooks/queries';
import type { Conversation } from '@/lib/api';
import { formatRelative } from '@/lib/format';
import { colors, radius } from '@/theme';

type Row = {
  key: string;
  orderId?: string;
  conversationId: string;
  title: string;
  caption: string;
  at?: string;
  imageUrl?: string;
  unread: number;
  /** Deux discussions au moins = client et livreur réunis sous la même commande. */
  tags: string[];
};

const at = (c: Conversation) => new Date(c.lastMessageAt ?? 0).getTime();

/** Une entrée par commande : ses discussions (vendeur, livreur) sont regroupées sous la même ligne. */
function toRows(convos: Conversation[]): Row[] {
  const byOrder = new Map<string, Conversation[]>();
  const rows: Row[] = [];
  for (const c of convos) {
    if (!c.orderId) {
      rows.push({
        key: c.id,
        conversationId: c.id,
        title: c.peer?.name || 'Conversation',
        caption: c.lastMessage || 'Nouvelle conversation',
        at: c.lastMessageAt,
        unread: c.unread ?? 0,
        tags: [],
      });
      continue;
    }
    const list = byOrder.get(c.orderId) ?? [];
    list.push(c);
    byOrder.set(c.orderId, list);
  }
  for (const [orderId, list] of byOrder) {
    const sorted = [...list].sort((a, b) => at(b) - at(a));
    const top = sorted[0]!;
    rows.push({
      key: `order-${orderId}`,
      orderId,
      conversationId: top.id,
      title: top.order?.title || top.peer?.name || 'Commande',
      caption: [top.peerRoleLabel, top.lastMessage].filter(Boolean).join(' · ') || 'Suivi de commande',
      at: top.lastMessageAt,
      imageUrl: top.order?.imageUrl,
      unread: list.reduce((sum, c) => sum + (c.unread ?? 0), 0),
      tags: sorted.map((c) => c.peerRoleLabel || 'Discussion'),
    });
  }
  return rows.sort((a, b) => new Date(b.at ?? 0).getTime() - new Date(a.at ?? 0).getTime());
}

export default function MessagesTab() {
  const { isConsumer } = useAuth();
  const openMenu = useDashboardMenu();
  const convos = useConversations(isConsumer ? 8_000 : undefined);
  const rows = useMemo(() => toRows(convos.data ?? []), [convos.data]);

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
          data={rows}
          keyExtractor={(r) => r.key}
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
                  : router.push({ pathname: '/messages/[id]', params: { id: item.conversationId } })
              }
              style={({ pressed }) => [styles.row, { opacity: pressed ? 0.75 : 1 }]}>
              <Avatar name={item.title} uri={item.imageUrl} size={48} />
              <View style={{ flex: 1, gap: 3 }}>
                <View style={styles.top}>
                  <Txt variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                    {item.title}
                  </Txt>
                  <Txt variant="small">{formatRelative(item.at)}</Txt>
                </View>
                <Txt variant="caption" numberOfLines={1}>
                  {item.caption}
                </Txt>
                <View style={styles.tags}>
                  {item.orderId ? (
                    <Txt variant="small" color={colors.primary}>
                      Suivi de commande
                    </Txt>
                  ) : null}
                  {item.tags.length > 1 ? (
                    <Txt variant="small" color={colors.textMuted}>
                      {item.tags.join(' · ')}
                    </Txt>
                  ) : null}
                  {item.unread > 0 ? (
                    <View style={styles.badge}>
                      <Txt variant="small" color={colors.white}>
                        {item.unread > 9 ? '9+' : String(item.unread)}
                      </Txt>
                    </View>
                  ) : null}
                </View>
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
  tags: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: radius.pill,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
});
