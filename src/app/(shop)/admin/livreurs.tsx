import { Image } from 'expo-image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';

import { Badge, Button, Card, EmptyState, Input, Screen, ScreenHeader, toast, Txt } from '@/components/ui';
import { errorMessage, fetchAdminCouriers, updateAdminCourier, type AdminCourier } from '@/lib/api';

function statusLabel(status?: string) {
  if (status === 'approved') return 'Validé';
  if (status === 'pending') return 'À valider';
  if (status === 'rejected') return 'Refusé';
  return 'Sans dossier';
}

export default function AdminCouriers() {
  const client = useQueryClient();
  const list = useQuery({ queryKey: ['admin', 'couriers'], queryFn: fetchAdminCouriers });
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const review = useMutation({
    mutationFn: ({ id, verificationStatus, rejectionReason }: { id: string; verificationStatus: 'approved' | 'rejected'; rejectionReason?: string }) =>
      updateAdminCourier(id, { verificationStatus, rejectionReason }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['admin', 'couriers'] });
      toast.success('Dossier livreur mis à jour.');
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const toggle = useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) => updateAdminCourier(id, { isAvailable }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['admin', 'couriers'] }),
    onError: (e) => toast.error(errorMessage(e)),
  });

  const openDoc = (url?: string) => {
    if (url) Linking.openURL(url);
  };

  return (
    <Screen>
      <ScreenHeader title="Livreurs" />
      {list.isLoading ? <Txt variant="caption">Chargement…</Txt> : null}
      {!list.isLoading && !(list.data ?? []).length ? <EmptyState title="Aucun livreur" /> : null}
      {(list.data ?? []).map((row: AdminCourier) => (
        <Card key={row.id} style={{ marginBottom: 10, gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            {row.portraitUrl ? (
              <Image source={{ uri: row.portraitUrl }} style={{ width: 48, height: 48, borderRadius: 24 }} contentFit="cover" />
            ) : null}
            <View style={{ flex: 1 }}>
              <Txt variant="bodyStrong">{row.name}</Txt>
              <Txt variant="caption">
                {row.phone || 'Sans téléphone'} · {(row.zoneNames || []).join(', ') || row.zoneName || 'Zone non définie'}
              </Txt>
            </View>
          </View>
          <Txt variant="caption">
            {row.vehicleType || 'Marque non renseignée'} · {row.plate || 'Sans matricule'}
          </Txt>
          <Txt variant="caption">{row.activeMissions ?? 0} en cours · {row.deliveredCount ?? 0} livrées</Txt>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Badge
              label={statusLabel(row.verificationStatus)}
              tone={row.verificationStatus === 'approved' ? 'success' : row.verificationStatus === 'rejected' ? 'danger' : 'warning'}
            />
            <Badge label={row.isAvailable ? 'Disponible' : 'Indisponible'} tone={row.isAvailable ? 'success' : 'neutral'} />
          </View>
          {row.vehiclePhotoUrl ? (
            <Pressable onPress={() => openDoc(row.vehiclePhotoUrl)}>
              <Image source={{ uri: row.vehiclePhotoUrl }} style={{ width: '100%', height: 120, borderRadius: 12 }} contentFit="cover" />
            </Pressable>
          ) : null}
          {(row.identityDocuments ?? []).map((doc) => (
            <Pressable key={doc.url} onPress={() => openDoc(doc.url)}>
              <Txt variant="caption" color="#8A4B2F">
                {doc.name || 'Pièce d’identité'}
              </Txt>
            </Pressable>
          ))}
          {row.verificationStatus !== 'approved' ? (
            <Button
              title="Valider le dossier"
              size="sm"
              onPress={() => review.mutate({ id: row.id, verificationStatus: 'approved' })}
              loading={review.isPending}
            />
          ) : null}
          {row.verificationStatus !== 'rejected' ? (
            <>
              <Input
                placeholder="Motif de refus"
                value={reasons[row.id] || ''}
                onChangeText={(value) => setReasons((current) => ({ ...current, [row.id]: value }))}
              />
              <Button
                title="Refuser le dossier"
                size="sm"
                variant="danger"
                onPress={() => review.mutate({ id: row.id, verificationStatus: 'rejected', rejectionReason: reasons[row.id] || '' })}
                loading={review.isPending}
              />
            </>
          ) : null}
          {row.verificationStatus === 'approved' ? (
            <Button
              title={row.isAvailable ? 'Rendre indisponible' : 'Rendre disponible'}
              size="sm"
              variant="secondary"
              onPress={() => toggle.mutate({ id: row.id, isAvailable: !row.isAvailable })}
            />
          ) : null}
        </Card>
      ))}
    </Screen>
  );
}
