import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, Share, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FavoriteButton } from '@/components/catalog/favorite-button';
import { ListingCard, listingCondition } from '@/components/catalog/listing-card';
import { CartSheet } from '@/components/commerce/cart-screen';
import {
  Avatar,
  Button,
  ConfirmDialog,
  ErrorState,
  IconButton,
  Input,
  PageSkeleton,
  Screen,
  ScreenHeader,
  Sheet,
  StickyFooter,
  toast,
  Txt,
} from '@/components/ui';
import { useAuth, useListing, useListings, useMe, useSeller, useTariffs } from '@/hooks/queries';
import { useCart } from '@/hooks/use-cart';
import { useRequireAuth } from '@/hooks/use-require-auth';
import {
  createConversation,
  createListingComment,
  createOffer,
  errorMessage,
  fetchListingComments,
  fetchListingReviews,
  listingImages,
  mediaUrl,
  reportContent,
} from '@/lib/api';
import { formatGnf, formatRelative } from '@/lib/format';
import { goHome } from '@/lib/nav';
import { tariffAmountGnf } from '@/lib/shipping';
import { appLink } from '@/lib/web';
import { colors, fonts, radius } from '@/theme';
import { useQuery } from '@tanstack/react-query';

function reviewWhen(value?: string) {
  if (!value) return '';
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
  if (days >= 1 && days < 30) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
  return formatRelative(value);
}

const SWATCHES: Record<string, string> = {
  rouge: '#D64545',
  noir: '#1C1C1C',
  bleu: '#7EA0D6',
  vert: '#6E8A72',
  blanc: '#F7F4F1',
  beige: '#E6D3C4',
  rose: '#E7A0B0',
  jaune: '#E6C15A',
  marron: '#8C5A3C',
  orange: '#D4783A',
  violet: '#8E79C8',
  gris: '#B7B1AC',
};

function swatchHex(name: string) {
  const key = name.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return SWATCHES[key] ?? colors.surfaceMuted;
}

function listedColors(listing: { colors?: string[] | null; description: string | null }) {
  const named = listing.colors?.map((c) => c.trim()).filter(Boolean) ?? [];
  if (named.length) return named;
  const match = listing.description?.match(/couleurs?\s*:\s*([^\n.]+)/i);
  if (!match) return [];
  return match[1]
    .split(/[,/]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function listedSize(listing: { size?: string | null; description: string | null }) {
  if (listing.size?.trim()) return listing.size.trim();
  const match = listing.description?.match(/taille\s*:\s*([A-Za-z0-9/]+)/i);
  return match?.[1] ?? '';
}

function listedBrand(listing: { brand?: string | null; title: string }) {
  if (listing.brand?.trim()) return listing.brand.trim();
  const match = listing.title.match(/^(.{2,24}?)\s[–—-]\s+\S/);
  return match?.[1] ?? '';
}

function reviewName(review: { authorName?: string | null; userName?: string | null; user?: { displayName?: string | null; pseudo?: string | null } | null }) {
  return review.authorName || review.userName || review.user?.displayName || review.user?.pseudo || '';
}

function Stars({ value, size = 14 }: { value?: number; size?: number }) {
  const score = Math.round(value ?? 0);
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons key={n} name={n <= score ? 'star' : 'star-outline'} size={size} color={colors.star} />
      ))}
    </View>
  );
}

function kindLabel(sellerKind?: string | null, shopKind?: string | null) {
  if (sellerKind === 'particulier' || (!shopKind && sellerKind !== 'boutique')) return 'Particulier';
  if (shopKind === 'proximite') return 'Commerce local';
  if (shopKind === 'enseigne') return 'Enseigne';
  return 'Boutique';
}

export default function ArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listingQ = useListing(id);
  const listing = listingQ.data;
  const cart = useCart();
  const requireAuth = useRequireAuth();
  const [offerOpen, setOfferOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [commentsShown, setCommentsShown] = useState(5);
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [descOpen, setDescOpen] = useState(false);
  const { isAuthed } = useAuth();
  const me = useMe();
  const tariffs = useTariffs();
  const shop = useSeller(listing?.sellerProfile?.id);

  const comments = useQuery({
    queryKey: ['listing-comments', id],
    queryFn: () => fetchListingComments(id),
    enabled: !!id,
  });
  const reviews = useQuery({
    queryKey: ['listing-reviews', id],
    queryFn: () => fetchListingReviews(id),
    enabled: !!id,
  });
  const similar = useListings({ categoryId: listing?.categoryId || undefined, limit: 8 }, !!listing?.categoryId);

  const { refetch: refetchListing } = listingQ;
  useFocusEffect(
    useCallback(() => {
      refetchListing();
    }, [refetchListing]),
  );

  const images = listing ? listingImages(listing) : [];
  const soldOut = !listing || listing.quantity <= 0 || listing.status === 'SOLD' || listing.status === 'SOLD_OUT';

  const addToCart = async () => {
    if (!listing) return;
    if (soldOut) {
      toast.error('Stock épuisé');
      return;
    }
    if (cart.lines.some((line) => line.listingId === listing.id)) {
      setCartOpen(true);
      return;
    }
    try {
      await cart.add({ listing, quantity: 1 });
      setCartOpen(true);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const contact = () =>
    requireAuth(async () => {
      try {
        const conv = await createConversation({
          listingId: id,
          participantIds: listing?.sellerProfile?.userId ? [listing.sellerProfile.userId] : undefined,
        });
        router.push({ pathname: '/messages/[id]', params: { id: conv.id } });
      } catch (e) {
        toast.error(errorMessage(e));
      }
    }, 'Connecte-toi pour écrire au vendeur.');

  const sendOffer = () =>
    requireAuth(async () => {
      const amount = Number(offerAmount.replace(/\s/g, ''));
      if (!amount || amount <= 0) return;
      setBusy(true);
      try {
        await createOffer(id, amount);
        toast.success('Offre envoyée');
        setOfferOpen(false);
        setOfferAmount('');
      } catch (e) {
        toast.error(errorMessage(e));
      } finally {
        setBusy(false);
      }
    });

  const sendComment = () =>
    requireAuth(async () => {
      if (!comment.trim() || sending) return;
      setSending(true);
      try {
        await createListingComment(id, comment.trim());
        setComment('');
        await comments.refetch();
        toast.success('Commentaire publié');
      } catch (e) {
        toast.error(errorMessage(e));
      } finally {
        setSending(false);
      }
    }, 'Connecte-toi pour commenter.');

  if (listingQ.isLoading) {
    return (
      <Screen scroll={false} padded={false}>
        <ScreenHeader />
        <PageSkeleton kind="product" />
      </Screen>
    );
  }
  if (!listing) {
    return (
      <Screen>
        <ScreenHeader />
        <ErrorState error={listingQ.error ?? new Error('Article introuvable')} onRetry={() => listingQ.refetch()} />
      </Screen>
    );
  }

  const seller = listing.sellerProfile;
  const sellerName = seller?.shopName || seller?.displayName || '';
  const own =
    (!!me.data?.seller?.profileId && me.data.seller.profileId === listing.sellerProfileId) ||
    (!!me.data?.seller?.id && me.data.seller.id === listing.sellerProfileId);
  const buyerOk = !isAuthed || (!me.data?.isAdmin && me.data?.canBuy !== false);
  const showCart = buyerOk;
  const showMessage = buyerOk && !own;
  const showOffer = !!listing.negotiable && listing.destination !== 'ENSEIGNES' && buyerOk && !own;
  const zoneId = me.data?.shippingZoneId ?? '';
  const shipping = tariffAmountGnf(tariffs.data ?? [], listing.zoneId, zoneId);
  const incl = listing.priceGnf + shipping;
  const activeImage = images[photo] || images[0];
  const heroH = Math.round(Math.min(width * 1.15, 520));
  const description = listing.description?.trim() ?? '';
  const descLong = description.length > 110;
  const related = (similar.data ?? []).filter((item) => item.id !== listing.id).slice(0, 6);
  const frequent = (shop.data?.listingsCount ?? 0) >= 4;
  const size = listedSize(listing);
  const brand = listedBrand(listing);
  const palette = listedColors(listing);
  const offerReady = Number(offerAmount.replace(/\s/g, '')) > 0;
  const reviewRows = reviews.data ?? [];
  const commentRows = comments.data ?? [];
  const deliveryLine = shop.data?.deliveryDelay
    ? `Livraison en ${shop.data.deliveryDelay}`
    : seller?.shopKind === 'proximite'
      ? 'Retrait en boutique ou livraison de proximité'
      : '';

  return (
    <Screen
      padded={false}
      edges={[]}
      background={colors.white}
      skeleton="product"
      footer={
        showCart || showOffer ? (
          <StickyFooter>
            <View style={styles.footer}>
              {showOffer ? (
                <Button title="Faire une offre" variant="outline" size="lg" onPress={() => requireAuth(() => setOfferOpen(true))} style={{ flex: 1 }} />
              ) : null}
              {showCart ? (
                <Button
                  title="Acheter"
                  size="lg"
                  variant={soldOut ? 'muted' : 'primary'}
                  onPress={addToCart}
                  loading={cart.adding}
                  style={{ flex: 1 }}
                />
              ) : null}
            </View>
          </StickyFooter>
        ) : null
      }>
      <View>
        {activeImage ? (
          <Pressable onPress={() => setZoom(true)} accessibilityLabel="Agrandir la photo">
            <Image source={{ uri: activeImage }} style={{ width, height: heroH }} contentFit="cover" />
          </Pressable>
        ) : (
          <View style={[styles.heroEmpty, { width, height: heroH * 0.7 }]}>
            <Ionicons name="image-outline" size={40} color={colors.textSubtle} />
          </View>
        )}
        <View style={[styles.heroNav, { top: insets.top + 10 }]} pointerEvents="box-none">
          <IconButton icon="chevron-back" label="Retour" color={colors.white} background="rgba(43,23,20,0.72)" onPress={goHome} />
          <IconButton
            icon="ellipsis-horizontal"
            label="Plus"
            color={colors.white}
            background="rgba(43,23,20,0.72)"
            onPress={() => setMoreOpen(true)}
          />
        </View>
        {listing.quantity > 0 ? (
          <View style={[styles.stockPill, { top: insets.top + 62 }]}>
            <Txt style={styles.stockPillText}>Stock : {listing.quantity}</Txt>
          </View>
        ) : null}
        <View style={styles.heartPill}>
          <FavoriteButton listingId={listing.id} pill count={listing.favoritesCount} />
        </View>
      </View>

      {images.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbScroll} contentContainerStyle={styles.thumbs}>
          {images.map((uri, index) => (
            <Pressable key={`${uri}-${index}`} onPress={() => setPhoto(index)}>
              <Image source={{ uri }} style={[styles.thumb, photo === index && styles.thumbOn]} contentFit="cover" />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.body}>
        <Txt style={styles.title}>{listing.title}</Txt>
        <Txt style={styles.meta}>
          {[size, listingCondition(listing)].filter(Boolean).join(' · ')}
          {brand ? <Txt style={styles.metaBrand}> · {brand}</Txt> : null}
        </Txt>

        {listing.negotiable && showOffer ? (
          <View style={styles.accepted}>
            <Txt style={styles.acceptedText}>Prix négociable : fais une offre au vendeur</Txt>
          </View>
        ) : null}

        <Txt style={styles.price}>{formatGnf(listing.priceGnf)}</Txt>
        <View style={styles.inclRow}>
          {shipping > 0 ? <Txt style={styles.incl}>{formatGnf(incl)} incl.</Txt> : null}
          <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
          <Txt style={styles.incl}>Protection acheteur</Txt>
        </View>
        {deliveryLine ? <Txt style={styles.deliver}>{deliveryLine}</Txt> : null}
        <Txt style={[styles.stockLine, soldOut && { color: colors.error }]}>
          {soldOut ? 'Épuisé' : `Stock disponible : ${listing.quantity}`}
        </Txt>
        {palette.length ? (
          <View style={styles.swatches} accessibilityLabel={`Couleurs : ${palette.join(', ')}`}>
            {palette.map((name, index) => (
              <View key={`${name}-${index}`} style={styles.swatchItem}>
                <View style={[styles.swatch, { backgroundColor: swatchHex(name) }, name.toLowerCase() === 'blanc' && styles.swatchLight]} />
                <Txt variant="caption">{name}</Txt>
              </View>
            ))}
          </View>
        ) : null}

        {description ? (
          <View style={styles.block}>
            <View style={styles.rule} />
            <Txt style={styles.blockTitle}>Description</Txt>
            <Txt style={styles.desc} numberOfLines={descOpen ? undefined : 3}>
              {description}
            </Txt>
            {descLong ? (
              <Pressable onPress={() => setDescOpen((v) => !v)} hitSlop={6}>
                <Txt style={styles.more}>{descOpen ? 'Réduire' : '… plus'}</Txt>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {seller ? (
          <View style={styles.seller}>
            <Pressable
              onPress={() => router.push({ pathname: '/boutique/[id]', params: { id: seller.id } })}
              style={styles.sellerMain}>
            <Avatar uri={mediaUrl(seller.avatarUrl)} name={sellerName} size={48} />
            <View style={{ flex: 1, gap: 3 }}>
              <Txt style={styles.sellerName} numberOfLines={1}>
                {sellerName}
              </Txt>
              <View style={styles.kind}>
                <Txt style={styles.kindText}>{kindLabel(seller.sellerKind, seller.shopKind)}</Txt>
              </View>
              <View style={styles.sellerStars}>
                <Stars value={seller.rating} size={13} />
                {seller.reviewsCount ? <Txt style={styles.starCount}>({seller.reviewsCount})</Txt> : null}
              </View>
              {frequent ? (
                <View style={styles.kind}>
                  <Txt style={styles.kindText}>Publications fréquentes</Txt>
                </View>
              ) : null}
            </View>
            </Pressable>
            {showMessage ? (
              <Button title="Demander" variant="outline" size="sm" onPress={contact} />
            ) : null}
          </View>
        ) : null}

        <View style={styles.block}>
          <Txt style={styles.blockTitle}>Avis ({reviewRows.length})</Txt>
          {reviewRows.length ? (
            reviewRows.slice(0, 4).map((review) => {
              const name = reviewName(review);
              return (
                <View key={review.id} style={styles.review}>
                  <View style={styles.reviewTop}>
                    <Txt style={styles.reviewName}>{name || 'Avis'}</Txt>
                    <Txt variant="caption">{reviewWhen(review.createdAt)}</Txt>
                  </View>
                  <Stars value={review.rating} size={13} />
                  {review.comment ? <Txt style={styles.desc}>{review.comment}</Txt> : null}
                </View>
              );
            })
          ) : (
            <Txt variant="caption">Pas encore d’avis.</Txt>
          )}
        </View>

        <View style={styles.block}>
          <Txt style={styles.blockTitle}>Questions & commentaires ({commentRows.length})</Txt>
          {commentRows.slice(0, commentsShown).map((c) => (
            <View key={c.id} style={styles.review}>
              <View style={styles.reviewTop}>
                <Txt style={styles.reviewName}>{c.authorName || 'Membre FripCash'}</Txt>
                <Txt variant="caption">{reviewWhen(c.createdAt)}</Txt>
              </View>
              <Txt style={styles.desc}>{c.body}</Txt>
            </View>
          ))}
          {commentRows.length > commentsShown ? (
            <Pressable onPress={() => setCommentsShown((n) => n + 5)} hitSlop={6}>
              <Txt variant="label" color={colors.primary}>
                Voir plus de commentaires
              </Txt>
            </Pressable>
          ) : null}
          {!commentRows.length ? <Txt variant="caption">Pose ta question au vendeur ici.</Txt> : null}
          {!me.data?.isAdmin ? (
            <View style={{ gap: 8 }}>
              <Input value={comment} onChangeText={setComment} placeholder="Écrire un commentaire…" multiline />
              <Button
                title="Publier"
                size="sm"
                onPress={sendComment}
                loading={sending}
                disabled={!comment.trim()}
              />
            </View>
          ) : null}
        </View>

        <View style={styles.protect}>
          <View style={styles.protectIcon}>
            <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Txt style={styles.blockTitle}>Frais de Protection acheteur</Txt>
            <Txt style={styles.desc}>
              Pour tout achat via « Acheter », des frais s’appliquent pour couvrir la Protection acheteur et la politique de remboursement.
            </Txt>
          </View>
        </View>

        {related.length ? (
          <View style={styles.block}>
            <Txt style={styles.blockTitle}>Articles similaires</Txt>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={{ gap: 10, paddingRight: 16 }}>
              {related.map((item) => (
                <ListingCard key={item.id} listing={item} width={150} />
              ))}
            </ScrollView>
          </View>
        ) : null}
      </View>

      <Sheet visible={offerOpen} onClose={() => setOfferOpen(false)} title="Faire une offre">
        <View style={{ gap: 14 }}>
          <Txt style={styles.desc}>{listing.title}</Txt>
          <View style={styles.totalRow}>
            <Txt style={styles.meta}>Prix affiché</Txt>
            <Txt style={styles.linePrice}>{formatGnf(listing.compareAtPriceGnf && listing.compareAtPriceGnf > listing.priceGnf ? listing.compareAtPriceGnf : listing.priceGnf)}</Txt>
          </View>
          <Input
            value={offerAmount}
            onChangeText={setOfferAmount}
            keyboardType="numeric"
            placeholder="Ton offre (GNF)"
          />
          <Pressable
            onPress={sendOffer}
            disabled={!offerReady || busy}
            style={[styles.send, (!offerReady || busy) && styles.sendOff]}>
            <Txt style={[styles.sendText, (!offerReady || busy) && { color: colors.textSubtle }]}>
              {busy ? 'Envoi…' : 'Envoyer l’offre'}
            </Txt>
          </Pressable>
        </View>
      </Sheet>

      <CartSheet visible={cartOpen} onClose={() => setCartOpen(false)} />

      <Sheet visible={moreOpen} onClose={() => setMoreOpen(false)} title="Article">
        <View style={{ gap: 8 }}>
          <Button
            title="Partager"
            variant="outline"
            icon="share-outline"
            onPress={() => {
              setMoreOpen(false);
              const url = appLink(`/article/${listing.id}`);
              Share.share({ message: `${listing.title} sur FripCash : ${url}`, url }).catch(() => {});
            }}
            full
          />
          <Button
            title="Signaler"
            variant="danger"
            icon="flag-outline"
            onPress={() => {
              setMoreOpen(false);
              setReportOpen(true);
            }}
            full
          />
        </View>
      </Sheet>

      <Modal visible={zoom} transparent animationType="fade" onRequestClose={() => setZoom(false)}>
        <Pressable style={styles.zoom} onPress={() => setZoom(false)} accessibilityLabel="Fermer">
          {activeImage ? <Image source={{ uri: activeImage }} style={{ width, height: width }} contentFit="contain" /> : null}
        </Pressable>
      </Modal>

      <ConfirmDialog
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        title="Signaler l'article"
        message="Décris le problème. Notre équipe examinera le signalement."
        confirmLabel="Envoyer"
        tone="danger"
        icon="flag-outline"
        loading={busy}
        onConfirm={async () => {
          if (reportReason.trim().length < 3) {
            toast.error('Décris le problème en quelques mots (3 caractères minimum).');
            return;
          }
          setBusy(true);
          try {
            await reportContent({ listingId: id, reason: reportReason.trim() });
            toast.success('Signalement envoyé');
            setReportOpen(false);
            setReportReason('');
          } catch (e) {
            toast.error(errorMessage(e));
          } finally {
            setBusy(false);
          }
        }}>
        <Input value={reportReason} onChangeText={setReportReason} placeholder="Raison" multiline />
      </ConfirmDialog>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroEmpty: { backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  heroNav: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stockPill: {
    position: 'absolute',
    top: 64,
    left: 16,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  stockPillText: { fontFamily: fonts.bold, fontSize: 12, color: colors.warning },
  heartPill: { position: 'absolute', right: 14, bottom: 14 },
  thumbScroll: { flexGrow: 0 },
  thumbs: { gap: 8, paddingHorizontal: 16, paddingTop: 10 },
  thumb: { width: 58, height: 58, borderRadius: radius.md, borderWidth: 2, borderColor: 'transparent' },
  thumbOn: { borderColor: colors.primary },
  body: { padding: 16, gap: 8, paddingBottom: 24 },
  title: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 28, color: colors.text, marginTop: 6 },
  meta: { fontFamily: fonts.medium, fontSize: 14, color: colors.textMuted },
  metaBrand: { fontFamily: fonts.semibold, fontSize: 14, color: colors.primary },
  accepted: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 4,
  },
  acceptedText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.primaryDark },
  price: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 34, color: colors.text, marginTop: 4 },
  inclRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  incl: { fontFamily: fonts.medium, fontSize: 13, color: colors.textMuted },
  deliver: { fontFamily: fonts.medium, fontSize: 14, color: colors.textMuted },
  stockLine: { fontFamily: fonts.bold, fontSize: 14, color: colors.warning },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 6 },
  swatchItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 18, height: 18, borderRadius: 9 },
  swatchLight: { borderWidth: 1, borderColor: colors.border },
  block: { gap: 8, marginTop: 8 },
  rule: { height: 1, backgroundColor: colors.border, marginBottom: 8 },
  blockTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  desc: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: colors.textMuted },
  more: { fontFamily: fonts.bold, fontSize: 14, color: colors.primary },
  seller: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  sellerMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  sellerName: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  kind: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  kindText: { fontFamily: fonts.semibold, fontSize: 11, color: colors.primaryDark },
  sellerStars: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  starCount: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted },
  review: { gap: 4, paddingVertical: 6 },
  reviewTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewName: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  protect: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
  },
  protectIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bleed: { flexGrow: 0, marginHorizontal: -16, paddingLeft: 16 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 6 },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  linePrice: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  send: {
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendOff: { backgroundColor: colors.surfaceMuted },
  sendText: { fontFamily: fonts.bold, fontSize: 15, color: colors.white },
  zoom: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
});
