import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";

import { Rating, Txt } from "@/components/ui";
import { mediaUrl, type PublicShop } from "@/lib/api";
import { coverContentPosition } from "@/lib/cover-focus";
import { shopKindLabel } from "@/lib/domain";
import { formatNumber } from "@/lib/format";
import { colors, fonts, radius, shadow } from "@/theme";

import { ShopLikeButton } from "./shop-like-button";
import { ShopMark } from "./shop-mark";

export function shopCover(shop: PublicShop) {
  const url = mediaUrl(shop.coverUrl);
  return url ? { uri: url } : null;
}

export function openShop(id: string) {
  router.push({ pathname: "/boutique/[id]", params: { id } });
}

export type ShopCardVariant =
  | "home"
  | "dressing"
  | "neuf"
  | "quartier"
  | "enseigne";

function shopPlace(shop: PublicShop) {
  return (
    [shop.neighborhood, shop.city].filter(Boolean).join(", ") ||
    shop.storeAddress ||
    shop.city ||
    ""
  );
}

function listingCount(shop: PublicShop) {
  return shop.listingsCount ?? shop.listings?.length ?? 0;
}

function parseTime(raw?: string | null) {
  const match = raw?.trim().match(/^(\d{1,2})\s*(?:h|H|:)?\s*(\d{2})?/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2] ?? 0);
  if (hours > 24 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function hourLabel(minutes: number) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

function openStatus(shop: PublicShop): { open: boolean; label: string } | null {
  const start = parseTime(shop.openingTime);
  const end = parseTime(shop.closingTime);
  if (start == null || end == null) return null;
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const open = end > start ? current >= start && current < end : current >= start || current < end;
  if (!open) return { open: false, label: `Ouvre à ${hourLabel(start)}` };
  const left = (end - current + 1440) % 1440;
  if (left <= 120) return { open: false, label: `Ferme à ${hourLabel(end)}` };
  return { open: true, label: "Ouvert aujourd’hui" };
}

function ArrowButton({ style }: { style?: object }) {
  return (
    <View style={[styles.arrow, style]}>
      <Ionicons name="chevron-forward" size={16} color={colors.text} />
    </View>
  );
}

export function ShopCard({
  shop,
  variant = "home",
  width,
  preview = false,
}: {
  shop: PublicShop;
  variant?: ShopCardVariant;
  width?: number;
  preview?: boolean;
}) {
  const kind = shopKindLabel(shop.sellerKind, shop.shopKind);
  const place = shopPlace(shop);
  const { width: screenW } = useWindowDimensions();
  const count = listingCount(shop);
  const cover = shopCover(shop);
  const [infoH, setInfoH] = useState(0);

  if (variant === "enseigne" || variant === "neuf") {
    const cardH = Math.round(
      Math.min(220, Math.max(132, (screenW - 32) * 0.38)),
    );
    const summary = shop.bio || kind;
    return (
      <Pressable
        onPress={() => openShop(shop.id)}
        style={({ pressed }) => [
          styles.enseigne,
          width ? { width } : null,
          { height: cardH, opacity: pressed ? 0.94 : 1 },
        ]}
      >
        {cover ? (
          <Image
            source={cover}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            contentPosition={coverContentPosition(cover.uri)}
          />
        ) : null}
        <View style={styles.enseignePanelWrap} pointerEvents="none">
          <View style={styles.enseignePanel}>
            <ShopMark
              value={shop.avatarUrl || mediaUrl(shop.avatarUrl)}
              name={shop.shopName}
              size={54}
            />
            <View style={{ flex: 1, gap: 2 }}>
              <Txt style={styles.enseigneName} numberOfLines={1}>
                {shop.shopName}
              </Txt>
              <Txt style={styles.enseigneBio} numberOfLines={2}>
                {summary}
              </Txt>
              <Rating value={shop.rating} count={shop.reviewsCount} size={12} />
              <View style={styles.delivery}>
                <Ionicons name="car-outline" size={12} color={colors.primary} />
                <Txt style={styles.deliveryText}>Livraison en ville</Txt>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.enseigneArrowWrap}>
          <ArrowButton />
        </View>
      </Pressable>
    );
  }

  if (variant === "quartier") {
    const zone = shop.neighborhood || shop.city || place;
    const status = openStatus(shop);
    return (
      <Pressable
        onPress={() => openShop(shop.id)}
        style={({ pressed }) => [
          styles.tile,
          width ? { width } : { flex: 1 },
          { opacity: pressed ? 0.94 : 1 },
        ]}
      >
        <View style={styles.quartierCover}>
          {cover ? (
            <Image
              source={cover}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              contentPosition={coverContentPosition(cover.uri)}
            />
          ) : null}
          <ShopLikeButton
            sellerId={shop.id}
            likedByMe={shop.likedByMe}
            size={28}
            style={styles.heart}
          />
          {status ? (
            <View style={[styles.open, !status.open && styles.openClosed]}>
              <Ionicons name="checkmark-circle" size={12} color={colors.white} />
              <Txt style={styles.openText} numberOfLines={1}>
                {status.label}
              </Txt>
            </View>
          ) : null}
        </View>
        <View style={[styles.tileBody, { paddingTop: 10, gap: 4 }]}>
          <View style={styles.nameLine}>
            <Txt style={[styles.cardName, { flex: 1 }]} numberOfLines={1}>
              {shop.shopName}
            </Txt>
            <View style={styles.miniArrow}>
              <Ionicons name="chevron-forward" size={13} color={colors.primaryDark} />
            </View>
          </View>
          {zone ? (
            <View style={styles.inline}>
              <Ionicons name="location" size={12} color={colors.primary} />
              <Txt style={[styles.meta, { color: colors.primaryDark }]} numberOfLines={1}>
                {zone}
              </Txt>
            </View>
          ) : null}
          <Txt style={styles.desc} numberOfLines={2}>
            {shop.bio || kind}
          </Txt>
          <View style={styles.bottomLine}>
            <View style={styles.inline}>
              <Ionicons name="star" size={11} color="#F59E0B" />
              <Txt style={styles.ratingText} numberOfLines={1}>
                {(shop.rating ?? 0).toFixed(1)}
                <Txt style={styles.meta}> ({formatNumber(shop.reviewsCount)})</Txt>
              </Txt>
            </View>
            <Txt style={styles.pickupText} numberOfLines={1}>
              Retrait en boutique
            </Txt>
          </View>
        </View>
      </Pressable>
    );
  }

  if (variant === "dressing") {
    const zone = place || kind;
    return (
      <Pressable
        onPress={() => openShop(shop.id)}
        style={({ pressed }) => [
          styles.dressingCard,
          width ? { width } : { flex: 1 },
          { opacity: pressed ? 0.94 : 1 },
        ]}
      >
        <ShopLikeButton
          sellerId={shop.id}
          likedByMe={shop.likedByMe}
          size={28}
          style={styles.dressingHeart}
        />
        <View style={styles.dressingRow}>
          <ShopMark
            value={shop.avatarUrl || mediaUrl(shop.avatarUrl)}
            name={shop.shopName}
            size={Math.max(64, infoH)}
          />
          <View
            style={{ flex: 1, gap: 4, minWidth: 0 }}
            onLayout={(e) => setInfoH(e.nativeEvent.layout.height)}
          >
            <Txt style={styles.dressingName} numberOfLines={1}>
              {shop.shopName}
            </Txt>
            {zone ? (
              <View style={styles.inline}>
                <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                <Txt style={styles.dressingPlace} numberOfLines={1}>
                  {zone}
                </Txt>
              </View>
            ) : null}
            <View style={styles.kindPill}>
              <Txt style={styles.kindText} numberOfLines={1}>
                Particulier
              </Txt>
            </View>
            <View style={styles.dressingStats}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Txt style={styles.dressingRating}>{(shop.rating ?? 0).toFixed(1)}</Txt>
              <Txt style={styles.dressingMeta}>({formatNumber(shop.reviewsCount)})</Txt>
              <Txt style={styles.dressingMeta}> · {formatNumber(count)} articles</Txt>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
            </View>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => openShop(shop.id)}
      style={({ pressed }) => [
        styles.tile,
        width ? { width } : { flex: 1 },
        { opacity: pressed ? 0.94 : 1 },
      ]}
    >
      <View style={styles.homeCover}>
        {cover ? (
          <Image
            source={cover}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            contentPosition={coverContentPosition(cover.uri)}
          />
        ) : null}
        <ShopLikeButton
          sellerId={shop.id}
          likedByMe={shop.likedByMe}
          size={22}
          style={styles.heart}
        />
        <View style={styles.avatarFloat}>
          <ShopMark
            value={shop.avatarUrl || mediaUrl(shop.avatarUrl)}
            name={shop.shopName}
            size={26}
          />
        </View>
      </View>
      <View style={[styles.tileBody, { paddingTop: 12, gap: 2 }]}>
        <Txt style={styles.homeName} numberOfLines={1}>
          {shop.shopName}
        </Txt>
        <View style={styles.kindPill}>
          <Txt style={styles.kindText} numberOfLines={1}>
            {shop.bio && shop.bio.length < 24 ? shop.bio : kind}
          </Txt>
        </View>
        <Rating value={shop.rating} count={shop.reviewsCount} size={10} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow,
  },
  homeCover: { height: 72, backgroundColor: colors.surfaceMuted },
  dressingCover: { height: 108, backgroundColor: colors.surfaceMuted },
  dressingCard: {
    position: 'relative',
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow,
  },
  dressingHeart: { position: 'absolute', top: 10, right: 10, zIndex: 2 },
  dressingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingRight: 28 },
  dressingName: {
    fontFamily: fonts.displayBold,
    fontSize: 17,
    lineHeight: 22,
    color: colors.text,
  },
  dressingPlace: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textMuted,
    flexShrink: 1,
  },
  dressingStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  dressingRating: { fontFamily: fonts.bold, fontSize: 11, color: colors.text },
  dressingMeta: { fontFamily: fonts.medium, fontSize: 11, color: colors.textMuted },
  quartierCover: { height: 112, backgroundColor: colors.surfaceMuted },
  tileBody: { paddingHorizontal: 8, paddingTop: 8, paddingBottom: 8, gap: 3 },
  heart: { position: "absolute", top: 6, right: 6 },
  avatarFloat: { position: "absolute", left: 8, bottom: -12 },
  cardName: {
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 17,
    color: colors.text,
  },
  homeName: {
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 15,
    color: colors.text,
  },
  meta: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    lineHeight: 14,
    color: colors.textMuted,
    flexShrink: 1,
  },
  desc: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 14,
    color: colors.textMuted,
    minHeight: 28,
  },
  ratingText: { fontFamily: fonts.bold, fontSize: 11, color: colors.text },
  pickupText: { fontFamily: fonts.semibold, fontSize: 9.5, color: colors.primaryDark, flexShrink: 1 },
  inline: { flexDirection: "row", alignItems: "center", gap: 3, flexShrink: 1 },
  nameLine: { flexDirection: "row", alignItems: "center", gap: 4 },
  bottomLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
    marginTop: 2,
  },
  kindPill: {
    alignSelf: "flex-start",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  kindText: {
    fontFamily: fonts.semibold,
    fontSize: 9.5,
    color: colors.primaryDark,
  },
  miniArrow: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  open: {
    position: "absolute",
    left: 6,
    bottom: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.success,
    borderRadius: radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 3,
    maxWidth: "92%",
  },
  openClosed: { backgroundColor: "rgba(60,52,48,0.72)" },
  openText: { fontFamily: fonts.semibold, fontSize: 9.5, color: colors.white },
  arrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
  },
  enseigne: {
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: colors.surfaceMuted,
    ...shadow,
  },
  enseignePanelWrap: {
    position: "absolute",
    left: 12,
    top: 0,
    bottom: 0,
    width: "72%",
    justifyContent: "center",
  },
  enseignePanel: {
    backgroundColor: "rgba(255,252,249,0.9)",
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  enseigneArrowWrap: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  enseigneName: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  enseigneBio: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    lineHeight: 15,
    color: colors.textMuted,
  },
  delivery: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginTop: 2,
  },
  deliveryText: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    color: colors.primaryDark,
  },
});
