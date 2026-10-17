import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Button, Card, Input, toast, Txt } from '@/components/ui';
import { useZones } from '@/hooks/queries';
import { errorMessage, pickImages, pickKycFiles, uploadDocumentAsset, uploadPickedImage } from '@/lib/api';
import { colors, radius } from '@/theme';

const EXAMPLE = require('../../../assets/courier/portrait-example.jpg');

export type CourierSignupDraft = {
  vehicle: string;
  plate: string;
  zoneIds: string[];
  portraitUrl: string;
  vehiclePhotoUrl: string;
  identity: { url: string; mimeType?: string; name?: string }[];
};

export const EMPTY_COURIER_DRAFT: CourierSignupDraft = {
  vehicle: '',
  plate: '',
  zoneIds: [],
  portraitUrl: '',
  vehiclePhotoUrl: '',
  identity: [],
};

export function validateCourierDraft(draft: CourierSignupDraft) {
  if (!draft.portraitUrl) return 'Ajoute ta photo portrait.';
  if (!draft.identity.length) return 'Ajoute ta pièce d’identité (image ou PDF).';
  if (!draft.vehiclePhotoUrl) return 'Ajoute la photo de ta moto.';
  if (!draft.vehicle.trim() || !draft.plate.trim()) return 'Indique la marque et le matricule de la moto.';
  if (!draft.zoneIds.length) return 'Choisis au moins une zone.';
  return null;
}

export function CourierSignupFields({
  value,
  onChange,
}: {
  value: CourierSignupDraft;
  onChange: (next: CourierSignupDraft) => void;
}) {
  const zones = useZones();
  const [busy, setBusy] = useState<'portrait' | 'vehicle' | 'identity' | null>(null);
  const set = (patch: Partial<CourierSignupDraft>) => onChange({ ...value, ...patch });

  const pickPortrait = async () => {
    setBusy('portrait');
    try {
      const [asset] = await pickImages();
      if (!asset) return;
      const up = await uploadPickedImage(asset, 'kyc');
      set({ portraitUrl: up.url });
      toast.success('Portrait ajouté.');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const pickVehicle = async () => {
    setBusy('vehicle');
    try {
      const [asset] = await pickImages();
      if (!asset) return;
      const up = await uploadPickedImage(asset, 'kyc');
      set({ vehiclePhotoUrl: up.url });
      toast.success('Photo du véhicule ajoutée.');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const pickIdentity = async () => {
    setBusy('identity');
    try {
      const assets = await pickKycFiles({ multiple: true });
      if (!assets.length) return;
      const uploaded: CourierSignupDraft['identity'] = [];
      for (const asset of assets) {
        const up = await uploadDocumentAsset(asset);
        uploaded.push({ url: up.url, mimeType: up.mimeType, name: up.name });
      }
      set({ identity: [...value.identity, ...uploaded].slice(0, 6) });
      toast.success(uploaded.length > 1 ? `${uploaded.length} pièces ajoutées.` : 'Pièce ajoutée.');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={{ gap: 14 }}>
      <View>
        <Txt variant="title">Ton dossier livreur</Txt>
        <Txt variant="caption">Photo de profil, pièce d’identité et image du véhicule.</Txt>
      </View>

      <Card style={{ gap: 12 }}>
        <Txt variant="title">Photo portrait</Txt>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Image source={EXAMPLE} style={{ width: 72, height: 72, borderRadius: 36 }} contentFit="cover" />
            <Txt variant="small">Exemple</Txt>
          </View>
          <Pressable onPress={pickPortrait} disabled={!!busy} style={{ alignItems: 'center', gap: 4 }}>
            {value.portraitUrl ? (
              <Image source={{ uri: value.portraitUrl }} style={{ width: 72, height: 72, borderRadius: 36 }} contentFit="cover" />
            ) : (
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: colors.surfaceMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                {busy === 'portrait' ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Ionicons name="camera-outline" size={22} color={colors.textMuted} />
                )}
              </View>
            )}
            <Txt variant="small">{busy === 'portrait' ? 'Envoi…' : 'Ta photo'}</Txt>
          </Pressable>
        </View>
        <Txt variant="caption">Visage de face, épaules visibles.</Txt>
      </Card>

      <Card style={{ gap: 10 }}>
        <Txt variant="title">Véhicule</Txt>
        <Input label="Marque" value={value.vehicle} onChangeText={(vehicle) => set({ vehicle })} placeholder="Yamaha, Honda…" />
        <Input
          label="Matricule"
          value={value.plate}
          onChangeText={(plate) => set({ plate })}
          placeholder="GN-1234-AB"
          autoCapitalize="characters"
        />
        <Txt variant="label">Zones</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(zones.data ?? []).map((zone) => {
            const on = value.zoneIds.includes(zone.id);
            return (
              <Pressable
                key={zone.id}
                onPress={() =>
                  set({
                    zoneIds: on ? value.zoneIds.filter((id) => id !== zone.id) : [...value.zoneIds, zone.id],
                  })
                }
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: radius.pill,
                  backgroundColor: on ? colors.primary : colors.surfaceMuted,
                }}>
                <Txt variant="caption" color={on ? colors.white : colors.text}>
                  {zone.nameFr}
                </Txt>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card style={{ gap: 10 }}>
        <Txt variant="title">Pièce d’identité</Txt>
        {value.identity.map((doc) => (
          <View key={doc.url} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Ionicons name={doc.mimeType?.includes('pdf') ? 'document-text-outline' : 'image-outline'} size={18} color={colors.primary} />
            <Txt variant="caption" style={{ flex: 1 }} numberOfLines={1}>
              {doc.name || 'Pièce'}
            </Txt>
            <Pressable
              hitSlop={8}
              onPress={() => set({ identity: value.identity.filter((item) => item.url !== doc.url) })}
              accessibilityLabel="Retirer la pièce">
              <Ionicons name="trash" size={16} color={colors.error} />
            </Pressable>
          </View>
        ))}
        <Button title={busy === 'identity' ? 'Envoi…' : 'Ajouter une image ou un PDF'} variant="secondary" onPress={pickIdentity} loading={busy === 'identity'} />
      </Card>

      <Card style={{ gap: 10 }}>
        <Txt variant="title">Photo du véhicule</Txt>
        {value.vehiclePhotoUrl ? (
          <View>
            <Image source={{ uri: value.vehiclePhotoUrl }} style={{ width: '100%', height: 160, borderRadius: radius.lg }} contentFit="cover" />
            {busy === 'vehicle' ? (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                  borderRadius: radius.lg,
                  backgroundColor: 'rgba(43,23,20,0.45)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <ActivityIndicator color={colors.white} />
              </View>
            ) : null}
          </View>
        ) : (
          <Txt variant="caption">Aucune photo pour le moment.</Txt>
        )}
        <Button title={busy === 'vehicle' ? 'Envoi…' : 'Choisir la photo'} variant="secondary" onPress={pickVehicle} loading={busy === 'vehicle'} />
      </Card>
    </View>
  );
}
