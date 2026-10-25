import Ionicons from "@expo/vector-icons/Ionicons";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import type { ComponentProps } from "react";
import { useState } from "react";
import { Pressable, Share, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";

import { CoverAdjuster } from "@/components/seller/cover-adjuster";
import {
  Badge,
  Button,
  Card,
  Screen,
  ScreenHeader,
  toast,
  Txt,
} from "@/components/ui";
import {
  qk,
  useAuth,
  useFavorites,
  useListings,
  usePurchases,
  useSales,
} from "@/hooks/queries";
import { useAccountType } from "@/hooks/use-account-type";
import { errorMessage, updateMe } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { appLink } from "@/lib/web";
import { colors } from "@/theme";

type IconName = ComponentProps<typeof Ionicons>["name"];

function StatCard({
  label,
  value,
  icon,
  tint,
  iconColor,
  onPress,
}: {
  label: string;
  value: string;
  icon: IconName;
  tint: string;
  iconColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={{ width: "48%" }}>
      <Card>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: tint,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 10,
          }}
        >
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <Txt variant="h2">{value}</Txt>
        <Txt variant="caption" style={{ marginTop: 4 }}>
          {label}
        </Txt>
      </Card>
    </Pressable>
  );
}

export function DashboardHome() {
  const { isConsumer, isCourier } = useAuth();
  const { me, type } = useAccountType();
  const sales = useSales(type.isSeller);
  const purchases = usePurchases();
  const favorites = useFavorites();
  const listings = useListings({ mine: "1" }, type.isSeller);
  const client = useQueryClient();
  const [adjustCover, setAdjustCover] = useState(false);
  const firstName = (me?.displayName || "toi").split(" ")[0];
  const sellerOrders = sales.data ?? [];
  const buyerOrders = purchases.data ?? [];
  const activeListings = (listings.data ?? []).filter(
    (listing) => listing.status === "ACTIVE",
  ).length;
  const released = sellerOrders
    .filter(
      (order) =>
        order.status === "FUNDS_RELEASED" || order.escrowStatus === "released",
    )
    .reduce(
      (sum, order) => sum + (order.amountGnf || 0) - (order.commissionGnf || 0),
      0,
    );
  const publicId = me?.seller?.profileId || me?.seller?.id;
  const publicUrl = publicId ? appLink(`/boutique/${publicId}`) : null;

  const copyLink = async () => {
    if (!publicUrl) return;
    await Clipboard.setStringAsync(publicUrl);
    toast.success("Lien copié");
  };

  const shareLink = () => {
    if (!publicUrl) return;
    Share.share({ message: publicUrl, url: publicUrl }).catch(() => {});
  };

  if (!isConsumer) {
    router.replace("/");
    return null;
  }

  return (
    <Screen>
      <ScreenHeader title="Vue d'ensemble" hideBack />
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <Txt variant="h1">Bonjour, {firstName}</Txt>
          <Txt variant="caption">
            {isCourier && !type.isSeller
              ? 'Tu livres avec FripCash. Tu peux aussi acheter et vendre en particulier ou en articles neufs.'
              : type.description}
          </Txt>
        </View>
        <Badge label={isCourier && !type.isSeller ? 'Livreur' : type.label} />
      </View>

      {isCourier ? (
        <Card onPress={() => router.push('/livreur')} style={{ marginBottom: 16 }}>
          <Txt variant="bodyStrong">Tableau de bord livreur</Txt>
          <Txt variant="caption" style={{ marginTop: 4 }}>
            Missions, gains et disponibilité.
          </Txt>
        </Card>
      ) : null}

      {type.id === "acheteur" ? (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <StatCard
            label="Mes achats"
            value={purchases.isLoading ? "…" : String(buyerOrders.length)}
            icon="cart-outline"
            tint="#DBEAFE"
            iconColor="#2563EB"
            onPress={() => router.push({ pathname: "/commandes", params: { tab: "achats" } })}
          />
          <StatCard
            label="Favoris"
            value={
              favorites.isLoading ? "…" : String(favorites.data?.length ?? 0)
            }
            icon="heart-outline"
            tint="#FDE8EA"
            iconColor="#E11D48"
            onPress={() => router.push("/favoris")}
          />
          <StatCard
            label="Catalogue"
            value="Explorer"
            icon="search-outline"
            tint={colors.primarySoft}
            iconColor={colors.primary}
            onPress={() => router.push("/recherche")}
          />
        </View>
      ) : (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <StatCard
            label="Annonces actives"
            value={listings.isLoading ? "…" : String(activeListings)}
            icon="shirt-outline"
            tint={colors.primarySoft}
            iconColor={colors.primary}
            onPress={() => router.push("/vendeur/articles")}
          />
          <StatCard
            label="Ventes"
            value={sales.isLoading ? "…" : String(sellerOrders.length)}
            icon="trending-up-outline"
            tint="#D1FAE5"
            iconColor="#047857"
            onPress={() => router.push({ pathname: "/commandes", params: { tab: "ventes" } })}
          />
          <StatCard
            label="Achats"
            value={purchases.isLoading ? "…" : String(buyerOrders.length)}
            icon="cart-outline"
            tint="#DBEAFE"
            iconColor="#2563EB"
            onPress={() => router.push({ pathname: "/commandes", params: { tab: "achats" } })}
          />
          <StatCard
            label="Ventes libérées (GNF)"
            value={sales.isLoading ? "…" : formatNumber(released)}
            icon="trending-up-outline"
            tint={colors.primarySoft}
            iconColor={colors.primary}
            onPress={() => router.push({ pathname: "/commandes", params: { tab: "ventes", status: "FUNDS_RELEASED" } })}
          />
        </View>
      )}

      <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
        {type.isSeller ? (
          <Button
            title={
              type.canPublish
                ? type.isShop
                  ? "Ajouter un article"
                  : "Publier une annonce"
                : "Voir mes articles"
            }
            onPress={() =>
              router.push(
                type.canPublish
                  ? {
                      pathname: "/vendeur/article/[id]",
                      params: { id: "nouveau" },
                    }
                  : "/vendeur/articles",
              )
            }
            style={{ flex: 1 }}
          />
        ) : (
          <Button
            title="Parcourir le catalogue"
            onPress={() => router.push("/recherche")}
            style={{ flex: 1 }}
          />
        )}
        {type.isSeller ? (
          <Button
            title="Catalogue"
            variant="secondary"
            onPress={() => {
              if (!publicId) return;
              router.push({
                pathname: "/boutique/[id]",
                params: { id: publicId },
              });
            }}
            style={{ flex: 1 }}
          />
        ) : null}
      </View>

      {publicUrl ? (
        <Card style={{ marginBottom: 16, gap: 8 }}>
          <Txt variant="bodyStrong">Boutique publique</Txt>
          <Txt variant="caption" numberOfLines={2}>
            {publicUrl}
          </Txt>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button
              title="Copier"
              variant="secondary"
              onPress={copyLink}
              style={{ flex: 1 }}
            />
            <Button title="Partager" onPress={shareLink} style={{ flex: 1 }} />
          </View>
          {me?.seller?.coverUrl ? (
            <Button
              title="Ajuster la couverture"
              variant="secondary"
              onPress={() => setAdjustCover(true)}
            />
          ) : null}
        </Card>
      ) : null}
      {me?.seller?.coverUrl ? (
        <CoverAdjuster
          visible={adjustCover}
          coverUrl={me.seller.coverUrl}
          shopName={me.seller.shopName || "Ma boutique"}
          avatarUrl={me.avatarUrl}
          subtitle={me.seller.shopDescription || type.label}
          count={activeListings}
          shopKind={me.seller.shopKind}
          onClose={() => setAdjustCover(false)}
          onConfirm={async (url) => {
            try {
              await updateMe({ coverUrl: url });
              await client.invalidateQueries({ queryKey: qk.me });
              toast.success("Couverture mise à jour");
              setAdjustCover(false);
            } catch (error) {
              toast.error(errorMessage(error));
            }
          }}
        />
      ) : null}

      {type.seesExcel || type.seesLibrary || type.destination ? (
        <View style={{ gap: 8, marginBottom: 16 }}>
          {type.seesExcel ? (
            <Card
              onPress={() => router.push("/vendeur/import-excel")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Txt variant="bodyStrong">
                {type.excelImport
                  ? "Import Excel"
                  : "Import Excel (verrouillé)"}
              </Txt>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textMuted}
              />
            </Card>
          ) : null}
          {type.seesLibrary ? (
            <Card
              onPress={() => router.push("/vendeur/bibliotheque")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Txt variant="bodyStrong">
                {type.productLibrary
                  ? "Bibliothèque"
                  : "Bibliothèque (verrouillée)"}
              </Txt>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textMuted}
              />
            </Card>
          ) : null}
          {type.destination ? (
            <Card style={{ backgroundColor: colors.surfaceMuted }}>
              <Txt variant="caption">
                {type.canPublish
                  ? "Tes annonces apparaissent dans"
                  : "Univers après validation"}
              </Txt>
              <Txt variant="bodyStrong">{type.destination}</Txt>
              <Badge
                label={type.label}
                style={{ marginTop: 8, alignSelf: "flex-start" }}
              />
            </Card>
          ) : null}
        </View>
      ) : null}

      {type.id === "acheteur" ? (
        <Card
          onPress={() => router.push("/evoluer")}
          style={{ marginBottom: 18 }}
        >
          <Txt variant="body">
            Tu veux vendre ou faire évoluer ton compte ? Ouvre Évoluer.
          </Txt>
        </Card>
      ) : null}
    </Screen>
  );
}
