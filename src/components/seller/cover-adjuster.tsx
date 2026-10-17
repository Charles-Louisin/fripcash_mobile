import { useRef, useState } from "react";
import { Modal, PanResponder, useWindowDimensions, View } from "react-native";

import { ShopCard } from "@/components/catalog/shop-card";
import { Button, Txt } from "@/components/ui";
import type { PublicShop, ShopKind } from "@/lib/api";
import {
  COVER_CENTER,
  coverFocusOf,
  withCoverFocus,
  type CoverFocus,
} from "@/lib/cover-focus";
import { colors } from "@/theme";

function clamp(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function CoverAdjuster({
  visible,
  coverUrl,
  shopName,
  avatarUrl,
  subtitle,
  count = 0,
  shopKind = "standard",
  onClose,
  onConfirm,
}: {
  visible: boolean;
  coverUrl: string;
  shopName: string;
  avatarUrl?: string | null;
  subtitle?: string;
  count?: number;
  shopKind?: ShopKind | null;
  onClose: () => void;
  onConfirm: (url: string) => void;
}) {
  const { width: screenW } = useWindowDimensions();
  const [focus, setFocus] = useState<CoverFocus>(() => coverFocusOf(coverUrl));
  const focusRef = useRef(focus);
  const origin = useRef(focus);
  focusRef.current = focus;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        origin.current = focusRef.current;
      },
      onPanResponderMove: (_, gesture) => {
        setFocus({
          x: clamp(origin.current.x - (gesture.dx / 260) * 80),
          y: clamp(origin.current.y - (gesture.dy / 140) * 80),
        });
      },
    }),
  ).current;

  if (!coverUrl) return null;

  const gridCardW = (screenW - 32 - 10) / 2;
  const preview: PublicShop = {
    id: "apercu",
    shopName: shopName || "Ma boutique",
    shopKind: shopKind ?? "standard",
    avatarUrl: avatarUrl || undefined,
    coverUrl: withCoverFocus(coverUrl, focus),
    bio: subtitle,
    listingsCount: count,
  };
  const variant =
    shopKind === "proximite"
      ? "quartier"
      : shopKind === "enseigne"
        ? "enseigne"
        : "neuf";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onShow={() => setFocus(coverFocusOf(coverUrl))}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(20,16,12,0.55)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 18,
            gap: 14,
          }}
        >
          <Txt variant="h2">Cadrage de la couverture</Txt>
          <Txt variant="caption">
            Glisse la photo dans l’aperçu. C’est cette carte que les visiteurs
            voient.
          </Txt>
          <View {...pan.panHandlers}>
            <View pointerEvents="none" style={{ alignItems: "center" }}>
              <ShopCard
                shop={preview}
                variant={variant}
                width={variant === "quartier" ? gridCardW : undefined}
                preview
              />
            </View>
          </View>
          <Button
            title="Recentrer"
            variant="secondary"
            onPress={() => setFocus(COVER_CENTER)}
          />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button
              title="Annuler"
              variant="secondary"
              onPress={onClose}
              style={{ flex: 1 }}
            />
            <Button
              title="Valider"
              onPress={() => onConfirm(withCoverFocus(coverUrl, focus))}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
