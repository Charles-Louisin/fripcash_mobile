import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, Button, EmptyState, Segmented, Sheet, Txt, toast } from '@/components/ui';
import { qk, useCourierMe, useMyMissions, useOpenMissions, useZones } from '@/hooks/queries';
import { usePullRefresh } from '@/hooks/use-pull-refresh';
import { acceptMission, errorMessage, setCourierAvailability, type Order } from '@/lib/api';
import { ACTIVE_COURIER_STATUSES, courierStatusLabel, DONE_STATUSES, orderStatusTone } from '@/lib/domain';
import { formatGnf, formatRelative, shortOrderId } from '@/lib/format';
import { colors, fonts, radius } from '@/theme';
import { useQueryClient } from '@tanstack/react-query';

type Filter = 'all' | 'active' | 'done';

export default function MissionsScreen() {
  const me = useCourierMe();
  const mine = useMyMissions();
  const open = useOpenMissions();
  const zones = useZones();
  const client = useQueryClient();
  const pull = usePullRefresh();
  const [filter, setFilter] = useState<Filter>('active');
  const [q, setQ] = useState('');
  const [pending, setPending] = useState<Order | null>(null);
  const [accepting, setAccepting] = useState(false);
  const available = !!me.data?.courier?.isAvailable;
  const approved = me.data?.courier?.verificationStatus === 'approved';

  const zoneName = (id?: string | null) => zones.data?.find((z) => z.id === id)?.nameFr || id || '—';

  const list = useMemo(() => {
    const assigned = mine.data ?? [];
    const extras = (open.data ?? []).filter((o) => !assigned.some((a) => a.id === o.id));
    let all = filter === 'all' ? [...assigned, ...extras] : filter === 'done' ? assigned.filter((o) => DONE_STATUSES.includes(o.status)) : assigned.filter((o) => ACTIVE_COURIER_STATUSES.includes(o.status) || extras.includes(o));
    if (filter === 'active') all = [...assigned.filter((o) => ACTIVE_COURIER_STATUSES.includes(o.status)), ...extras];
    if (q.trim()) {
      const s = q.toLowerCase();
      all = all.filter((o) => o.id.toLowerCase().includes(s) || o.items[0]?.title.toLowerCase().includes(s) || (o.seller?.pseudo || '').toLowerCase().includes(s));
    }
    return all;
  }, [mine.data, open.data, filter, q]);

  const toggle = async (v: boolean) => {
    try {
      await setCourierAvailability(v);
      client.invalidateQueries({ queryKey: qk.courierMe });
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const accept = async (order: Order) => {
    try {
      await acceptMission(order.id);
      toast.success('Mission acceptée');
      client.invalidateQueries({ queryKey: qk.myMissions });
      client.invalidateQueries({ queryKey: qk.openMissions });
      router.push({ pathname: '/livreur/mission/[id]', params: { id: order.id } });
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.hero}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <View style={{ flex: 1 }}>
            <Txt variant="caption" color={colors.onDarkMuted}>
              Bon retour
            </Txt>
            <Txt variant="h2" color={colors.onDark}>
              {me.data?.name || 'Livreur'}
            </Txt>
            <Txt variant="caption" color={colors.onDarkMuted}>
              Prêt pour les livraisons du jour
            </Txt>
            </View>
          </View>
          <Switch value={available} onValueChange={approved ? toggle : undefined} disabled={!approved} trackColor={{ true: colors.primary }} />
        </View>
        <View style={{ flexDirection: 'row', gap: 16, marginTop: 16 }}>
          <View>
            <Txt variant="caption" color={colors.onDarkMuted}>
              Gains versés
            </Txt>
            <Txt variant="h3" weight="bold" color={colors.onDark}>
              {formatGnf(me.data?.stats.availableGnf)}
            </Txt>
          </View>
          <View>
            <Txt variant="caption" color={colors.onDarkMuted}>
              Missions actives
            </Txt>
            <Txt variant="h3" color={colors.onDark}>
              {me.data?.stats.active ?? 0}
            </Txt>
          </View>
        </View>
        <View style={styles.search}>
          <Ionicons name="search-outline" size={18} color={colors.onDarkMuted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Rechercher une mission"
            placeholderTextColor={colors.onDarkMuted}
            style={styles.searchInput}
          />
        </View>
      </View>

      {me.data && !approved ? (
        <View style={{ marginHorizontal: 16, marginTop: 12, backgroundColor: colors.white, borderRadius: radius.lg, padding: 14, gap: 8 }}>
          <Txt variant="title">
            {me.data.courier?.verificationStatus === 'pending'
              ? 'Dossier en cours de validation'
              : me.data.courier?.verificationStatus === 'rejected'
                ? 'Dossier à corriger'
                : 'Complète ton dossier'}
          </Txt>
          <Txt variant="caption">
            Les missions s’ouvrent une fois le portrait, la pièce d’identité et la photo du véhicule validés.
          </Txt>
          <Button title="Ouvrir mon profil" onPress={() => router.push('/livreur/profil')} />
        </View>
      ) : null}

      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'Toutes' },
            { value: 'active', label: 'Actives' },
            { value: 'done', label: 'Terminées' },
          ]}
        />
      </View>

      <FlatList
        data={list}
        keyExtractor={(o) => o.id}
        refreshControl={<RefreshControl refreshing={pull.refreshing} onRefresh={pull.onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 28 }}
        ListEmptyComponent={<EmptyState icon="bicycle-outline" title="Aucune mission" />}
        renderItem={({ item }) => {
          const assigned = (mine.data ?? []).some((o) => o.id === item.id);
          return (
            <Pressable
              onPress={() => (assigned ? router.push({ pathname: '/livreur/mission/[id]', params: { id: item.id } }) : setPending(item))}
              style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.icon}>
                  <Ionicons name="cube-outline" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt variant="bodyStrong">{shortOrderId(item.id)}</Txt>
                  <Txt variant="caption" numberOfLines={1}>
                    {item.pickup?.place || zoneName(item.pickupZoneId)} › {item.dropoff?.place || item.address?.city || 'client'}
                  </Txt>
                </View>
                <Badge label={courierStatusLabel(item.status)} tone={orderStatusTone(item.status)} />
              </View>
              <Txt variant="h3" weight="bold">{formatGnf(item.shippingCostGnf || 0)}</Txt>
              {item.buyerConfirmedAt ? (
                <View style={styles.confirmed}>
                  <Ionicons name="checkmark-circle" size={15} color={colors.success} />
                  <Txt variant="label" color={colors.success}>
                    Réception confirmée par le client
                  </Txt>
                </View>
              ) : null}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Txt variant="caption">Expédié par {item.seller?.pseudo || '—'}</Txt>
                <Txt variant="caption">{formatRelative(item.createdAt)}</Txt>
              </View>
              {!assigned ? (
                <Txt variant="label" color={colors.primary}>
                  Toucher pour voir le résumé
                </Txt>
              ) : null}
            </Pressable>
          );
        }}
      />
      <Sheet visible={!!pending} onClose={() => setPending(null)} title="Résumé de la course" icon="bicycle-outline">
        {pending ? (
          <View style={{ gap: 14 }}>
            {pending.images.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {pending.images.map((uri) => (
                  <Image key={uri} source={{ uri }} style={styles.summaryThumb} contentFit="cover" transition={150} />
                ))}
              </ScrollView>
            ) : null}
            <Txt variant="caption">
              {shortOrderId(pending.id)} · {pending.items.reduce((sum, item) => sum + (item.quantity || 1), 0)} article(s)
            </Txt>
            <View style={styles.summaryRow}>
              <Ionicons name="storefront-outline" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Txt variant="caption">Récupération</Txt>
                <Txt variant="bodyStrong">{pending.pickup?.place || zoneName(pending.pickupZoneId)}</Txt>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <Ionicons name="flag-outline" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Txt variant="caption">Destination</Txt>
                <Txt variant="bodyStrong">{pending.dropoff?.place || pending.address?.city || '—'}</Txt>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <Ionicons name="cash-outline" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Txt variant="caption">Ta rémunération</Txt>
                <Txt variant="bodyStrong">{formatGnf(pending.shippingCostGnf || 0)}</Txt>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button title="Plus tard" variant="outline" style={{ flex: 1 }} onPress={() => setPending(null)} />
              <Button
                title="Accepter"
                style={{ flex: 1 }}
                loading={accepting}
                onPress={async () => {
                  setAccepting(true);
                  await accept(pending);
                  setAccepting(false);
                  setPending(null);
                }}
              />
            </View>
          </View>
        ) : null}
      </Sheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  hero: {
    backgroundColor: colors.dark,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: radius.xl,
    padding: 18,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.darkSoft,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, color: colors.onDark, fontFamily: fonts.medium, fontSize: 14 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  confirmed: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  summaryThumb: { width: 84, height: 84, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
