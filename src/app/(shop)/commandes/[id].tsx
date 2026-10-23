import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Avatar,
  Badge,
  Button,
  ConfirmDialog,
  ErrorState,
  IconButton,
  Input,
  LazyMount,
  PageSkeleton,
  Sheet,
  toast,
  Txt,
} from '@/components/ui';
import { CourierIntro } from '@/components/commerce/courier-intro';
import { qk, useAuth, useDisputes, useMe, useMessages, useOrder } from '@/hooks/queries';
import {
  acceptOrderOffer,
  cancelAfterRefuse,
  confirmReception,
  createConversation,
  errorMessage,
  fetchConversations,
  openDispute,
  payFullAfterRefuse,
  refuseOrderOffer,
  requestCourier,
  reviewOrder,
  sellerRefund,
  sendMessage,
  transitionOrder,
  verifyOrderPickupCode,
  type Order,
  type OrderStatus,
} from '@/lib/api';
import { FULFILLMENT_LABELS, ORDER_STATUS_LABELS, orderStatusTone, shopKindLabel } from '@/lib/domain';
import { formatGnf, formatTime, shortOrderId } from '@/lib/format';
import { useComposerSpace } from '@/lib/keyboard-space';
import { colors, fonts, radius } from '@/theme';
import { useQueryClient } from '@tanstack/react-query';

type FeedItem =
  | { kind: 'msg'; id: string; at: string; mine: boolean; body: string }
  | {
      kind: 'courier';
      id: string;
      at: string;
      name: string;
      phone?: string;
      portraitUrl?: string;
      vehicle?: string;
      plate?: string;
    }
  | { kind: 'event'; id: string; at: string; status: string; note?: string; order: Order }
  | { kind: 'action'; id: string; at: string; order: Order };

function eventCopy(status: string, order: Order) {
  const name = order.courierName || 'le livreur';
  switch (status) {
    case 'PAID':
      return { title: 'Payé — en séquestre', text: 'Le paiement est sécurisé jusqu’à confirmation de réception.' };
    case 'SELLER_NOTIFIED':
      return { title: 'Vendeur notifié', text: 'La boutique a été informée de ta commande.' };
    case 'PREPARING':
      return { title: 'En préparation', text: 'Le vendeur prépare le colis.' };
    case 'READY_FOR_PICKUP':
      return order.fulfillmentMode === 'pickup'
        ? { title: 'Prête au retrait', text: 'Présente ton code au vendeur pour récupérer la commande.' }
        : { title: 'Prête à récupérer', text: 'Un livreur peut prendre en charge le colis.' };
    case 'COURIER_ASSIGNED':
      return { title: `Course acceptée — ${name}`, text: `${name} va récupérer le colis.` };
    case 'BUYER_CONFIRMED':
      return { title: 'Colis reçu', text: 'Le client a confirmé la réception du colis.' };
    case 'COLLECTED':
      return { title: `Colis récupéré par ${name}`, text: `En route vers toi.` };
    case 'IN_TRANSIT':
      return { title: `En route vers toi`, text: `${name} apporte le colis.` };
    case 'DELIVERED':
      return { title: 'Colis remis — à toi de vérifier', text: 'Ouvre le colis et vérifie l’article avant de confirmer.' };
    case 'FUNDS_RELEASED':
      return { title: 'Fonds libérés', text: 'Le paiement a été versé au vendeur.' };
    case 'DISPUTED':
      return { title: 'Litige ouvert', text: order.disputeReason || 'Un problème a été signalé.' };
    case 'REFUNDED':
      return { title: 'Remboursée', text: 'Le montant a été renvoyé.' };
    case 'OFFER_ACCEPTED':
      return { title: 'Offre acceptée', text: order.offerAmountGnf ? `Nouveau montant : ${order.offerAmountGnf} GNF` : '' };
    case 'OFFER_REFUSED':
      return { title: 'Offre refusée', text: 'Le vendeur a refusé l’offre.' };
    default:
      return { title: ORDER_STATUS_LABELS[status as OrderStatus] || status, text: '' };
  }
}

export default function OrderChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { data: me } = useMe();
  const client = useQueryClient();
  const orderQ = useOrder(id, 6_000);
  const order = orderQ.data;
  const [convId, setConvId] = useState<string | null>(null);
  const messages = useMessages(convId ?? undefined, 5_000);
  const listRef = useRef<FlatList>(null);
  const composerSpace = useComposerSpace();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [busy, setBusy] = useState(false);

  const disputes = useDisputes();
  const dispute = (disputes.data ?? []).find((x) => x.orderId === id);
  const myId = me?.id || user?.id;
  const isBuyer = !!order && order.buyerId === myId;
  const isSeller = !!order && order.sellerId === myId;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const existing = await fetchConversations();
        const found = existing.find((c) => c.orderId === id);
        if (found) {
          if (!cancelled) setConvId(found.id);
          return;
        }
        const created = await createConversation({ orderId: id });
        if (!cancelled) setConvId(created.id);
      } catch {
        /* conversation optionnelle */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const feed = useMemo<FeedItem[]>(() => {
    if (!order) return [];
    const items: FeedItem[] = [];
    for (const t of order.timeline ?? []) {
      items.push({ kind: 'event', id: `ev-${t.status}-${t.at}`, at: t.at, status: t.status, note: t.note, order });
    }
    for (const m of messages.data ?? []) {
      if (m.kind === 'courier' || m.meta?.kind === 'courier') {
        items.push({
          kind: 'courier',
          id: m.id,
          at: m.createdAt,
          name: m.meta?.name || 'Livreur',
          phone: m.meta?.phone,
          portraitUrl: m.meta?.portraitUrl,
          vehicle: m.meta?.vehicle,
          plate: m.meta?.plate,
        });
        continue;
      }
      items.push({ kind: 'msg', id: m.id, at: m.createdAt, mine: m.senderId === myId, body: m.body });
    }
    const lastAt = items.reduce((max, i) => (i.at > max ? i.at : max), order.createdAt);
    items.push({ kind: 'action', id: 'actions', at: lastAt, order });
    return items.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  }, [order, messages.data, myId]);

  const invalidate = () => {
    client.invalidateQueries({ queryKey: qk.order(id) });
    client.invalidateQueries({ queryKey: qk.purchases });
    client.invalidateQueries({ queryKey: qk.sales });
    if (convId) client.invalidateQueries({ queryKey: qk.messages(convId) });
  };

  const send = async () => {
    if (!convId || !text.trim()) return;
    setSending(true);
    try {
      await sendMessage(convId, text.trim());
      setText('');
      messages.refetch();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSending(false);
    }
  };

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    setBusy(true);
    try {
      await fn();
      if (ok) toast.success(ok);
      invalidate();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (orderQ.isLoading) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <PageSkeleton kind="chat" />
      </SafeAreaView>
    );
  }
  if (!order) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <ErrorState error={orderQ.error ?? new Error('Commande introuvable')} onRetry={() => orderQ.refetch()} />
      </SafeAreaView>
    );
  }

  const first = order.items[0];
  const peer = isBuyer ? order.seller : order.buyer;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <LazyMount kind="chat">
      <View style={{ flex: 1 }}>
        <View style={styles.header}>
          <IconButton icon="chevron-back" label="Retour" background={colors.white} onPress={() => router.back()} />
          <Avatar name={peer?.pseudo} size={40} />
          <View style={{ flex: 1 }}>
            <Txt variant="title" numberOfLines={1}>
              {peer?.pseudo || 'Commande'}
            </Txt>
            <Txt variant="caption" numberOfLines={1}>
              {isBuyer ? shopKindLabel(order.seller?.sellerKind, order.seller?.shopKind) : 'Acheteur'} ·{' '}
              {ORDER_STATUS_LABELS[order.status]}
            </Txt>
          </View>
        </View>

        <Pressable
          style={styles.pin}
          disabled={!first?.listingId}
          onPress={() => {
            if (first?.listingId) router.push({ pathname: '/article/[id]', params: { id: first.listingId } });
          }}>
          {first?.imageUrl ? <Image source={{ uri: first.imageUrl }} style={styles.pinImg} contentFit="cover" /> : <View style={styles.pinImg} />}
          <View style={{ flex: 1 }}>
            <Txt variant="bodyStrong" numberOfLines={1}>
              {first?.title} · {formatGnf(order.amountGnf)}
            </Txt>
            <Txt variant="caption">{shortOrderId(order.id)}</Txt>
            <Badge
              label={order.escrowStatus === 'blocked' ? 'Payé · en séquestre' : ORDER_STATUS_LABELS[order.status]}
              tone={order.escrowStatus === 'blocked' ? 'warning' : orderStatusTone(order.status)}
            />
          </View>
          {first?.listingId ? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} /> : null}
        </Pressable>

        <FlatList
          ref={listRef}
          data={feed}
          keyExtractor={(i) => i.id}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 20 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            if (item.kind === 'courier') {
              return (
                <CourierIntro
                  name={item.name}
                  phone={item.phone}
                  portraitUrl={item.portraitUrl}
                  vehicle={item.vehicle}
                  plate={item.plate}
                />
              );
            }
            if (item.kind === 'msg') {
              return (
                <View style={[styles.bubble, item.mine ? styles.mine : styles.theirs]}>
                  <Txt variant="body" color={item.mine ? colors.white : colors.text}>
                    {item.body}
                  </Txt>
                  <Txt variant="small" color={item.mine ? colors.onDarkMuted : colors.textSubtle} style={{ alignSelf: 'flex-end' }}>
                    {formatTime(item.at)}
                  </Txt>
                </View>
              );
            }
            if (item.kind === 'event') {
              const copy = eventCopy(item.status, item.order);
              const icon =
                item.status === 'COLLECTED' || item.status === 'IN_TRANSIT'
                  ? 'bicycle-outline'
                  : item.status === 'DELIVERED'
                    ? 'cube-outline'
                    : 'checkmark-circle-outline';
              return (
                <View style={styles.event}>
                  <Ionicons name={icon} size={18} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Txt variant="bodyStrong">{copy.title}</Txt>
                    {copy.text ? <Txt variant="caption">{copy.text}</Txt> : null}
                    {item.note ? <Txt variant="caption">{item.note}</Txt> : null}
                  </View>
                </View>
              );
            }
            return (
              <ActionCards
                order={item.order}
                isBuyer={isBuyer}
                isSeller={isSeller}
                busy={busy}
                onConfirm={() => setConfirmOpen(true)}
                onDispute={() => setDisputeOpen(true)}
                onReview={() => setReviewOpen(true)}
                onPrepare={() => run(() => transitionOrder(order.id, 'PREPARING'), 'Commande en préparation')}
                onRequestCourier={() => run(() => requestCourier(order.id), 'Livreur demandé')}
                onAcceptOffer={() => run(() => acceptOrderOffer(order.id), 'Offre acceptée')}
                onRefuseOffer={() => run(() => refuseOrderOffer(order.id), 'Offre refusée')}
                onPayFull={() => run(() => payFullAfterRefuse(order.id), 'Paiement du prix plein')}
                onCancel={() => run(() => cancelAfterRefuse(order.id), 'Commande annulée')}
                onRefund={() => run(() => sellerRefund(order.id), 'Remboursement lancé')}
                dispute={dispute ? { status: dispute.status } : null}
                onOpenDispute={() =>
                  dispute && router.push({ pathname: '/litiges/[id]', params: { id: dispute.id } })
                }
                onVerifyPickup={(code) =>
                  run(() => verifyOrderPickupCode(order.id, code), 'Code validé — tu peux remettre le colis')
                }
              />
            );
          }}
        />

        <View style={[styles.composer, { paddingBottom: composerSpace }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Écrire un message…"
            placeholderTextColor={colors.textSubtle}
            style={styles.input}
            multiline
          />
          <Pressable onPress={send} disabled={sending || !text.trim()} style={styles.send} accessibilityLabel="Envoyer">
            <Ionicons name="send" size={18} color={colors.white} />
          </Pressable>
        </View>
      </View>

      <ConfirmDialog
        visible={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Tu as bien reçu le colis ?"
        message={`Cette action est définitive. Les ${formatGnf(order.amountGnf)} partiront au vendeur et le livreur sera prévenu qu’il peut te laisser le colis.`}
        confirmLabel="Oui, colis reçu"
        icon="cube-outline"
        loading={busy}
        onConfirm={async () => {
          await run(() => confirmReception(order.id), 'Colis reçu confirmé');
          setConfirmOpen(false);
        }}
      />

      <ConfirmDialog
        visible={disputeOpen}
        onClose={() => setDisputeOpen(false)}
        title="Signaler un problème"
        message="Décris le souci. Un litige sera ouvert et les fonds resteront bloqués."
        confirmLabel="Ouvrir le litige"
        tone="danger"
        icon="alert-circle-outline"
        loading={busy}
        onConfirm={async () => {
          if (disputeReason.trim().length < 3) {
            toast.error('Décris le problème en quelques mots (3 caractères minimum).');
            return;
          }
          setBusy(true);
          try {
            const opened = await openDispute(order.id, disputeReason.trim());
            toast.success('Litige ouvert');
            invalidate();
            client.invalidateQueries({ queryKey: qk.disputes });
            setDisputeOpen(false);
            setDisputeReason('');
            router.push({ pathname: '/litiges/[id]', params: { id: opened.id } });
          } catch (e) {
            toast.error(errorMessage(e));
          } finally {
            setBusy(false);
          }
        }}>
        <Input value={disputeReason} onChangeText={setDisputeReason} placeholder="Ex. article endommagé" multiline />
      </ConfirmDialog>

      <Sheet visible={reviewOpen} onClose={() => setReviewOpen(false)} title="Laisser un avis">
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => setRating(n)}>
                <Ionicons name={n <= rating ? 'star' : 'star-outline'} size={28} color={colors.star} />
              </Pressable>
            ))}
          </View>
          <Input value={review} onChangeText={setReview} placeholder="Commentaire (optionnel)" multiline />
          <Button
            title="Publier"
            loading={busy}
            onPress={() =>
              run(async () => {
                const listingId = order.items[0]?.listingId;
                if (!listingId) throw new Error('Article introuvable.');
                await reviewOrder(order.id, { rating, comment: review || undefined, listingId });
                setReviewOpen(false);
              }, 'Avis publié')
            }
            full
          />
        </View>
      </Sheet>
      </LazyMount>
    </SafeAreaView>
  );
}

const HANDOVER_STATUSES = ['COURIER_ASSIGNED', 'COLLECTED', 'IN_TRANSIT', 'DELIVERED'];

function ActionCards({
  order,
  isBuyer,
  isSeller,
  busy,
  onConfirm,
  onDispute,
  onReview,
  onPrepare,
  onRequestCourier,
  onAcceptOffer,
  onRefuseOffer,
  onPayFull,
  onCancel,
  onRefund,
  onVerifyPickup,
  dispute,
  onOpenDispute,
}: {
  dispute: { status: string } | null;
  onOpenDispute: () => void;
  order: Order;
  isBuyer: boolean;
  isSeller: boolean;
  busy: boolean;
  onConfirm: () => void;
  onDispute: () => void;
  onReview: () => void;
  onPrepare: () => void;
  onRequestCourier: () => void;
  onAcceptOffer: () => void;
  onRefuseOffer: () => void;
  onPayFull: () => void;
  onCancel: () => void;
  onRefund: () => void;
  onVerifyPickup: (code: string) => void;
}) {
  const cards: React.ReactNode[] = [];
  const isPickup = order.fulfillmentMode === 'pickup';
  const [sellerCode, setSellerCode] = useState('');

  if (dispute) {
    const live = dispute.status === 'open' || dispute.status === 'under_review';
    cards.push(
      <View key="dispute" style={styles.action}>
        <Txt variant="h3">{live ? 'Litige en cours' : 'Litige clos'}</Txt>
        <Txt variant="caption">
          {live
            ? 'Échange avec l’autre partie et l’équipe FripCash, ajoute des photos ou des PDF et règle le litige depuis son fil.'
            : 'Retrouve l’historique et la décision dans le fil du litige.'}
        </Txt>
        <Button title="Ouvrir le fil du litige" icon="chatbubbles-outline" onPress={onOpenDispute} full />
      </View>
    );
  }

  if (isSeller && order.offerStatus === 'pending') {
    cards.push(
      <View key="offer" style={styles.action}>
        <Txt variant="h3" weight="bold">Offre de {formatGnf(order.offerAmountGnf)}</Txt>
        <Txt variant="caption">Prix initial {formatGnf(order.originalAmountGnf)}</Txt>
        <Button title="Accepter" onPress={onAcceptOffer} loading={busy} full />
        <Button title="Refuser" variant="outline" onPress={onRefuseOffer} disabled={busy} full />
      </View>
    );
  }
  if (isBuyer && order.offerStatus === 'refused') {
    cards.push(
      <View key="refused" style={styles.action}>
        <Txt variant="h3">Offre refusée</Txt>
        <Txt variant="caption">Tu peux payer le prix plein ou annuler.</Txt>
        <Button title="Payer le prix plein" onPress={onPayFull} loading={busy} full />
        <Button title="Annuler" variant="ghost" onPress={onCancel} disabled={busy} full />
      </View>
    );
  }
  if (isSeller && (order.status === 'PAID' || order.status === 'SELLER_NOTIFIED')) {
    cards.push(
      <View key="prep" style={styles.action}>
        <Txt variant="h3">Préparer la commande</Txt>
        <Button title="Marquer en préparation" onPress={onPrepare} loading={busy} full />
      </View>
    );
  }
  if (isPickup && isBuyer && order.pickupCode && order.escrowStatus === 'blocked') {
    cards.push(
      <View key="pickup-buyer" style={[styles.action, { backgroundColor: '#E4F3EC' }]}>
        <Txt variant="h3" color="#1F5C45">
          Ton code de retrait
        </Txt>
        <Txt variant="caption" color="#2A6B52">
          Donne ce code au vendeur au moment de récupérer ta commande.
        </Txt>
        <Txt style={styles.pickupDigits}>{order.pickupCode}</Txt>
      </View>
    );
  }
  if (
    isPickup &&
    isSeller &&
    order.escrowStatus === 'blocked' &&
    !['FUNDS_RELEASED', 'REFUNDED', 'DISPUTED'].includes(order.status)
  ) {
    cards.push(
      <View key="pickup-seller" style={styles.action}>
        <Txt variant="h3">Valider le retrait</Txt>
        <Txt variant="caption">Demande le code à l’acheteur, saisis-le ici pour débloquer le paiement et remettre le colis.</Txt>
        <Input
          label="Code à 6 chiffres"
          value={sellerCode}
          onChangeText={setSellerCode}
          keyboardType="number-pad"
          maxLength={6}
        />
        <Button
          title="Valider le code"
          loading={busy}
          disabled={sellerCode.trim().length < 4}
          onPress={() => onVerifyPickup(sellerCode.trim())}
          full
        />
        {['PAID', 'SELLER_NOTIFIED', 'PREPARING'].includes(order.status) ? (
          <Button title="Rembourser l’acheteur" variant="danger" onPress={onRefund} disabled={busy} full />
        ) : null}
      </View>
    );
  }
  if (isSeller && !isPickup && (order.status === 'PREPARING' || order.status === 'PAID' || order.status === 'SELLER_NOTIFIED')) {
    cards.push(
      <View key="courier" style={styles.action}>
        <Txt variant="h3">Demander un livreur</Txt>
        <Txt variant="caption">{FULFILLMENT_LABELS[order.fulfillmentMode]}</Txt>
        <Button title="Demander un livreur FripCash" onPress={onRequestCourier} loading={busy} full />
        {['PAID', 'SELLER_NOTIFIED', 'PREPARING'].includes(order.status) ? (
          <Button title="Rembourser l’acheteur" variant="danger" onPress={onRefund} disabled={busy} full />
        ) : null}
      </View>
    );
  }
  const awaitingHandover = !order.buyerConfirmedAt && HANDOVER_STATUSES.includes(order.status);
  if (isSeller && awaitingHandover) {
    cards.push(
      <View key="handover" style={[styles.action, { backgroundColor: colors.warningSoft }]}>
        <Txt variant="h3">Avant de laisser le colis</Txt>
        <Txt variant="caption">
          Assure-toi toujours que le client a bien appuyé sur « Colis reçu » dans son application avant de lui laisser le colis.
        </Txt>
      </View>
    );
  }
  if (isBuyer && awaitingHandover && order.status !== 'COURIER_ASSIGNED' && !isPickup) {
    const arrived = order.status === 'DELIVERED';
    cards.push(
      <View key="recv" style={styles.action}>
        <Txt variant="h3">{arrived ? 'Colis remis — à toi de vérifier' : 'Ton colis arrive'}</Txt>
        <Txt variant="caption">
          À la remise, ouvre le colis et vérifie l’article, puis appuie sur « Colis reçu ». Le livreur attend cette confirmation
          pour te laisser le colis. Les {formatGnf(order.amountGnf)} partent alors au vendeur : l’action est définitive.
        </Txt>
        <Button title="Colis reçu" icon="cube-outline" onPress={onConfirm} loading={busy} full />
        <Button title="Un problème ? Signaler" variant="ghost" onPress={onDispute} disabled={busy} full />
      </View>
    );
  }
  if (isPickup && isBuyer && order.status === 'DELIVERED' && !order.buyerConfirmedAt) {
    cards.push(
      <View key="recv-pickup" style={styles.action}>
        <Txt variant="h3">Colis remis — à toi de vérifier</Txt>
        <Txt variant="caption">
          Vérifie l’article puis confirme la réception. Les {formatGnf(order.amountGnf)} seront versés au vendeur.
        </Txt>
        <Button title="Colis reçu" icon="cube-outline" onPress={onConfirm} loading={busy} full />
        <Button title="Un problème ? Signaler" variant="ghost" onPress={onDispute} disabled={busy} full />
      </View>
    );
  } else if (isBuyer && !['REFUNDED', 'FUNDS_RELEASED', 'FEEDBACK_PENDING', 'DISPUTED'].includes(order.status)) {
    cards.push(
      <Pressable key="signal" onPress={onDispute} style={{ alignSelf: 'center', padding: 8 }}>
        <Txt variant="label" color={colors.primary}>
          Un problème ? Signaler
        </Txt>
      </Pressable>
    );
  }
  if (isBuyer && ['DELIVERED', 'FUNDS_RELEASED', 'FEEDBACK_PENDING'].includes(order.status)) {
    cards.push(
      order.reviewed ? (
        <View key="review" style={styles.action}>
          <Txt variant="h3">Merci pour ton avis</Txt>
          <Txt variant="caption">Il aide les autres acheteurs à choisir.</Txt>
        </View>
      ) : (
        <View key="review" style={styles.action}>
          <Txt variant="h3">Comment s’est passée la commande ?</Txt>
          <Button title="Laisser un avis" variant="secondary" onPress={onReview} full />
        </View>
      )
    );
  }

  return <>{cards}</>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 8 },
  pin: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    padding: 10,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  pinImg: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  pickupDigits: {
    fontFamily: fonts.bold,
    fontSize: 32,
    letterSpacing: 8,
    textAlign: 'center',
    color: '#1F5C45',
    marginTop: 8,
  },
  bubble: { maxWidth: '82%', padding: 12, borderRadius: 16, gap: 4 },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.white, borderBottomLeftRadius: 4 },
  event: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.secondary,
    alignItems: 'flex-start',
  },
  action: {
    padding: 16,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 110,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
  },
  send: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
