import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { Badge, Button, Card, Input, toast, Txt } from '@/components/ui';
import { qk, useZones } from '@/hooks/queries';
import {
  errorMessage,
  pickImages,
  pickKycFiles,
  submitCourierKyc,
  updateCourierProfile,
  uploadDocumentAsset,
  uploadPickedImage,
  type CourierProfile,
} from '@/lib/api';
import { toE164 } from '@/lib/gn-phone';
import { colors, radius } from '@/theme';

const EXAMPLE = require('../../../assets/courier/portrait-example.jpg');

type Doc = { url: string; mimeType?: string; name?: string };

function localPhone(phone?: string) {
  return (phone || '').replace(/^\+224/, '');
}

function statusLabel(status?: string) {
  if (status === 'approved') return 'Validé';
  if (status === 'pending') return 'En cours de validation';
  if (status === 'rejected') return 'Refusé';
  return 'Dossier à envoyer';
}

function dossierKey(profile: CourierProfile) {
  const courier = profile.courier;
  return [
    profile.name,
    profile.phone,
    profile.city,
    profile.bio,
    profile.avatarUrl,
    courier?.vehicle,
    courier?.plate,
    courier?.portraitUrl,
    courier?.vehiclePhotoUrl,
    (courier?.zoneIds || []).join(','),
    (courier?.identityDocuments || []).map((doc) => doc.url).join(','),
    courier?.verificationStatus,
    courier?.rejectionReason,
    courier?.kycLocked,
  ].join('|');
}

export function CourierDossier({ profile }: { profile: CourierProfile }) {
  return <CourierDossierForm key={dossierKey(profile)} profile={profile} />;
}

function CourierDossierForm({ profile }: { profile: CourierProfile }) {
  const client = useQueryClient();
  const zones = useZones();
  const courier = profile.courier;
  const locked = !!courier?.kycLocked;
  const [name, setName] = useState(profile.name || '');
  const [phone, setPhone] = useState(localPhone(profile.phone));
  const [city, setCity] = useState(profile.city || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [vehicle, setVehicle] = useState(courier?.vehicle || '');
  const [plate, setPlate] = useState(courier?.plate || '');
  const [zoneIds, setZoneIds] = useState<string[]>(courier?.zoneIds || []);
  const [portraitUrl, setPortraitUrl] = useState(courier?.portraitUrl || profile.avatarUrl || '');
  const [vehiclePhotoUrl, setVehiclePhotoUrl] = useState(courier?.vehiclePhotoUrl || '');
  const [identity, setIdentity] = useState<Doc[]>(courier?.identityDocuments || []);
  const [busy, setBusy] = useState<'portrait' | 'vehicle' | 'identity' | 'save' | null>(null);

  const toggleZone = (id: string) => {
    setZoneIds((current) => (current.includes(id) ? current.filter((z) => z !== id) : [...current, id]));
  };

  const pickPortrait = async () => {
    setBusy('portrait');
    try {
      const [asset] = await pickImages();
      if (!asset) return;
      const up = await uploadPickedImage(asset, 'kyc');
      setPortraitUrl(up.url);
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
      setVehiclePhotoUrl(up.url);
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
      const uploaded: Doc[] = [];
      for (const asset of assets) {
        const up = await uploadDocumentAsset(asset);
        uploaded.push({ url: up.url, mimeType: up.mimeType, name: up.name });
      }
      setIdentity((current) => [...current, ...uploaded].slice(0, 6));
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    const e164 = toE164(phone);
    if (!name.trim()) return toast.error('Indique ton nom.');
    if (!e164) return toast.error('Numéro guinéen invalide (9 chiffres, commence par 6).');
    if (!vehicle.trim() || !plate.trim()) return toast.error('Indique la marque et le matricule.');
    if (!zoneIds.length) return toast.error('Choisis au moins une zone.');
    setBusy('save');
    try {
      if (locked) {
        await updateCourierProfile({
          name: name.trim(),
          phone: e164,
          city: city.trim(),
          bio: bio.trim(),
          vehicle: vehicle.trim(),
          plate: plate.trim(),
          portraitUrl,
          zoneIds,
        });
        toast.success('Profil mis à jour.');
      } else {
        if (!portraitUrl) return toast.error('Ajoute ta photo portrait.');
        if (!vehiclePhotoUrl) return toast.error('Ajoute la photo du véhicule.');
        if (!identity.length) return toast.error('Ajoute ta pièce d’identité.');
        await submitCourierKyc({
          portraitUrl,
          vehiclePhotoUrl,
          vehicle: vehicle.trim(),
          plate: plate.trim(),
          zoneIds,
          identityDocuments: identity,
        });
        await updateCourierProfile({
          name: name.trim(),
          phone: e164,
          city: city.trim(),
          bio: bio.trim(),
        });
        toast.success('Dossier envoyé. Il sera examiné par l’équipe.');
      }
      await client.invalidateQueries({ queryKey: qk.courierMe });
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={{ gap: 14 }}>
      <Card style={{ gap: 8 }}>
        <Badge
          label={statusLabel(courier?.verificationStatus)}
          tone={courier?.verificationStatus === 'approved' ? 'success' : courier?.verificationStatus === 'rejected' ? 'danger' : 'warning'}
        />
        <Txt variant="body" color={colors.textMuted}>
          {locked
            ? 'Tu peux modifier ton profil, ta photo, la marque et le matricule. La pièce d’identité et la photo du véhicule restent celles envoyées.'
            : 'Envoie ton portrait, ta pièce d’identité et la photo du véhicule. L’équipe valide le dossier avant les missions.'}
        </Txt>
        {courier?.verificationStatus === 'rejected' && courier.rejectionReason ? (
          <Txt variant="caption" color={colors.error}>
            Motif : {courier.rejectionReason}
          </Txt>
        ) : null}
      </Card>

      <Card style={{ gap: 12 }}>
        <Txt variant="title">Photo portrait</Txt>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Image source={EXAMPLE} style={{ width: 72, height: 72, borderRadius: 36 }} contentFit="cover" />
            <Txt variant="small">Exemple</Txt>
          </View>
          <Pressable onPress={pickPortrait} style={{ alignItems: 'center', gap: 4 }}>
            {portraitUrl ? (
              <Image source={{ uri: portraitUrl }} style={{ width: 72, height: 72, borderRadius: 36 }} contentFit="cover" />
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
                <Ionicons name="camera-outline" size={22} color={colors.textMuted} />
              </View>
            )}
            <Txt variant="small">{busy === 'portrait' ? 'Envoi…' : 'Ta photo'}</Txt>
          </Pressable>
        </View>
        <Txt variant="caption">
          Visage de face, épaules visibles, sans lunettes ni chapeau, sur un fond uni — comme l’exemple.
        </Txt>
      </Card>

      <Card style={{ gap: 10 }}>
        <Txt variant="title">Identité et véhicule</Txt>
        <Input label="Nom" value={name} onChangeText={setName} />
        <Input label="Téléphone" prefix="+224" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Input label="Ville" value={city} onChangeText={setCity} />
        <Input label="Bio" value={bio} onChangeText={setBio} multiline />
        <Input label="Marque de la moto" value={vehicle} onChangeText={setVehicle} placeholder="Yamaha, Honda…" />
        <Input label="Matricule" value={plate} onChangeText={setPlate} placeholder="GN-1234-AB" autoCapitalize="characters" />
        <Txt variant="label">Zones</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(zones.data ?? []).map((zone) => {
            const on = zoneIds.includes(zone.id);
            return (
              <Pressable
                key={zone.id}
                onPress={() => toggleZone(zone.id)}
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
        {locked ? <Txt variant="caption">Document verrouillé après envoi.</Txt> : null}
        {identity.map((doc) => (
          <Pressable key={doc.url} onPress={() => Linking.openURL(doc.url)} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Ionicons name={doc.mimeType?.includes('pdf') ? 'document-text-outline' : 'image-outline'} size={18} color={colors.primary} />
            <Txt variant="caption" style={{ flex: 1 }} numberOfLines={1}>
              {doc.name || 'Pièce'}
            </Txt>
          </Pressable>
        ))}
        {locked ? null : (
          <Button title="Ajouter une image ou un PDF" variant="secondary" onPress={pickIdentity} loading={busy === 'identity'} />
        )}
      </Card>

      <Card style={{ gap: 10 }}>
        <Txt variant="title">Photo du véhicule</Txt>
        {vehiclePhotoUrl ? (
          <Image source={{ uri: vehiclePhotoUrl }} style={{ width: '100%', height: 160, borderRadius: radius.lg }} contentFit="cover" />
        ) : (
          <Txt variant="caption">Aucune photo pour le moment.</Txt>
        )}
        {locked ? (
          <Txt variant="caption">Photo verrouillée après envoi.</Txt>
        ) : (
          <Button title="Choisir la photo" variant="secondary" onPress={pickVehicle} loading={busy === 'vehicle'} />
        )}
      </Card>

      <Button title={locked ? 'Enregistrer' : 'Envoyer mon dossier'} onPress={save} loading={busy === 'save'} full />
    </View>
  );
}
