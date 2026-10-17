import Ionicons from "@expo/vector-icons/Ionicons";
import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { ZoneSelect } from "@/components/select-field";
import { CoverAdjuster } from "@/components/seller/cover-adjuster";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Input,
  Loading,
  Screen,
  ScreenHeader,
  toast,
  Txt,
} from "@/components/ui";
import {
  qk,
  useListings,
  useMe,
  usePurchases,
  useSales,
} from "@/hooks/queries";
import { useAccountType } from "@/hooks/use-account-type";
import { verificationLabel } from "@/lib/account-type";
import {
  errorMessage,
  mediaUrl,
  pickImages,
  updateMe,
  uploadPickedImage,
  type Me,
} from "@/lib/api";
import { coverContentPosition, withCoverFocus } from "@/lib/cover-focus";
import { colors, radius } from "@/theme";

const photoTrash = {
  position: "absolute" as const,
  top: 6,
  right: 6,
  width: 28,
  height: 28,
  borderRadius: 14,
  backgroundColor: colors.white,
  borderWidth: 1,
  borderColor: colors.border,
  alignItems: "center" as const,
  justifyContent: "center" as const,
};

export default function ProfilScreen() {
  const { data: me, isLoading } = useMe();
  if (isLoading || !me) {
    return (
      <Screen scroll={false}>
        <ScreenHeader title="Mon profil" />
        <Loading />
      </Screen>
    );
  }
  return <ProfilForm me={me} />;
}

function ProfilForm({ me }: { me: Me }) {
  const client = useQueryClient();
  const { type } = useAccountType();
  const sales = useSales(type.isSeller);
  const purchases = usePurchases();
  const listings = useListings({ mine: "1" }, type.isSeller);
  const [name, setName] = useState(me.displayName ?? "");
  const [city, setCity] = useState(me.city ?? "");
  const [bio, setBio] = useState(me.bio ?? "");
  const [zoneId, setZoneId] = useState<string | null>(
    me.shippingZoneId ?? null,
  );
  const [avatarUrl, setAvatarUrl] = useState(me.avatarUrl ?? "");
  const [coverUrl, setCoverUrl] = useState(me.seller?.coverUrl ?? "");
  const [loading, setLoading] = useState(false);
  const [photoBusy, setPhotoBusy] = useState<"avatar" | "cover" | null>(null);
  const [adjusting, setAdjusting] = useState(false);
  const articles = listings.data ?? [];
  const stats = type.isSeller
    ? [
        {
          label: "Ventes",
          value: sales.isLoading ? "…" : String(sales.data?.length ?? 0),
        },
        {
          label: "Achats",
          value: purchases.isLoading
            ? "…"
            : String(purchases.data?.length ?? 0),
        },
        {
          label: "Annonces",
          value: listings.isLoading ? "…" : String(articles.length),
        },
        {
          label: "En vente",
          value: listings.isLoading
            ? "…"
            : String(
                articles.filter((item) => item.status === "ACTIVE").length,
              ),
        },
      ]
    : [
        {
          label: "Achats",
          value: purchases.isLoading
            ? "…"
            : String(purchases.data?.length ?? 0),
        },
      ];

  const pick = async (kind: "avatar" | "cover") => {
    try {
      const assets = await pickImages();
      if (!assets[0]) return;
      setPhotoBusy(kind);
      const up = await uploadPickedImage(assets[0], "listings");
      if (kind === "avatar") setAvatarUrl(up.url);
      else {
        setCoverUrl(withCoverFocus(up.url, { x: 50, y: 50 }));
        setAdjusting(true);
      }
      toast.success(
        kind === "avatar"
          ? "Photo envoyée — enregistre pour la conserver"
          : "Place la couverture, puis valide",
      );
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setPhotoBusy(null);
    }
  };

  const save = async () => {
    if (type.isSeller && !zoneId) {
      toast.error("Choisis ta zone d’expédition.");
      return;
    }
    setLoading(true);
    try {
      await updateMe({
        name: name.trim(),
        city,
        bio: bio.slice(0, 200),
        shippingZoneId: zoneId ?? undefined,
        avatarUrl: avatarUrl || "",
        ...(type.isSeller ? { coverUrl: coverUrl || "" } : {}),
      });
      await client.invalidateQueries({ queryKey: qk.me });
      toast.success("Profil mis à jour avec succès");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen keyboard>
      <ScreenHeader title="Mon profil" />
      <Card style={{ marginBottom: 12, backgroundColor: colors.primarySoft }}>
        <Txt variant="label" color={colors.primary}>
          Type de compte
        </Txt>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 8,
            marginTop: 6,
          }}
        >
          <Txt variant="h2" style={{ flex: 1 }}>
            {type.label}
          </Txt>
          <Badge label={type.label} />
        </View>
        <Txt variant="caption" style={{ marginTop: 6 }}>
          {type.description}
        </Txt>
        {type.destination ? (
          <Txt variant="bodyStrong" style={{ marginTop: 8 }}>
            Catalogue : {type.destination}
          </Txt>
        ) : null}
        {type.requiresAdminApproval ? (
          <Txt variant="caption" style={{ marginTop: 8 }}>
            {verificationLabel(type.verificationStatus)}
          </Txt>
        ) : null}
      </Card>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 14,
        }}
      >
        {stats.map((stat) => (
          <Card key={stat.label} style={{ width: "48%" }}>
            <Txt variant="h2">{stat.value}</Txt>
            <Txt variant="caption">{stat.label}</Txt>
          </Card>
        ))}
      </View>

      <Card style={{ marginBottom: 14 }}>
        <Txt variant="h3" style={{ marginBottom: 14 }}>
          Informations personnelles
        </Txt>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <View>
            <Pressable
              onPress={() => pick("avatar")}
              disabled={photoBusy !== null}
              accessibilityLabel="Choisir la photo de profil"
            >
              <Avatar uri={mediaUrl(avatarUrl)} name={name} size={76} />
            </Pressable>
            {avatarUrl ? (
              <Pressable
                onPress={() => setAvatarUrl("")}
                accessibilityLabel="Supprimer la photo"
                style={photoTrash}
              >
                <Ionicons name="trash" size={14} color={colors.error} />
              </Pressable>
            ) : null}
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Txt variant="bodyStrong">Photo de profil</Txt>
            <Txt variant="caption">
              {photoBusy === "avatar" ? "Envoi…" : "JPG, PNG. Max 4 Mo."}
            </Txt>
          </View>
        </View>

        {type.isSeller ? (
          <View style={{ marginBottom: 16 }}>
            <Txt variant="label" style={{ marginBottom: 8 }}>
              Photo de couverture de la boutique
            </Txt>
            <View>
              <Pressable
                onPress={() => pick("cover")}
                disabled={photoBusy !== null}
                accessibilityLabel="Choisir la photo de couverture"
                style={{
                  height: 140,
                  borderRadius: radius.lg,
                  overflow: "hidden",
                  backgroundColor: colors.surfaceMuted,
                }}
              >
                {coverUrl ? (
                  <Image
                    source={{ uri: mediaUrl(coverUrl) || coverUrl }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                    contentPosition={coverContentPosition(coverUrl)}
                  />
                ) : (
                  <View
                    style={{
                      flex: 1,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name="image-outline"
                      size={28}
                      color={colors.textMuted}
                    />
                  </View>
                )}
              </Pressable>
              {coverUrl ? (
                <Pressable
                  onPress={() => setCoverUrl("")}
                  accessibilityLabel="Supprimer la couverture"
                  style={photoTrash}
                >
                  <Ionicons name="trash" size={14} color={colors.error} />
                </Pressable>
              ) : null}
            </View>
            <Txt variant="caption" style={{ marginTop: 6 }}>
              {photoBusy === "cover"
                ? "Envoi…"
                : "JPG, PNG, WebP. Visible sur ta page boutique et l’accueil."}
            </Txt>
            {coverUrl ? (
              <Button
                title="Ajuster le cadrage"
                variant="secondary"
                onPress={() => setAdjusting(true)}
                style={{ marginTop: 8 }}
              />
            ) : null}
            <CoverAdjuster
              visible={adjusting && !!coverUrl}
              coverUrl={coverUrl}
              shopName={me.seller?.shopName || name}
              avatarUrl={avatarUrl}
              subtitle={me.seller?.shopDescription || type.label}
              shopKind={me.seller?.shopKind}
              onClose={() => setAdjusting(false)}
              onConfirm={async (url) => {
                setCoverUrl(url);
                setAdjusting(false);
                try {
                  await updateMe({ coverUrl: url });
                  await client.invalidateQueries({ queryKey: qk.me });
                  toast.success("Couverture enregistrée");
                } catch (error) {
                  toast.error(errorMessage(error));
                }
              }}
            />
          </View>
        ) : null}

        <View style={{ gap: 12 }}>
          <Input label="Nom complet" value={name} onChangeText={setName} />
          <Input label="Email" value={me.email || ""} editable={false} />
          <Input
            label="Téléphone"
            value={me.phone || ""}
            editable={false}
            hint="Le numéro est géré via la connexion — non modifiable ici."
          />
          <Input
            label="Localisation"
            value={city}
            onChangeText={setCity}
            placeholder="Ville, Pays"
          />
          <ZoneSelect
            label="Zone d’expédition"
            value={zoneId}
            onChange={setZoneId}
          />
          <Input
            label="Bio"
            value={bio}
            onChangeText={(value) => setBio(value.slice(0, 200))}
            multiline
            placeholder="Parle de toi..."
            hint={`${bio.length}/200 caractères`}
          />
          <Button
            title={
              loading ? "Enregistrement..." : "Enregistrer les modifications"
            }
            onPress={save}
            loading={loading}
            full
          />
        </View>
      </Card>

      <Card>
        <Txt variant="h3" style={{ marginBottom: 12 }}>
          Aperçu public
        </Txt>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Avatar uri={mediaUrl(avatarUrl)} name={name} size={56} />
          <View style={{ flex: 1 }}>
            <Txt variant="bodyStrong">{name || "Ton nom"}</Txt>
            <Txt variant="caption">{city || "Localisation non renseignée"}</Txt>
          </View>
        </View>
        {bio ? (
          <Txt
            variant="body"
            color={colors.textMuted}
            style={{ marginTop: 10 }}
          >
            {bio}
          </Txt>
        ) : null}
      </Card>
    </Screen>
  );
}
