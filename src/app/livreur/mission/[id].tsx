import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, type ComponentProps, type ReactNode } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';

import { Avatar, Badge, Button, Card, InfoRow, Screen, ScreenHeader, SwipeButton, toast, Txt } from '@/components/ui';
import { qk, useOrder } from '@/hooks/queries';
import { createConversation, errorMessage, progressMission } from '@/lib/api';
import { courierStatusLabel, FULFILLMENT_LABELS, orderStatusTone, PAYMENT_METHOD_LABELS } from '@/lib/domain';
import { formatGnf, formatRelative, shortOrderId } from '@/lib/format';
import { colors, radius } from '@/theme';

const NEXT: Record<string, 'COLLECTED' | 'IN_TRANSIT' | null> = {
  COURIER_ASSIGNED: 'COLLECTED',
  COLLECTED: 'IN_TRANSIT',
};

const SWIPE_LABEL = {
  COLLECTED: 'Glisser pour confirmer la collecte',
  IN_TRANSIT: 'Glisser — colis en route',
};

const CLIENT_CHAT_OPEN = ['COLLECTED', 'IN_TRANSIT', 'DELIVERED', 'FUNDS_RELEASED', 'FEEDBACK_PENDING', 'DISPUTED'];
const DONE = ['DELIVERED', 'FUNDS_RELEASED', 'FEEDBACK_PENDING'];

export default function MissionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderQ = useOrder(id, 8_000);
  const client = useQueryClient();
  const order = orderQ.data;
  const next = order ? NEXT[order.status] : null;
  const confirmedRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!order) return;
    const prev = confirmedRef.current;
    if (prev === null && order.buyerConfirmedAt) {
      toast.success('Le client a confirmé la réception du colis');
      client.invalidateQueries({ queryKey: qk.myMissions });
    }
    confirmedRef.current = order.buyerConfirmedAt ?? null;
  }, [client, order]);

  const progress = async () => {
    if (!order || !next) return;
    try {
      await progressMission(order.id, next);
      toast.success(courierStatusLabel(next));
      client.invalidateQueries({ queryKey: qk.order(id) });
      client.invalidateQueries({ queryKey: qk.myMissions });
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const chat = async (target: 'buyer' | 'seller') => {
    if (!order) return;
    try {
      const conv = await createConversation({ orderId: order.id, with: target });
      router.push({ pathname: '/livreur/messages/[id]', params: { id: conv.id } });
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  if (!order) {
    return (
      <Screen>
        <ScreenHeader title="Mission" />
        <Txt>Chargement…</Txt>
      </Screen>
    );
  }

  const pickup = order.pickup;
  const dropoff = order.dropoff;
  const sellerPhone = pickup?.phone;
  const clientChatOpen = CLIENT_CHAT_OPEN.includes(order.status);
  const clientPhone = clientChatOpen ? dropoff?.phone || order.address?.phone : null;
  const clientName = dropoff?.name || order.address?.name || order.buyer?.pseudo || 'Client';
  const confirmed = !!order.buyerConfirmedAt;
  const done = DONE.includes(order.status);
  const hours = pickup?.openingTime && pickup?.closingTime ? `${pickup.openingTime} – ${pickup.closingTime}` : null;
  const itemCount = order.items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <Screen>
      <ScreenHeader title={shortOrderId(order.id)} subtitle={formatRelative(order.createdAt)} />

      <Card style={[styles.hero, { backgroundColor: colors.dark }]}>
        <View style={styles.rowBetween}>
          <Badge label={courierStatusLabel(order.status)} tone={orderStatusTone(order.status)} />
          <Txt variant="h3" weight="bold" color={colors.onDark}>
            {formatGnf(order.shippingCostGnf || 0)}
          </Txt>
        </View>
        <View style={styles.route}>
          <RouteStop icon="storefront-outline" label="Récupération" value={pickup?.place || '—'} />
          <View style={styles.routeLine} />
          <RouteStop icon="flag-outline" label="Livraison" value={dropoff?.place || order.address?.city || '—'} />
        </View>
      </Card>

      {order.images.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
          {order.images.map((uri) => (
            <Image key={uri} source={{ uri }} style={styles.thumb} contentFit="cover" transition={150} />
          ))}
        </ScrollView>
      ) : null}

      <Section
        title="Récupération chez le vendeur"
        avatar={<Avatar uri={order.seller?.avatarUrl} name={order.seller?.pseudo} size={28} />}
        name={order.seller?.pseudo || 'Vendeur'}
        role="Vendeur"
        actions={
          <>
            <Button title="Écrire" size="sm" variant="secondary" icon="chatbubble-ellipses-outline" onPress={() => chat('seller')} />
            {sellerPhone ? (
              <Button title="Appeler" size="sm" variant="outline" icon="call-outline" onPress={() => Linking.openURL(`tel:${sellerPhone}`)} />
            ) : null}
          </>
        }>
        <InfoRow icon="location-outline" label="Lieu" value={pickup?.place} />
        <InfoRow icon="home-outline" label="Adresse" value={pickup?.address} />
        {pickup?.landmark ? <InfoRow icon="navigate-outline" label="Repère" value={pickup.landmark} /> : null}
        {hours ? <InfoRow icon="time-outline" label="Horaires" value={hours} /> : null}
        {sellerPhone ? <InfoRow icon="call-outline" label="Téléphone" value={sellerPhone} /> : null}
      </Section>

      <Section
        title="Livraison au client"
        avatar={<Avatar uri={order.buyer?.avatarUrl} name={clientName} size={28} />}
        name={clientName}
        role="Client"
        actions={
          <>
            <Button
              title="Écrire"
              size="sm"
              variant="secondary"
              icon={clientChatOpen ? 'chatbubble-ellipses-outline' : 'lock-closed-outline'}
              disabled={!clientChatOpen}
              onPress={() => chat('buyer')}
            />
            {clientPhone ? (
              <Button title="Appeler" size="sm" variant="outline" icon="call-outline" onPress={() => Linking.openURL(`tel:${clientPhone}`)} />
            ) : null}
          </>
        }>
        {!clientChatOpen ? (
          <Txt variant="caption" style={{ paddingTop: 8 }}>
            Les messages et l’appel au client s’ouvrent après la confirmation de la collecte.
          </Txt>
        ) : null}
        <InfoRow icon="flag-outline" label="Destination" value={dropoff?.place || order.address?.city} />
        <InfoRow icon="home-outline" label="Adresse" value={dropoff?.address || order.address?.line} />
        {clientPhone ? <InfoRow icon="call-outline" label="Téléphone" value={clientPhone} /> : null}
      </Section>

      <Card style={styles.block}>
        <Txt variant="title" style={{ marginBottom: 6 }}>
          Contenu du colis · {itemCount} article{itemCount > 1 ? 's' : ''}
        </Txt>
        {order.items.map((item, index) => (
          <View key={`${item.listingId}-${index}`} style={styles.item}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.itemThumb} contentFit="cover" />
            ) : (
              <View style={[styles.itemThumb, styles.itemThumbEmpty]}>
                <Ionicons name="shirt-outline" size={16} color={colors.textSubtle} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Txt variant="bodyStrong" numberOfLines={2}>
                {item.title}
              </Txt>
              <Txt variant="caption">Quantité : {item.quantity || 1}</Txt>
            </View>
            <Txt variant="label">{formatGnf(item.priceGnf * (item.quantity || 1))}</Txt>
          </View>
        ))}
        <InfoRow label="Montant commande" value={formatGnf(order.amountGnf)} />
        <InfoRow label="Ta rémunération" value={formatGnf(order.shippingCostGnf || 0)} />
        <InfoRow label="Paiement" value={`${PAYMENT_METHOD_LABELS[order.paymentMethod]} · déjà payé`} />
        <InfoRow label="Type" value={FULFILLMENT_LABELS[order.fulfillmentMode]} />
      </Card>

      {!done ? (
        <View style={[styles.notice, { backgroundColor: colors.warningSoft }]}>
          <Ionicons name="alert-circle-outline" size={20} color={colors.warning} />
          <Txt variant="caption" color={colors.text} style={{ flex: 1 }}>
            Avant de laisser le colis, vérifie que le client a bien appuyé sur « Colis reçu » dans son application. Dès
            qu’il l’aura fait, tu seras prévenu par notification.
          </Txt>
        </View>
      ) : null}

      {next ? (
        <SwipeButton label={SWIPE_LABEL[next]} onConfirm={progress} />
      ) : confirmed ? (
        <View style={[styles.notice, { backgroundColor: colors.successSoft }]}>
          <Ionicons name="checkmark-circle" size={22} color={colors.success} />
          <View style={{ flex: 1 }}>
            <Txt variant="bodyStrong">Réception confirmée par le client</Txt>
            <Txt variant="caption">
              {clientName} a appuyé sur « Colis reçu ». Course terminée : tes frais de livraison partent vers ton Mobile Money.
            </Txt>
          </View>
        </View>
      ) : order.status === 'IN_TRANSIT' ? (
        <View style={[styles.notice, { backgroundColor: colors.surfaceMuted }]}>
          <Ionicons name="hourglass-outline" size={20} color={colors.textMuted} />
          <View style={{ flex: 1 }}>
            <Txt variant="bodyStrong">En attente du client</Txt>
            <Txt variant="caption">
              Une fois sur place, demande au client d’appuyer sur « Colis reçu ». Cet écran se met à jour tout seul.
            </Txt>
          </View>
        </View>
      ) : (
        <Txt variant="caption" align="center">
          Mission terminée.
        </Txt>
      )}
    </Screen>
  );
}

function RouteStop({ icon, label, value }: { icon: ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  return (
    <View style={styles.stop}>
      <View style={styles.stopIcon}>
        <Ionicons name={icon} size={15} color={colors.onDark} />
      </View>
      <View style={{ flex: 1 }}>
        <Txt variant="caption" color={colors.onDarkMuted}>
          {label}
        </Txt>
        <Txt variant="bodyStrong" color={colors.onDark} numberOfLines={1}>
          {value}
        </Txt>
      </View>
    </View>
  );
}

function Section({
  title,
  avatar,
  name,
  role,
  actions,
  children,
}: {
  title: string;
  avatar: ReactNode;
  name: string;
  role: string;
  actions: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card style={styles.block}>
      <Txt variant="caption" style={{ marginBottom: 8 }}>
        {title}
      </Txt>
      <View style={styles.rowBetween}>
        <View style={styles.person}>
          {avatar}
          <View style={{ flex: 1 }}>
            <Txt variant="bodyStrong" numberOfLines={1}>
              {name}
            </Txt>
            <Txt variant="caption">{role}</Txt>
          </View>
        </View>
        <View style={styles.actions}>{actions}</View>
      </View>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  hero: { marginBottom: 12, gap: 14 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  route: { gap: 4 },
  routeLine: { width: 2, height: 14, marginLeft: 14, backgroundColor: colors.darkMuted },
  stop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stopIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.darkSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gallery: { gap: 8, paddingBottom: 12 },
  thumb: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  block: { marginBottom: 12 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  actions: { flexDirection: 'row', gap: 6 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  itemThumb: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted },
  itemThumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: radius.lg, marginBottom: 14 },
});
