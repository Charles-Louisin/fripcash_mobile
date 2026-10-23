import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { ZoneSelect } from "@/components/select-field";
import { CoverAdjuster } from "@/components/seller/cover-adjuster";
import { Button, Chip, Input, toast, Txt } from "@/components/ui";
import {
  errorMessage,
  mediaUrl,
  pickImages,
  pickKycFiles,
  uploadDocumentAsset,
  uploadPickedImage,
  type ShopApplication,
  type SignupRole,
} from "@/lib/api";
import { useCategories, useZones } from "@/hooks/queries";
import { coverContentPosition, withCoverFocus } from "@/lib/cover-focus";
import { parseGnMobile } from "@/lib/gn-phone";
import { colors, radius } from "@/theme";

const SELL_PRESETS = ["Électroménager", "High-tech", "Mode", "Maison"];
const COMMUNE_PRESETS = ["Ratoma", "Matam", "Dixinn", "Kaloum"];

const KIND_DESTINATION = {
  STANDARD: "ARTICLES_NEUFS",
  PROXIMITE: "QUARTIER_BOUTIQUES",
  ENSEIGNE: "ENSEIGNES",
} as const;

export function shopKindForRole(
  role: SignupRole,
): ShopApplication["shopKind"] | null {
  if (role === "boutique") return "STANDARD";
  if (role === "commerceLocal") return "PROXIMITE";
  if (role === "grandeSurface") return "ENSEIGNE";
  return null;
}

export function shopTitleForRole(role: SignupRole) {
  if (role === "grandeSurface") return "Ton enseigne";
  if (role === "boutique") return "Ta boutique";
  return "Ton commerce local";
}

export type ShopDraft = {
  name: string;
  description: string;
  coverUrl: string;
  storeAddress: string;
  soldCategories: string[];
  deliveredCommunes: string[];
  deliveryDelay: string;
  neighborhood: string;
  landmark: string;
  orangeMoneyPhone: string;
  openingTime: string;
  closingTime: string;
  shippingZoneId: string;
  documents: ShopApplication["documents"];
};

export const EMPTY_SHOP_DRAFT: ShopDraft = {
  name: "",
  description: "",
  coverUrl: "",
  storeAddress: "",
  soldCategories: [],
  deliveredCommunes: [],
  deliveryDelay: "",
  neighborhood: "",
  landmark: "",
  orangeMoneyPhone: "",
  openingTime: "",
  closingTime: "",
  shippingZoneId: "",
  documents: [],
};

function toggle(list: string[], value: string, single?: boolean) {
  if (single) return list[0] === value ? [] : [value];
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

function TagPicker({
  label,
  hint,
  presets,
  values,
  onChange,
  single,
}: {
  label: string;
  hint?: string;
  presets: string[];
  values: string[];
  onChange: (next: string[]) => void;
  single?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const options = [...new Set([...presets, ...values])];
  return (
    <View style={{ gap: 8 }}>
      <Txt variant="label">{label}</Txt>
      <View style={styles.wrap}>
        {options.map((option) => (
          <Chip
            key={option}
            label={option}
            active={values.includes(option)}
            onPress={() => onChange(toggle(values, option, single))}
          />
        ))}
      </View>
      <Input
        placeholder="Ajouter"
        value={draft}
        onChangeText={setDraft}
        onSubmitEditing={() => {
          const next = draft.trim();
          if (!next) return;
          onChange(
            single
              ? [next]
              : values.includes(next)
                ? values
                : [...values, next],
          );
          setDraft("");
        }}
      />
      {hint ? <Txt variant="caption">{hint}</Txt> : null}
    </View>
  );
}

export function ShopApplicationFields({
  role,
  value,
  onChange,
}: {
  role: SignupRole;
  value: ShopDraft;
  onChange: (next: ShopDraft) => void;
}) {
  const kind = shopKindForRole(role);
  const [busy, setBusy] = useState<"cover" | "doc" | null>(null);
  const [adjusting, setAdjusting] = useState(false);
  const categories = useCategories();
  const zones = useZones();
  if (!kind) return null;
  const destination = KIND_DESTINATION[kind];
  const categoryPresets = (categories.data ?? [])
    .filter((c) => !c.destination || c.destination === destination)
    .map((c) => c.nameFr);
  const sellPresets = categoryPresets.length ? categoryPresets : SELL_PRESETS;
  const zonePresets = (zones.data ?? []).map((z) => z.nameFr).filter(Boolean);
  const communePresets = zonePresets.length ? zonePresets : COMMUNE_PRESETS;
  const set = (patch: Partial<ShopDraft>) => onChange({ ...value, ...patch });

  const addCover = async () => {
    try {
      const assets = await pickImages();
      if (!assets[0]) return;
      setBusy("cover");
      const up = await uploadPickedImage(assets[0], "kyc");
      set({ coverUrl: withCoverFocus(up.url, { x: 50, y: 50 }) });
      setAdjusting(true);
      toast.success("Place la couverture, puis valide");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const addDocs = async () => {
    try {
      const assets = await pickKycFiles({ multiple: true });
      if (!assets.length) return;
      setBusy("doc");
      const uploaded = [];
      for (const asset of assets) {
        const up = await uploadDocumentAsset(asset);
        uploaded.push({
          url: up.url,
          storageKey: up.publicId,
          mimeType: up.mimeType || (asset.name?.toLowerCase().endsWith(".pdf") ? "application/pdf" : asset.mimeType),
          name: up.name,
          documentType: "id" as const,
        });
      }
      set({ documents: [...value.documents, ...uploaded] });
      toast.success(uploaded.length > 1 ? `${uploaded.length} justificatifs ajoutés.` : "Justificatif ajouté.");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={{ gap: 14 }}>
      <View>
        <Txt variant="title">{shopTitleForRole(role)}</Txt>
        <Txt variant="caption">
          {role === "commerceLocal"
            ? "Description, couverture et CNI."
            : role === "grandeSurface"
              ? "Description, couverture et registre de commerce (ou équivalent)."
              : "Description, couverture et pièces KYC."}
        </Txt>
      </View>

      <ZoneSelect
        label="Zone d’expédition"
        value={value.shippingZoneId || null}
        onChange={(id) => set({ shippingZoneId: id })}
      />
      <Input
        label={kind === "ENSEIGNE" ? "Nom de l'enseigne" : "Nom de la boutique"}
        icon="storefront-outline"
        value={value.name}
        onChangeText={(name) => set({ name })}
        placeholder={
          kind === "ENSEIGNE"
            ? "Tech Guinée"
            : kind === "PROXIMITE"
              ? "Alimentation Bah"
              : "Ma boutique"
        }
      />
      <Input
        label="Description"
        value={value.description}
        onChangeText={(description) => set({ description })}
        multiline
        placeholder={
          kind === "ENSEIGNE"
            ? "Présente l’enseigne, ce que tu vends, tes horaires…"
            : kind === "PROXIMITE"
              ? "Présente ton commerce de quartier…"
              : "Présente ta boutique et tes articles…"
        }
      />

      <View style={{ gap: 8 }}>
        <Txt variant="label">Photo de couverture</Txt>
        <View>
          <Pressable
            disabled={busy !== null}
            onPress={() => void addCover()}
            style={styles.cover}
          >
            {value.coverUrl ? (
              <Image
                source={{ uri: mediaUrl(value.coverUrl) || value.coverUrl }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                contentPosition={coverContentPosition(value.coverUrl)}
              />
            ) : (
              <View style={styles.coverEmpty}>
                <Ionicons
                  name="image-outline"
                  size={22}
                  color={colors.primary}
                />
                <Txt variant="label" color={colors.primary}>
                  Ajouter une couverture
                </Txt>
              </View>
            )}
            {busy === "cover" ? (
              <View style={styles.coverBusy}>
                <ActivityIndicator color={colors.white} />
                <Txt variant="caption" color={colors.white}>
                  Envoi…
                </Txt>
              </View>
            ) : null}
          </Pressable>
          {value.coverUrl && busy !== "cover" ? (
            <Pressable
              style={styles.trash}
              hitSlop={8}
              onPress={() => set({ coverUrl: "" })}
              accessibilityLabel="Supprimer la couverture"
            >
              <Ionicons name="trash" size={16} color={colors.error} />
            </Pressable>
          ) : null}
        </View>
        {value.coverUrl ? (
          <Button
            title="Ajuster le cadrage"
            variant="secondary"
            onPress={() => setAdjusting(true)}
          />
        ) : null}
        <CoverAdjuster
          visible={adjusting && !!value.coverUrl}
          coverUrl={value.coverUrl}
          shopName={value.name || "Ma boutique"}
          subtitle={value.description}
          shopKind={
            kind === "PROXIMITE"
              ? "proximite"
              : kind === "ENSEIGNE"
                ? "enseigne"
                : "standard"
          }
          onClose={() => setAdjusting(false)}
          onConfirm={(url) => {
            set({ coverUrl: url });
            setAdjusting(false);
          }}
        />
      </View>

      <TagPicker
        label="Ce que tu vends"
        hint="Ces catégories deviennent les filtres de ta page boutique."
        presets={sellPresets}
        values={value.soldCategories}
        onChange={(soldCategories) => set({ soldCategories })}
      />
      {kind === "ENSEIGNE" ? (
        <>
          <Input
            label="Adresse du magasin"
            icon="location-outline"
            value={value.storeAddress}
            onChangeText={(storeAddress) => set({ storeAddress })}
            placeholder="Matam, route Le Prince"
          />
          <Input
            label="Délai de livraison annoncé"
            icon="flash-outline"
            value={value.deliveryDelay}
            onChangeText={(deliveryDelay) => set({ deliveryDelay })}
            placeholder="4 heures"
          />
        </>
      ) : null}

      {kind === "PROXIMITE" ? (
        <>
          <TagPicker
            label="Quartier"
            // hint="Un seul quartier : c’est ce qui te fera apparaître aux voisins."
            presets={communePresets}
            values={value.neighborhood ? [value.neighborhood] : []}
            onChange={(next) => set({ neighborhood: next[0] || "" })}
            single
          />
          <Input
            label="Point de repère"
            icon="navigate-outline"
            value={value.landmark}
            onChangeText={(landmark) => set({ landmark })}
            placeholder="rue du marché, en face de la pharmacie"
          />
          <Input
            label="Mobile Money (Orange ou MTN)"
            icon="call-outline"
            value={value.orangeMoneyPhone}
            onChangeText={(orangeMoneyPhone) => set({ orangeMoneyPhone })}
            keyboardType="phone-pad"
            placeholder="+224 62X XXX XXX"
          />
          <View style={styles.hours}>
            <Input
              label="Ouverture"
              value={value.openingTime}
              onChangeText={(openingTime) => set({ openingTime })}
              placeholder="08 h 00"
              containerStyle={{ flex: 1 }}
            />
            <Input
              label="Fermeture"
              value={value.closingTime}
              onChangeText={(closingTime) => set({ closingTime })}
              placeholder="22 h 00"
              containerStyle={{ flex: 1 }}
            />
          </View>
        </>
      ) : null}

      <View style={{ gap: 8 }}>
        <Txt variant="label">Pièces KYC</Txt>
        <Txt variant="caption">
          {role === "commerceLocal"
            ? "Envoie ta CNI (image ou PDF)."
            : role === "grandeSurface"
              ? "Registre de commerce ou dossier équivalent (image ou PDF)."
              : "Ajoute au moins une pièce (image ou PDF)."}
        </Txt>
        <Button
          title={busy === "doc" ? "Envoi…" : "Ajouter un justificatif"}
          variant="secondary"
          loading={busy === "doc"}
          onPress={() => void addDocs()}
        />
        {value.documents.map((doc) => {
          const preview = doc.mimeType?.startsWith("image/")
            ? mediaUrl(doc.url) || doc.url
            : null;
          return (
            <View key={doc.url} style={styles.doc}>
              {preview ? (
                <Image
                  source={{ uri: preview }}
                  style={styles.thumb}
                  contentFit="cover"
                />
              ) : (
                <Ionicons
                  name="document-outline"
                  size={18}
                  color={colors.primary}
                />
              )}
              <Txt variant="caption" style={{ flex: 1 }} numberOfLines={1}>
                {doc.name || "Document"}
              </Txt>
              <Pressable
                onPress={() =>
                  set({
                    documents: value.documents.filter((d) => d.url !== doc.url),
                  })
                }
                hitSlop={8}
                accessibilityLabel="Supprimer"
              >
                <Ionicons
                  name="trash-outline"
                  size={16}
                  color={colors.textMuted}
                />
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function validateShopDraft(
  role: SignupRole,
  draft: ShopDraft,
): string | null {
  const kind = shopKindForRole(role);
  if (!kind) return null;
  if (!draft.shippingZoneId) return "Choisis ta zone d’expédition.";
  if (!draft.name.trim()) return "Indique le nom de la boutique.";
  if (!draft.description.trim()) return "Ajoute une description.";
  if (!draft.documents.length) return "Ajoute au moins une pièce KYC.";
  if (!draft.soldCategories.length) return "Choisis au moins une catégorie dans « Ce que tu vends ».";
  if (kind === "ENSEIGNE") {
    if (!draft.storeAddress.trim()) return "Indique l’adresse du magasin.";
    if (!draft.deliveryDelay.trim()) return "Indique le délai de livraison annoncé.";
  }
  if (kind === "PROXIMITE") {
    if (
      !draft.neighborhood ||
      !draft.landmark.trim() ||
      !draft.orangeMoneyPhone.trim() ||
      !draft.openingTime.trim() ||
      !draft.closingTime.trim()
    ) {
      return "Remplis le quartier, le repère, le Mobile Money et les horaires.";
    }
    if (!parseGnMobile(draft.orangeMoneyPhone)) {
      return "Le numéro Mobile Money doit être un mobile guinéen Orange (62) ou MTN (65).";
    }
  }
  return null;
}

export function shopDraftToApplication(
  role: SignupRole,
  draft: ShopDraft,
): ShopApplication {
  const kind = shopKindForRole(role)!;
  const payout = parseGnMobile(draft.orangeMoneyPhone);
  return {
    shopKind: kind,
    name: draft.name.trim(),
    description: draft.description.trim(),
    coverUrl: draft.coverUrl || undefined,
    storeAddress: draft.storeAddress.trim() || undefined,
    neighborhood: draft.neighborhood || undefined,
    landmark: draft.landmark.trim() || undefined,
    orangeMoneyPhone: payout?.e164,
    openingTime: draft.openingTime.trim() || undefined,
    closingTime: draft.closingTime.trim() || undefined,
    deliveryDelay: draft.deliveryDelay.trim() || undefined,
    soldCategories: draft.soldCategories,
    deliveredCommunes: draft.deliveredCommunes,
    shippingZoneId: draft.shippingZoneId || undefined,
    documents: draft.documents,
  };
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  hours: { flexDirection: "row", gap: 10 },
  doc: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.surfaceMuted,
  },
  cover: {
    height: 148,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  coverEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  coverBusy: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(43, 23, 20, 0.45)",
  },
  trash: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
});
