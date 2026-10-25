import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useMemo, useState, type ComponentProps } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  FilterButton,
  FilterSheet,
  hasActiveFilters,
  sortListings,
  type CatalogFilterState,
} from "@/components/catalog/catalog-filters";
import { ListingCard } from "@/components/catalog/listing-card";
import { PickupCodeBanner } from "@/components/catalog/pickup-code-banner";
import { ShopActionsBar } from "@/components/catalog/shop-actions-bar";
import { shopCover } from "@/components/catalog/shop-card";
import { coverContentPosition } from "@/lib/cover-focus";
import { ShopLikeButton } from "@/components/catalog/shop-like-button";
import { ShopMark } from "@/components/catalog/shop-mark";
import { ShopBottomNav } from "@/components/catalog/shop-nav";
import { Chip, IconButton, SectionHeader, Sheet, toast, Txt } from "@/components/ui";
import { useAuth, useCategories } from "@/hooks/queries";
import { useRequireAuth } from "@/hooks/use-require-auth";
import {
  createConversation,
  errorMessage,
  fetchSellerReviews,
  reportContent,
  type Listing,
  type PublicShop,
} from "@/lib/api";
import { listingImages } from "@/lib/api/media";
import { formatNumber } from "@/lib/format";
import { goHome } from "@/lib/nav";
import { appLink } from "@/lib/web";
import { colors, fonts, radius } from "@/theme";

type Kind = "dressing" | "neuf" | "quartier" | "enseigne";

function kindOf(shop: PublicShop): Kind {
  if (shop.sellerKind === "particulier" || !shop.shopKind) return "dressing";
  if (shop.shopKind === "proximite") return "quartier";
  if (shop.shopKind === "enseigne") return "enseigne";
  return "neuf";
}

const ALL = "Tout";

function norm(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

type IconName = ComponentProps<typeof Ionicons>["name"];

const CATEGORY_ICONS: [string, IconName][] = [
  ["mode", "shirt-outline"],
  ["vetement", "shirt-outline"],
  ["chaussure", "footsteps-outline"],
  ["accessoire", "bag-handle-outline"],
  ["sac", "bag-handle-outline"],
  ["beaute", "color-wand-outline"],
  ["cosmet", "color-wand-outline"],
  ["parfum", "color-wand-outline"],
  ["hygiene", "sparkles-outline"],
  ["maison", "home-outline"],
  ["deco", "home-outline"],
  ["menage", "home-outline"],
  ["electro", "tv-outline"],
  ["high", "headset-outline"],
  ["tech", "phone-portrait-outline"],
  ["telephone", "phone-portrait-outline"],
  ["epicerie", "cart-outline"],
  ["aliment", "nutrition-outline"],
  ["frais", "nutrition-outline"],
  ["boisson", "wine-outline"],
  ["enfant", "happy-outline"],
  ["sport", "football-outline"],
];

function categoryIcon(label: string): IconName {
  if (label === ALL) return "apps-outline";
  const key = norm(label);
  return CATEGORY_ICONS.find(([word]) => key.includes(word))?.[1] ?? "pricetag-outline";
}

const PRODUCT_VARIANT = {
  dressing: "secondHand",
  neuf: "newItem",
  quartier: "localStore",
  enseigne: "brandStore",
} as const;

export function ShopSheet({ shop }: { shop: PublicShop }) {
  const kind = kindOf(shop);
  const insets = useSafeAreaInsets();
  const { isAuthed } = useAuth();
  const requireAuth = useRequireAuth();
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [dressingInfoH, setDressingInfoH] = useState(0);
  const { width } = useWindowDimensions();
  const productGap = 13;
  const productCols = 3;
  const productW = Math.floor(
    (width - 32 - productGap * (productCols - 1)) / productCols,
  );
  const coverH = Math.round(Math.min(340, Math.max(176, (width - 32) * 0.5)));
  const promoH = Math.round(Math.min(175, Math.max(132, width * 0.255)));
  const flowNav = kind === "dressing" || kind === "enseigne";
  const [chip, setChip] = useState(ALL);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<CatalogFilterState>({
    sort: "recent",
  });
  const categories = useCategories();
  const listings = useMemo(() => shop.listings ?? [], [shop.listings]);
  const sellerReviews = useQuery({
    queryKey: ["seller-reviews", shop.id],
    queryFn: () => fetchSellerReviews(shop.id),
    enabled: reviewsOpen,
  });
  const categoryOf = useMemo(() => {
    const names = new Map(
      (categories.data ?? []).map((c) => [c.id, c.nameFr]),
    );
    return (listing: Listing) =>
      listing.category?.nameFr ||
      (listing.categoryId ? names.get(listing.categoryId) : undefined) ||
      "";
  }, [categories.data]);
  const chipLabels = useMemo(() => {
    const seen = new Set<string>();
    return [
      ...(shop.soldCategories ?? []),
      ...(shop.listingCategories ?? []),
      ...listings.map(categoryOf),
    ].filter((label) => {
      const key = norm(label);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [shop.soldCategories, shop.listingCategories, listings, categoryOf]);
  const promoListing =
    listings.find((listing) => listing.discountEnabled) ?? null;
  const shown = useMemo(() => {
    const key = norm(chip);
    const rows =
      chip === ALL
        ? listings
        : listings.filter((listing) => {
            if (norm(categoryOf(listing)) === key) return true;
            const blob = norm(
              `${listing.title} ${listing.conditionNote ?? ""} ${listing.description ?? ""}`,
            );
            return blob.includes(key);
          });
    return sortListings(rows, filters.sort ?? "recent");
  }, [listings, chip, filters.sort, categoryOf]);
  const communes = shop.deliveredCommunes ?? [];
  const count = shop.listingsCount ?? listings.length;
  const place = shop.city || shop.neighborhood || "";
  const back = () => (router.canGoBack() ? router.back() : goHome());
  const share = () => {
    const url = appLink(`/boutique/${shop.id}`);
    Share.share({ message: `${shop.shopName} sur FripCash : ${url}`, url }).catch(() => {});
  };
  const report = async (reason: string) => {
    if (!isAuthed) {
      toast.info("Connecte-toi pour signaler une boutique.");
      router.push("/connexion");
      return;
    }
    try {
      await reportContent({ userId: shop.id, reason });
      toast.success("Signalement envoyé");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };
  const contactShop = () => {
    const listing = listings[0];
    const userId = listing?.sellerProfile?.userId;
    requireAuth(async () => {
      try {
        const conv = await createConversation({
          listingId: listing?.id,
          participantIds: userId ? [userId] : undefined,
        });
        router.push({ pathname: "/messages/[id]", params: { id: conv.id } });
      } catch (e) {
        toast.error(errorMessage(e));
      }
    }, "Connecte-toi pour contacter cette boutique.");
  };

  const menu = () =>
    Alert.alert("Signaler la boutique", "Pourquoi signales-tu cette boutique ?", [
      { text: "Arnaque ou fraude", onPress: () => report("Arnaque ou fraude") },
      { text: "Contrefaçon", onPress: () => report("Contrefaçon") },
      { text: "Contenu inapproprié", onPress: () => report("Contenu inapproprié") },
      { text: "Annuler", style: "cancel" },
    ]);

  const topNav = (
    <View
      pointerEvents="box-none"
      style={[
        flowNav ? styles.topNavFlow : styles.topNav,
        {
          paddingTop: insets.top + 8,
          paddingHorizontal: kind === "neuf" || kind === "quartier" ? 10 : 16,
        },
      ]}
    >
      <IconButton
        icon="chevron-back"
        label="Retour"
        background={colors.white}
        onPress={back}
      />
      <View style={styles.topNavActions} pointerEvents="box-none">
        {kind === "dressing" ? (
          <IconButton
            icon="share-outline"
            label="Partager"
            background={colors.white}
            onPress={share}
          />
        ) : (
          <ShopLikeButton
            sellerId={shop.id}
            likedByMe={shop.likedByMe}
            size={40}
          />
        )}
        <IconButton
          icon={kind === "dressing" ? "flag-outline" : "share-outline"}
          label={kind === "dressing" ? "Signaler" : "Partager"}
          background={colors.white}
          onPress={kind === "dressing" ? menu : share}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      {flowNav ? topNav : null}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: kind === "enseigne" ? 28 : 36 }}
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        {kind !== "dressing" ? (
          <View
            style={[
              styles.heroWrap,
              kind !== "neuf" && kind !== "quartier" && styles.heroInset,
              (kind === "neuf" || kind === "quartier") && { marginBottom: 0 },
              flowNav && { marginTop: 8 },
              kind === "enseigne" && { marginBottom: 0 },
            ]}
          >
            <View
              style={[
                styles.hero,
                (kind === "neuf" || kind === "quartier") && styles.heroBleed,
                kind === "enseigne"
                  ? { height: coverH, borderRadius: 28 }
                  : kind !== "neuf" && kind !== "quartier"
                    ? styles.heroRound
                    : null,
              ]}
            >
              {shopCover(shop) ? (
                <Image
                  source={shopCover(shop)!}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  contentPosition={coverContentPosition(shop.coverUrl)}
                />
              ) : null}
              {kind === "neuf" ? (
                <LinearGradient
                  colors={["rgba(36,20,18,0.05)", "rgba(36,20,18,0.45)"]}
                  style={StyleSheet.absoluteFill}
                />
              ) : null}
            </View>
          </View>
        ) : null}

        <View
          style={[
            styles.sheet,
            (kind === "neuf" || kind === "quartier") && styles.sheetOverlap,
          ]}
        >
          {kind === "enseigne" ? (
            <View style={styles.enseigneHead}>
              <View style={{ flexShrink: 0 }}>
                <ShopMark
                  value={shop.avatarUrl}
                  name={shop.shopName}
                  size={72}
                />
              </View>
              <View style={styles.enseigneNameWrap}>
                <Txt
                  style={[styles.name, styles.nameSerif, styles.nameEnseigne]}
                  numberOfLines={2}
                >
                  {shop.shopName}
                </Txt>
              </View>
            </View>
          ) : null}
          {kind === "neuf" ? (
            <View style={[styles.floatMark, { top: -28 }]}>
              <ShopMark value={shop.avatarUrl} name={shop.shopName} size={72} />
            </View>
          ) : null}

          {kind === "dressing" ? (
            <View style={styles.dressingHead}>
              <ShopMark
                value={shop.avatarUrl}
                name={shop.shopName}
                size={Math.max(80, dressingInfoH)}
              />
              <View
                style={{ flex: 1, gap: 4 }}
                onLayout={(e) => setDressingInfoH(e.nativeEvent.layout.height)}
              >
                <Txt style={[styles.name, styles.nameSerif]} numberOfLines={2}>
                  {shop.shopName}
                </Txt>
                {place ? (
                  <View style={styles.inline}>
                    <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                    <Txt variant="caption">{place}</Txt>
                  </View>
                ) : null}
                <View style={styles.particulierPill}>
                  <Txt style={styles.particulierText}>Particulier</Txt>
                </View>
                <View style={[styles.inline, { flexWrap: "wrap", marginTop: 2 }]}>
                  <Ionicons name="star" size={14} color={colors.star} />
                  <Txt style={styles.rateText}>{(shop.rating ?? 0).toFixed(1)}</Txt>
                  <Txt variant="caption">({formatNumber(shop.reviewsCount)} avis)</Txt>
                  <Txt variant="caption"> · </Txt>
                  <Txt variant="caption">{formatNumber(count)} articles</Txt>
                </View>
                {shop.bio ? <Txt variant="caption">{shop.bio}</Txt> : null}
              </View>
            </View>
          ) : null}

          {kind !== "enseigne" && kind !== "dressing" ? (
            <View
              style={[
                styles.identity,
                kind === "neuf" && { marginTop: 36 },
              ]}
            >
              <View style={{ flex: 1, gap: 4 }}>
                <View style={styles.nameRow}>
                  <Txt
                    style={[styles.name, kind === "neuf" && styles.nameSerif]}
                    numberOfLines={2}
                  >
                    {shop.shopName}
                  </Txt>
                </View>
                {kind !== "neuf" ? (
                  <View style={styles.inline}>
                    <Ionicons
                      name="location"
                      size={14}
                      color={colors.primary}
                    />
                    <Txt variant="caption" color={colors.primaryDark}>
                      {place}
                    </Txt>
                  </View>
                ) : null}
                {shop.storeAddress ? (
                  <Txt variant="small">{shop.storeAddress}</Txt>
                ) : null}
              </View>
              {kind === "quartier" ? (
                <View style={styles.ratePill}>
                  <Ionicons name="star" size={12} color={colors.star} />
                  <Txt style={styles.rateText}>
                    {(shop.rating ?? 0).toFixed(1)} ({shop.reviewsCount ?? 0})
                  </Txt>
                </View>
              ) : null}
            </View>
          ) : null}

          {kind === "neuf" || kind === "enseigne" ? (
            <View
              style={[
                styles.inline,
                { marginTop: kind === "enseigne" ? 4 : 8, flexWrap: "wrap" },
                kind === "enseigne" && { marginLeft: 86 },
              ]}
            >
              <Ionicons
                name="star"
                size={14}
                color={kind === "neuf" ? colors.primary : colors.star}
              />
              <Txt style={styles.rateText}>{(shop.rating ?? 0).toFixed(1)}</Txt>
              <Txt variant="caption">
                ({formatNumber(shop.reviewsCount)} avis)
              </Txt>
              {kind === "neuf" ? (
                <>
                  <View style={styles.vsep} />
                  <View style={styles.inline}>
                    <Ionicons
                      name="bag-outline"
                      size={14}
                      color={colors.primary}
                    />
                    <Txt variant="caption">{formatNumber(count)} articles</Txt>
                  </View>
                </>
              ) : (
                <View style={styles.delivery}>
                  <Ionicons
                    name="car-outline"
                    size={12}
                    color={colors.primary}
                  />
                  <Txt style={styles.deliveryText}>
                    {shop.deliveryDelay
                      ? `Livraison en ${shop.deliveryDelay}`
                      : "Livraison en ville"}
                  </Txt>
                </View>
              )}
            </View>
          ) : null}

          {kind !== "quartier" && communes.length ? (
            <View style={[styles.inline, styles.communes]}>
              <Ionicons name="map-outline" size={14} color={colors.primary} />
              <Txt variant="caption" style={{ flex: 1 }}>
                <Txt style={styles.serviceTitle}>Livre à : </Txt>
                {communes.join(", ")}
              </Txt>
            </View>
          ) : null}

          {kind !== "dressing" && kind !== "neuf" && shop.bio ? (
            <Txt
              variant="body"
              color={colors.textMuted}
              style={{ marginTop: 10 }}
            >
              {shop.bio}
            </Txt>
          ) : null}

          {kind === "dressing" || kind === "neuf" ? (
            <ShopActionsBar onContact={contactShop} onReviews={() => setReviewsOpen(true)} />
          ) : null}

          {(kind === "dressing" || kind === "neuf") && chipLabels.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              {[ALL, ...chipLabels].map((label) => (
                <Chip
                  key={label}
                  label={label}
                  active={chip === label}
                  onPress={() => setChip(label)}
                />
              ))}
            </ScrollView>
          ) : null}

          {shop.vacationEnabled ? (
            <View style={[styles.notice, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="airplane-outline" size={16} color={colors.primaryDark} />
              <Txt variant="caption" style={{ flex: 1 }}>
                En vacances : les articles restent visibles mais ne sont pas commandables pour le moment.
              </Txt>
            </View>
          ) : shop.bundleEnabled && (shop.bundleDiscountPercent ?? 0) > 0 ? (
            <View style={[styles.notice, { backgroundColor: colors.secondary }]}>
              <Ionicons name="pricetags-outline" size={16} color={colors.primaryDark} />
              <Txt variant="caption" style={{ flex: 1 }}>
                Remise lot : −{shop.bundleDiscountPercent} % dès {shop.bundleMinItems || 2} articles achetés ensemble.
              </Txt>
            </View>
          ) : null}

          {kind === "quartier" ? <PickupCodeBanner /> : null}

          {kind === "enseigne" && chipLabels.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tileScroll}
              contentContainerStyle={styles.tileRow}
            >
              {[ALL, ...chipLabels].map((label) => (
                <Pressable
                  key={label}
                  onPress={() => setChip(label)}
                  style={[styles.tile, chip === label && styles.tileOn]}
                >
                  <Ionicons name={categoryIcon(label)} size={22} color={colors.primary} />
                  <Txt style={styles.tileText} numberOfLines={1}>
                    {label}
                  </Txt>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}

          {kind === "enseigne" && promoListing ? (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/article/[id]",
                  params: { id: promoListing.id },
                })
              }
              style={[styles.promo, { height: promoH, borderRadius: 28 }]}
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.promoGradient}
              >
                <View style={styles.promoCopy}>
                  <Txt
                    style={[
                      styles.promoTitle,
                      width < 420 && { fontSize: 16, lineHeight: 20 },
                    ]}
                    numberOfLines={3}
                  >
                    {promoListing.title}
                  </Txt>
                  <View style={[styles.promoBtn, styles.inline]}>
                    <Txt style={styles.promoBtnText}>Voir l’article</Txt>
                    <Ionicons name="chevron-forward" size={13} color={colors.primary} />
                  </View>
                </View>
              </LinearGradient>
              {listingImages(promoListing)[0] ? (
                <Image
                  source={{ uri: listingImages(promoListing)[0] }}
                  style={{
                    width: Math.round(
                      Math.min(promoH * 0.92, (width - 32) * 0.36),
                    ),
                    height: promoH,
                    flexShrink: 0,
                  }}
                  contentFit="cover"
                  contentPosition="center"
                />
              ) : null}
            </Pressable>
          ) : null}

          <View style={{ marginTop: 16 }}>
            <SectionHeader
              title={
                kind === "dressing"
                  ? "Articles en vente"
                  : kind === "quartier"
                    ? "Produits disponibles"
                    : kind === "enseigne"
                      ? "Produits populaires"
                      : `Tous les articles (${formatNumber(count)})`
              }
              right={
                <FilterButton
                  active={hasActiveFilters(filters)}
                  onPress={() => setFiltersOpen(true)}
                />
              }
            />
            {kind === "quartier" && chipLabels.length ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.chips, { paddingHorizontal: 0 }]}
              >
                {[ALL, ...chipLabels].map((label) => (
                  <Chip
                    key={label}
                    label={label}
                    active={chip === label}
                    onPress={() => setChip(label)}
                  />
                ))}
              </ScrollView>
            ) : null}
            {shown.length && kind === "enseigne" ? (
              <View style={styles.productRows}>
                {Array.from({ length: Math.ceil(shown.length / 3) }, (_, row) =>
                  shown.slice(row * 3, row * 3 + 3),
                ).map((row, index) => (
                  <View key={index} style={styles.productRow}>
                    {row.map((listing) => (
                      <ListingCard
                        key={listing.id}
                        listing={listing}
                        width={productW}
                        variant="brandStore"
                      />
                    ))}
                  </View>
                ))}
              </View>
            ) : shown.length ? (
              <View style={styles.productRows}>
                {Array.from(
                  { length: Math.ceil(shown.length / productCols) },
                  (_, row) =>
                    shown.slice(
                      row * productCols,
                      row * productCols + productCols,
                    ),
                ).map((row, index) => (
                  <View key={index} style={styles.productRow}>
                    {row.map((listing) => (
                      <ListingCard
                        key={listing.id}
                        listing={listing}
                        width={productW}
                        variant={PRODUCT_VARIANT[kind]}
                        badgeLabel={
                          kind === "dressing" ? "Seconde main" : undefined
                        }
                      />
                    ))}
                  </View>
                ))}
              </View>
            ) : (
              <Txt variant="caption" style={{ marginTop: 8 }}>
                {chip !== ALL && listings.length
                  ? `Aucun article dans « ${chip} » pour le moment.`
                  : "Aucun article en vente"}
              </Txt>
            )}
          </View>
        </View>
      </ScrollView>
      {flowNav ? null : topNav}
      {kind === "enseigne" ? <ShopBottomNav /> : null}
      <FilterSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filtres"
        value={filters}
        onApply={setFilters}
      />
      <Sheet visible={reviewsOpen} onClose={() => setReviewsOpen(false)} title={`Avis · ${shop.shopName}`}>
        {(sellerReviews.data ?? []).length ? (
          (sellerReviews.data ?? []).map((review) => (
            <View key={review.id} style={{ gap: 6, marginBottom: 14 }}>
              <View style={styles.inline}>
                <Ionicons name="star" size={14} color={colors.star} />
                <Txt style={styles.rateText}>{review.rating.toFixed(1)}</Txt>
                <Txt variant="caption">{review.authorName || review.userName || "Client"}</Txt>
              </View>
              {review.comment ? <Txt variant="body">{review.comment}</Txt> : null}
            </View>
          ))
        ) : sellerReviews.isLoading ? (
          <Txt variant="caption">Chargement…</Txt>
        ) : (
          <Txt variant="caption">Pas encore d’avis.</Txt>
        )}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  topNav: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 4,
  },
  topNavFlow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 4,
    backgroundColor: colors.background,
  },
  topNavActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  heroWrap: { marginBottom: 8 },
  hero: {
    height: 250,
    backgroundColor: colors.surfaceMuted,
    overflow: "hidden",
  },
  heroBleed: { height: 360 },
  heroRound: { borderRadius: 22 },
  heroInset: { marginHorizontal: 16 },
  hook: { position: "absolute", left: 16, right: 16, bottom: 36 },
  hookText: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 28,
    color: colors.white,
  },
  hookLine: {
    width: 36,
    height: 2,
    backgroundColor: colors.white,
    marginTop: 8,
  },
  sheet: { paddingHorizontal: 16, paddingBottom: 12 },
  sheetOverlap: {
    marginTop: -48,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 16,
  },
  floatMark: { position: "absolute", left: 16, top: -36 },
  identity: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.text,
    flexShrink: 1,
  },
  nameSerif: { fontFamily: fonts.displayBold, fontSize: 26, lineHeight: 32 },
  nameEnseigne: { fontSize: 28, lineHeight: 34 },
  inline: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.secondary,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  rateText: { fontFamily: fonts.bold, fontSize: 12, color: colors.text },
  vsep: {
    width: 1,
    height: 12,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  stats: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 14 },
  stat: { flexDirection: "row", alignItems: "center", gap: 6 },
  statNum: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  communes: { marginTop: 10, alignItems: "flex-start" },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    padding: 10,
    borderRadius: radius.md,
  },
  serviceTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primaryDark,
  },
  chips: { gap: 8, paddingVertical: 12 },
  enseigneHead: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 14,
    marginTop: -28,
    minHeight: 72,
  },
  enseigneNameWrap: { flex: 1, paddingBottom: 4 },
  tileScroll: { marginHorizontal: -16, marginTop: 16, flexGrow: 0 },
  tileRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
    paddingHorizontal: 16,
  },
  tile: {
    height: 86,
    minWidth: 86,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 14,
  },
  tileOn: { backgroundColor: colors.primarySoft },
  tileText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.text,
    textAlign: "center",
  },
  promo: {
    marginTop: 16,
    borderRadius: 28,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: colors.primary,
  },
  promoGradient: { flex: 1 },
  promoCopy: {
    flex: 1,
    justifyContent: "center",
    gap: 10,
    paddingLeft: 16,
    paddingRight: 12,
    paddingVertical: 14,
  },
  promoTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    lineHeight: 22,
    color: colors.white,
  },
  promoBtn: {
    alignSelf: "flex-start",
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  promoBtnText: { fontFamily: fonts.bold, fontSize: 12, color: colors.primary },
  productRows: { gap: 15, marginTop: 10 },
  productRow: { flexDirection: "row", alignItems: "flex-start", gap: 13 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  delivery: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  deliveryText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.primaryDark,
  },
  dressingHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  particulierPill: {
    alignSelf: "flex-start",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  particulierText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.primaryDark,
  },
});
