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
  Segmented,
  Sheet,
  toast,
  Txt,
} from '@/components/ui';
import { CourierIntro } from '@/components/commerce/courier-intro';
import {
  qk,
  useAuth,
  useConversations,
  useDisputes,
  useMarkOrderRead,
  useMarkThreadRead,
  useMe,
  useMessages,
  useOrder,
} from '@/hooks/queries';
import {
  acceptOrderOffer,
  cancelAfterRefuse,
  confirmReception,
  createConversation,
  errorMessage,
  openDispute,
  payFullAfterRefuse,
  recallCourier,
  refuseOrderOffer,
  requestCourier,
  reviewOrder,
  sellerRefund,
  sendMessage,
  transitionOrder,
  verifyOrderPickupCode,
  type Order,
  type OrderConversationPair,
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

type ViewerRole = 'buyer' | 'seller';

/** Une étape peut se lire différemment selon qu'on est l'acheteur ou le vendeur du colis. */
function eventCopy(status: string, order: Order, role: ViewerRole) {
  const name = order.courierName || 'le livreur';
  const buyer = role === 'buyer';
  const ready =
    order.fulfillmentMode === 'pickup'
      ? buyer
        ? { title: 'Prête au retrait', text: 'Présente ton code au vendeur pour récupérer la commande.' }
        : { title: 'Prête pour le retrait', text: 'Remets le colis quand l’acheteur te présente son code.' }
      : buyer
        ? { title: 'Prête à récupérer', text: 'Un livreur peut prendre en charge le colis.' }
        : { title: 'Colis prêt', text: 'Notifie un livreur pour qu’il vienne récupérer le colis.' };
  switch (status) {
    case 'PAID':
      return buyer
        ? { title: 'Payé — paiement protégé', text: 'FripCash conserve le montant jusqu’à ta confirmation de réception.' }
        : { title: 'Commande payée', text: 'Le client a payé. Le montant reste bloqué jusqu’à sa confirmation de réception.' };
    case 'SELLER_NOTIFIED':
      return buyer
        ? { title: 'Vendeur notifié', text: 'La boutique a été informée de ta commande.' }
        : { title: 'Nouvelle commande', text: 'Le client a payé : prépare sa commande.' };
    case 'PREPARING':
      return buyer
        ? { title: 'En préparation', text: 'Le vendeur prépare ton colis.' }
        : { title: 'Colis en préparation', text: 'Prépare la commande, puis notifie un livreur.' };
    case 'READY_FOR_PICKUP':
      return ready;
    case 'COURIER_ASSIGNED':
      return buyer
        ? { title: `Course acceptée — ${name}`, text: `${name} va récupérer le colis puis t’apporter.` }
        : { title: `Livreur assigné — ${name}`, text: `${name} passe récupérer le colis chez toi.` };
    case 'BUYER_CONFIRMED':
      return buyer
        ? { title: 'Colis reçu', text: 'Tu as confirmé la réception : le vendeur peut être payé.' }
        : { title: 'Le client a reçu le colis', text: 'Il a appuyé sur « Colis reçu » : le paiement part vers toi.' };
    case 'COLLECTED':
      return buyer
        ? { title: `Colis récupéré par ${name}`, text: `${name} est en route vers toi.` }
        : { title: 'Colis récupéré', text: `${name} a quitté ta boutique avec le colis.` };
    case 'IN_TRANSIT':
      return buyer
        ? { title: 'En route vers toi', text: `${name} apporte le colis.` }
        : { title: 'En livraison', text: `${name} livre le colis chez le client.` };
    case 'DELIVERED':
      return buyer
        ? { title: 'Colis remis — à toi de vérifier', text: 'Ouvre le colis et vérifie l’article avant de confirmer.' }
        : { title: 'Colis remis au client', text: 'Le client doit appuyer sur « Colis reçu » pour que tu sois payé.' };
    case 'FUNDS_RELEASED':
      return buyer
        ? { title: 'Fonds libérés', text: 'Le paiement a été versé au vendeur.' }
        : { title: 'Paiement reçu', text: 'Le montant de la commande t’a été versé.' };
    case 'DISPUTED':
      return {
        title: 'Litige ouvert',
        text: order.disputeReason || (buyer ? 'Tu as signalé un problème sur cette commande.' : 'Le client a signalé un problème.'),
      };
    case 'REFUNDED':
      return buyer
        ? { title: 'Remboursée', text: 'Le montant a été renvoyé sur ton moyen de paiement.' }
        : { title: 'Remboursement effectué', text: 'Le montant a été renvoyé à l’acheteur.' };
    case 'OFFER_ACCEPTED':
      return {
        title: buyer ? 'Offre acceptée' : 'Tu as accepté l’offre',
        text: order.offerAmountGnf ? `Nouveau montant : ${formatGnf(order.offerAmountGnf)}` : '',
      };
    case 'OFFER_REFUSED':
      return buyer
        ? { title: 'Offre refusée', text: 'Le vendeur a refusé ton offre.' }
        : { title: 'Offre refusée', text: 'Le client peut payer le prix plein ou annuler.' };
    default:
      return { title: ORDER_STATUS_LABELS[status as OrderStatus] || status, text: '' };
  }
}

/** Étapes qui ont du sens dans la discussion avec le livreur. */
const COURIER_STAGES = new Set(['READY_FOR_PICKUP', 'COURIER_ASSIGNED', 'COLLECTED', 'IN_TRANSIT', 'DELIVERED', 'BUYER_CONFIRMED']);
/** Statuts où l'acheteur et le livreur peuvent déjà échanger (colis collecté). */
const BUYER_COURIER_CHAT = new Set(['COLLECTED', 'IN_TRANSIT', 'DELIVERED', 'FUNDS_RELEASED', 'FEEDBACK_PENDING', 'DISPUTED']);

type ChatTab = 'client' | 'courier';

export default function OrderChatScreen() {
  const { id, tab: initialTab } = useLocalSearchParams<{ id: string; tab?: string }>();
  const { user } = useAuth();
  const { data: me } = useMe();
  const client = useQueryClient();
  const orderQ = useOrder(id, 6_000);
  const order = orderQ.data;
  const [tab, setTab] = useState<ChatTab>(initialTab === 'courier' ? 'courier' : 'client');
  const [created, setCreated] = useState<Record<string, string>>({});
  const [chatError, setChatError] = useState<Record<string, string>>({});
  const triedRef = useRef<Record<string, boolean>>({});
  const convos = useConversations(8_000);
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
  const role: ViewerRole = isSeller ? 'seller' : 'buyer';
  /** Deux discussions seulement pour la livraison FripCash : le client d’un côté, le livreur de l’autre. */
  const tabbed = !!order && order.fulfillmentMode === 'courier';
  const pair: OrderConversationPair = tab === 'courier' && tabbed ? (isSeller ? 'seller_courier' : 'buyer_courier') : 'buyer_seller';

  const courierHint = !tabbed || tab !== 'courier' || !order
    ? null
    : isSeller
      ? order.courierId
        ? null
        : 'Aucun livreur n’a encore accepté cette course. Notifie un livreur pour ouvrir la discussion.'
      : BUYER_COURIER_CHAT.has(order.status)
        ? null
        : 'La discussion avec le livreur s’ouvre une fois le colis récupéré.';

  const known = (convos.data ?? []).find((c) => c.orderId === id && (c.pair === pair || (!c.pair && pair === 'buyer_seller')));
  const convId = known?.id ?? created[pair] ?? null;
  const messages = useMessages(convId ?? undefined, 5_000);

  useEffect(() => {
    triedRef.current = {};
    setCreated({});
    setChatError({});
  }, [id]);

  // La discussion d'une paire n'existe qu'une fois les deux rôles réunis : on la crée à l'ouverture de l'onglet.
  useEffect(() => {
    if (!order || convId || courierHint || triedRef.current[pair]) return;
    triedRef.current[pair] = true;
    (async () => {
      try {
        const c = await createConversation(pair === 'buyer_seller' ? { orderId: id } : { orderId: id, with: 'courier' });
        setCreated((prev) => ({ ...prev, [pair]: c.id }));
        client.invalidateQueries({ queryKey: qk.conversations });
      } catch (e) {
        setChatError((prev) => ({ ...prev, [pair]: errorMessage(e) }));
      }
    })();
  }, [id, order, pair, convId, courierHint, client]);

  // Ouvrir une discussion la marque comme lue, côté fil de discussion et côté notifications.
  useMarkThreadRead(convId, messages.data?.length ?? 0);
  useMarkOrderRead(id, order?.updatedAt);

  const feed = useMemo<FeedItem[]>(() => {
    if (!order) return [];
    const items: FeedItem[] = [];
    const courierTab = tab === 'courier' && tabbed;
    for (const t of order.timeline ?? []) {
      if (courierTab && !COURIER_STAGES.has(t.status)) continue;
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
  }, [order, messages.data, myId, tab, tabbed]);

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
  const onCourierTab = tab === 'courier' && tabbed;
  const chatHint = onCourierTab ? courierHint ?? chatError[pair] : null;
  const peerName = onCourierTab ? order.courierName || 'Livreur' : peer?.pseudo || 'Commande';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <LazyMount kind="chat">
      <View style={{ flex: 1 }}>
        <View style={styles.header}>
          <IconButton icon="chevron-back" label="Retour" background={colors.white} onPress={() => router.back()} />
          <Avatar name={peerName} size={40} />
          <View style={{ flex: 1 }}>
            <Txt variant="title" numberOfLines={1}>
              {peerName}
            </Txt>
            <Txt variant="caption" numberOfLines={1}>
              {onCourierTab
                ? FULFILLMENT_LABELS[order.fulfillmentMode]
                : isBuyer
                  ? shopKindLabel(order.seller?.sellerKind, order.seller?.shopKind)
                  : 'Acheteur'}
              {' · '}
              {ORDER_STATUS_LABELS[order.status]}
            </Txt>
          </View>
        </View>

        {tabbed ? (
          <View style={styles.tabs}>
            <Segmented
              value={tab}
              onChange={setTab}
              options={[
                { value: 'client', label: isBuyer ? 'Vendeur' : 'Acheteur' },
                { value: 'courier', label: 'Livreur' },
              ]}
            />
          </View>
        ) : null}

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
              label={order.escrowStatus === 'blocked' ? 'Payé · protégé' : ORDER_STATUS_LABELS[order.status]}
              tone={order.escrowStatus === 'blocked' ? 'warning' : orderStatusTone(order.status)}
            />
          </View>
          {first?.listingId ? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} /> : null}
        </Pressable>

        {chatHint ? (
          <View style={styles.notice}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
            <Txt variant="caption" style={{ flex: 1 }}>
              {chatHint}
            </Txt>
          </View>
        ) : null}

        <FlatList
          ref={listRef}
          data={feed}
          key={pair}
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
              const copy = eventCopy(item.status, item.order, role);
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
                scope={onCourierTab ? 'courier' : 'client'}
                onConfirm={() => setConfirmOpen(true)}
                onDispute={() => setDisputeOpen(true)}
                onReview={() => setReviewOpen(true)}
                onPrepare={() => run(() => transitionOrder(order.id, 'PREPARING'), 'Commande en préparation')}
                onRequestCourier={() => run(() => requestCourier(order.id), 'Livreur de ta zone notifié')}
                onRecallCourier={() => run(() => recallCourier(order.id), 'Course reproposée aux livreurs de la zone')}
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
            placeholder={onCourierTab ? 'Écrire au livreur…' : 'Écrire un message…'}
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
        <Input
          value={disputeReason}
          onChangeText={setDisputeReason}
          placeholder="Ex. article endommagé"
          multiline
          style={{ minHeight: 96, textAlignVertical: 'top' }}
        />
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
  scope,
  onConfirm,
  onDispute,
  onReview,
  onPrepare,
  onRequestCourier,
  onRecallCourier,
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
  /** Onglet de discussion affiché : les cartes liées au livreur ne sortent que dans celui du livreur. */
  scope: ChatTab;
  onConfirm: () => void;
  onDispute: () => void;
  onReview: () => void;
  onPrepare: () => void;
  onRequestCourier: () => void;
  onRecallCourier: () => void;
  onAcceptOffer: () => void;
  onRefuseOffer: () => void;
  onPayFull: () => void;
  onCancel: () => void;
  onRefund: () => void;
  onVerifyPickup: (code: string) => void;
}) {
  const cards: React.ReactNode[] = [];
  const isPickup = order.fulfillmentMode === 'pickup';
  const withCourier = order.fulfillmentMode === 'courier';
  const courierScope = withCourier && scope === 'courier';
  const [sellerCode, setSellerCode] = useState('');

  const recvCard = (key: string) => {
    const arrived = order.status === 'DELIVERED';
    return (
      <View key={key} style={styles.action}>
        <Txt variant="h3">{arrived ? 'Colis remis — à toi de vérifier' : 'Ton colis arrive'}</Txt>
        <Txt variant="caption">
          À la remise, ouvre le colis et vérifie l’article, puis appuie sur « Colis reçu ». Le livreur attend cette confirmation
          pour te laisser le colis. Le vendeur est alors payé : l’action est définitive et tu ne pourras plus ouvrir de
          litige. En cas de souci, signale-le avant de confirmer.
        </Txt>
        <Button title="Colis reçu" icon="cube-outline" onPress={onConfirm} loading={busy} full />
        <Button title="Un problème ? Signaler" variant="ghost" onPress={onDispute} disabled={busy} full />
      </View>
    );
  };

  const awaitingCourier =
    withCourier && !order.courierId && ['PAID', 'SELLER_NOTIFIED', 'PREPARING', 'READY_FOR_PICKUP'].includes(order.status);
  const courierAssigned = withCourier && order.status === 'COURIER_ASSIGNED' && !!order.courierId;

  /** Cartes « livraison » du vendeur : notifier les livreurs de la zone, ou rappeler celui qui a accepté. */
  const sellerCourierCards = (prefix: string) => {
    const out: React.ReactNode[] = [];
    if (!isSeller) return out;
    if (awaitingCourier) {
      const notified = order.status === 'READY_FOR_PICKUP';
      out.push(
        <View key={`${prefix}-notify`} style={styles.action}>
          <Txt variant="h3">{notified ? 'En attente d’un livreur' : 'Pas encore de livreur'}</Txt>
          <Txt variant="caption">
            {notified
              ? 'Les livreurs de la zone ont été notifiés. Le premier qui accepte la course rejoint l’onglet « Livreur ».'
              : 'Quand le colis est prêt, notifie les livreurs de la zone de collecte. Le premier qui accepte prend la course.'}
          </Txt>
          <Button
            title={notified ? 'Notifier à nouveau' : 'Notifier le livreur'}
            icon="megaphone-outline"
            variant={notified ? 'outline' : 'primary'}
            onPress={onRequestCourier}
            loading={busy}
            full
          />
          {['PAID', 'SELLER_NOTIFIED', 'PREPARING'].includes(order.status) ? (
            <Button title="Rembourser l’acheteur" variant="danger" onPress={onRefund} disabled={busy} full />
          ) : null}
        </View>
      );
    }
    if (courierAssigned) {
      out.push(
        <View key={`${prefix}-recall`} style={styles.action}>
          <Txt variant="h3">{`Livreur : ${order.courierName || '—'}`}</Txt>
          <Txt variant="caption">
            Tant qu’il n’a pas récupéré le colis, tu peux annuler sa course et la reproposer aux livreurs de la zone.
          </Txt>
          <Button title="Rappeler un livreur" variant="outline" icon="refresh-outline" onPress={onRecallCourier} loading={busy} full />
        </View>
      );
    }
    return out;
  };

  /** Onglet « Livreur » : uniquement ce qui concerne la course, côté vendeur comme côté client. */
  if (courierScope) {
    const awaitingHandover = !order.buyerConfirmedAt && HANDOVER_STATUSES.includes(order.status);
    cards.push(...sellerCourierCards('courier'));
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
    if (isBuyer && awaitingHandover && order.status !== 'COURIER_ASSIGNED') cards.push(recvCard('recv-courier'));
    return <>{cards}</>;
  }

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
        {!isPickup ? (
          <Button title="Rembourser l’acheteur" variant="danger" onPress={onRefund} disabled={busy} full />
        ) : null}
      </View>
    );
  }
  // Après la préparation, le vendeur notifie le livreur depuis la discussion principale aussi.
  if (order.status !== 'PAID' && order.status !== 'SELLER_NOTIFIED') cards.push(...sellerCourierCards('client'));
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
  const awaitingHandover = !order.buyerConfirmedAt && HANDOVER_STATUSES.includes(order.status);
  if (isSeller && awaitingHandover && !withCourier) {
    cards.push(
      <View key="handover" style={[styles.action, { backgroundColor: colors.warningSoft }]}>
        <Txt variant="h3">Avant de laisser le colis</Txt>
        <Txt variant="caption">
          Assure-toi toujours que le client a bien appuyé sur « Colis reçu » dans son application avant de lui laisser le colis.
        </Txt>
      </View>
    );
  }
  if (isBuyer && awaitingHandover && order.status !== 'COURIER_ASSIGNED' && !isPickup) cards.push(recvCard('recv'));
  if (isPickup && isBuyer && order.status === 'DELIVERED' && !order.buyerConfirmedAt) {
    cards.push(
      <View key="recv-pickup" style={styles.action}>
        <Txt variant="h3">Colis remis — à toi de vérifier</Txt>
        <Txt variant="caption">
          Vérifie l’article puis confirme la réception. Le vendeur sera alors payé et aucun litige ne sera plus possible.
        </Txt>
        <Button title="Colis reçu" icon="cube-outline" onPress={onConfirm} loading={busy} full />
        <Button title="Un problème ? Signaler" variant="ghost" onPress={onDispute} disabled={busy} full />
      </View>
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
  tabs: { paddingHorizontal: 16, paddingBottom: 8 },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
  },
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
