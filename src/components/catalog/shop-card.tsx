import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { Rating, Txt } from "@/components/ui";
import { mediaUrl, type PublicShop } from "@/lib/api";
import { coverContentPosition } from "@/lib/cover-focus";
import { shopKindLabel } from "@/lib/domain";
import { formatNumber } from "@/lib/format";
import { colors, fonts, radius, shadow } from "@/theme";

import { ShopLikeButton } from "./shop-like-button";
import { markSource, ShopMark } from "./shop-mark";

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

const NEUF_H = 232;
const NEUF_LOGO = 64;

function neufWavePath(width: number, height: number) {
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  const left = h * 0.3;
  const right = h * 0.8;
  return [
    `M0 ${left}`,
    `C ${w * 0.18} ${h * 0.32}, ${w * 0.34} ${h * 0.36}, ${w * 0.48} ${h * 0.46}`,
    `C ${w * 0.66} ${h * 0.6}, ${w * 0.84} ${h * 0.78}, ${w} ${right}`,
    `L${w} ${h} L0 ${h} Z`,
  ].join(" ");
}

function NeufWave({ width, height }: { width: number; height: number }) {
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  return (
    <Svg width={w} height={h}>
      <Path d={neufWavePath(w, h)} fill="#FAF6F0" />
    </Svg>
  );
}

function NeufLeaf() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" style={styles.leaf}>
      <Path d="M3 15 C 7 9, 11 5, 16 2 C 13 8, 9 12, 3 15 Z" fill="#6E8B56" />
      <Path
        d="M4 14 C 8 11, 11 7, 15 3"
        stroke="#4F6A3C"
        strokeWidth={0.7}
        fill="none"
      />
    </Svg>
  );
}

function NeufAvatar({ shop }: { shop: PublicShop }) {
  const value = shop.avatarUrl;
  const photo =
    value && !value.startsWith("mono|") && !value.startsWith("icon|")
      ? markSource(value)
      : null;
  if (photo) {
    return (
      <View style={[styles.neufAvatar, { overflow: "hidden" }]}>
        <Image
          source={photo}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
      </View>
    );
  }
  if (value?.startsWith("icon|")) {
    return (
      <View
        style={[
          styles.neufAvatar,
          { backgroundColor: value.split("|")[2] || "#F4EFE8" },
        ]}
      >
        <ShopMark value={value} name={shop.shopName} size={34} ring={false} />
      </View>
    );
  }
  const parts = value?.startsWith("mono|") ? value.split("|") : [];
  const label =
    parts[1] || (shop.shopName || "?").trim().charAt(0).toUpperCase();
  return (
    <View
      style={[styles.neufAvatar, { backgroundColor: parts[2] || "#F6E7D8" }]}
    >
      <Txt
        style={[
          styles.neufLetter,
          {
            fontSize: label.length > 1 ? 18 : 28,
            color: parts[3] || "#BF5B3D",
          },
        ]}
      >
        {label}
      </Txt>
      {label.length === 1 ? <NeufLeaf /> : null}
    </View>
  );
}

function ArrowButton({ style }: { style?: object }) {
  return (
    <View style={[styles.arrow, style]}>
      <Ionicons name="chevron-forward" size={16} color={colors.text} />
    </View>
  );
}

function NeufShopCard({
  shop,
  cover,
  subtitle,
  count,
  width,
  preview,
}: {
  shop: PublicShop;
  cover: { uri: string } | null;
  subtitle: string;
  count: number;
  width?: number;
  preview?: boolean;
}) {
  const { width: screenW } = useWindowDimensions();
  const [cardW, setCardW] = useState(width ?? 0);
  const waveW = cardW || width || Math.max(1, screenW - 32);
  const avatarTop = Math.round(NEUF_H * 0.3 - NEUF_LOGO * 0.78);
  const nameWidth = Math.max(108, Math.round(waveW * 0.46 - 28));

  return (
    <Pressable
      onPress={preview ? undefined : () => openShop(shop.id)}
      onLayout={(event) => {
        const nextW = Math.round(event.nativeEvent.layout.width);
        if (nextW > 0 && nextW !== cardW) setCardW(nextW);
      }}
      style={({ pressed }) => [
        styles.neufShadow,
        width ? { width } : null,
        { opacity: pressed && !preview ? 0.94 : 1 },
      ]}
    >
      <View style={styles.neuf}>
        {cover ? (
          <Image
            source={cover}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            contentPosition={coverContentPosition(cover.uri)}
          />
        ) : null}
        <View style={styles.neufWave} pointerEvents="none">
          <NeufWave width={waveW} height={NEUF_H} />
        </View>
        <View
          style={[styles.neufAvatarWrap, { top: avatarTop }]}
          pointerEvents="none"
        >
          <NeufAvatar shop={shop} />
        </View>
        <View style={styles.neufArrow}>
          <Ionicons name="chevron-forward" size={22} color="#1A1A1A" />
        </View>
        <View style={styles.neufInfo}>
          <Txt style={[styles.neufWaveName, { maxWidth: nameWidth }]} numberOfLines={2}>
            {shop.shopName}
          </Txt>
          <Txt style={[styles.neufWaveSub, { maxWidth: nameWidth }]} numberOfLines={1}>
            {subtitle}
          </Txt>
          <View style={[styles.neufMetrics, styles.neufWaveMetrics]}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Txt style={styles.neufMetricStrong} numberOfLines={1}>
              {(shop.rating ?? 0).toFixed(1)} ({formatNumber(shop.reviewsCount)}
              )
            </Txt>
            <View style={styles.neufSep} />
            <Ionicons name="bag-outline" size={14} color="#7A746E" />
            <Txt style={styles.neufMetric} numberOfLines={1}>
              {formatNumber(count)} articles
            </Txt>
          </View>
        </View>
      </View>
    </Pressable>
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

  if (variant === "enseigne") {
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

  if (variant === "neuf") {
    const subtitle = shop.bio || kind;
    return (
      <NeufShopCard
        shop={shop}
        cover={cover}
        subtitle={subtitle}
        count={count}
        width={width}
        preview={preview}
      />
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
    return (
      <Pressable
        onPress={() => openShop(shop.id)}
        style={({ pressed }) => [
          styles.tile,
          width ? { width } : { flex: 1 },
          { opacity: pressed ? 0.94 : 1 },
        ]}
      >
        <View style={styles.dressingCover}>
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
            size={26}
            style={styles.heart}
          />
          <View style={styles.avatarFloat}>
            <ShopMark
              value={shop.avatarUrl || mediaUrl(shop.avatarUrl)}
              name={shop.shopName}
              size={38}
            />
          </View>
        </View>
        <View style={[styles.tileBody, { paddingTop: 16 }]}>
          <Txt style={styles.cardName} numberOfLines={1}>
            {shop.shopName}
          </Txt>
          <View style={styles.inline}>
            <Ionicons name="location" size={11} color={colors.primary} />
            <Txt
              style={[styles.meta, { color: colors.primaryDark }]}
              numberOfLines={1}
            >
              {place || kind}
            </Txt>
          </View>
          <View style={styles.bottomLine}>
            <Rating value={shop.rating} count={shop.reviewsCount} size={11} />
            <View style={styles.inline}>
              <Ionicons name="bag-outline" size={11} color={colors.textMuted} />
              <Txt style={styles.meta}>{formatNumber(count)} articles</Txt>
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
  neufShadow: {
    borderRadius: 24,
    backgroundColor: "#FAF6F0",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  neuf: {
    height: NEUF_H,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#FAF6F0",
  },
  neufWave: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 2,
  },
  neufArrow: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 4,
  },
  neufAvatarWrap: { position: "absolute", left: 18, zIndex: 5 },
  neufAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  neufLetter: { fontFamily: fonts.displayBold },
  leaf: { position: "absolute", top: 8, right: 7 },
  neufInfo: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3,
    paddingHorizontal: 18,
    paddingBottom: 16,
    gap: 4,
    overflow: "hidden",
  },
  neufName: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    lineHeight: 24,
    color: "#1A1A1A",
    maxWidth: "70%",
  },
  neufWaveName: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    lineHeight: 24,
    color: "#1A1A1A",
  },
  neufSub: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 18,
    color: "#7A746E",
    maxWidth: "64%",
  },
  neufWaveSub: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 18,
    color: "#7A746E",
  },
  neufMetrics: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  neufWaveMetrics: {
    flexWrap: "wrap",
    maxWidth: "100%",
    alignSelf: "stretch",
  },
  neufMetricStrong: { fontFamily: fonts.bold, fontSize: 13, color: "#1A1A1A", flexShrink: 1 },
  neufMetric: { fontFamily: fonts.medium, fontSize: 13, color: "#7A746E", flexShrink: 1 },
  neufSep: {
    width: 1,
    height: 12,
    backgroundColor: "#D9D0C8",
    marginHorizontal: 2,
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
