import { Image } from 'expo-image';
import { useState } from 'react';
import { View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Badge, Button, Card, toast, Txt } from '@/components/ui';
import { useAccountType } from '@/hooks/use-account-type';
import { verificationLabel } from '@/lib/account-type';
import {
  addVerificationDocument,
  errorMessage,
  fetchSellerVerification,
  mediaUrl,
  pickKycFiles,
  uploadDocumentAsset,
  type SellerVerification,
} from '@/lib/api';
import { colors } from '@/theme';

function isImage(url: string) {
  return /\.(png|jpe?g|webp|gif|heic)(\?|$)/i.test(url);
}

function adminAsked(data: SellerVerification) {
  if (data.status === 'rejected') return true;
  if (data.reason?.trim()) return true;
  return (data.messages ?? []).some((message) => message.fromAdmin);
}

export function ShopDossierCard() {
  const client = useQueryClient();
  const { me, type } = useAccountType();
  const [busy, setBusy] = useState(false);
  const dossier = useQuery({
    queryKey: ['seller', 'verification'],
    queryFn: fetchSellerVerification,
    enabled: !!me && type.requiresAdminApproval,
  });

  if (type.id === 'boutique') {
    return (
      <Card style={{ marginBottom: 16, gap: 6 }}>
        <Txt variant="bodyStrong">Dossier boutique</Txt>
        <Txt variant="body" color={colors.textMuted}>
          Les boutiques d’articles neufs n’ont pas besoin de validation.
        </Txt>
      </Card>
    );
  }

  if (!type.requiresAdminApproval) return null;

  const data = dossier.data;
  const documents = data?.documents ?? [];
  const status =
    data?.status === 'pending' || data?.status === 'approved' || data?.status === 'rejected' || data?.status === 'none'
      ? data.status
      : type.verificationStatus;
  const canAdd = !!data && adminAsked(data);

  const add = async () => {
    try {
      const assets = await pickKycFiles({ multiple: true });
      if (!assets.length) return;
      setBusy(true);
      for (const asset of assets) {
        const up = await uploadDocumentAsset(asset);
        await addVerificationDocument({
          url: up.url,
          storageKey: up.publicId,
          mimeType: up.mimeType || (asset.name?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : asset.mimeType),
          name: up.name,
          documentType: 'id',
        });
      }
      await client.invalidateQueries({ queryKey: ['seller', 'verification'] });
      toast.success('Justificatif envoyé');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card style={{ marginBottom: 16, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Txt variant="bodyStrong">Dossier boutique</Txt>
        <Badge
          label={verificationLabel(status)}
          tone={status === 'approved' ? 'success' : status === 'rejected' ? 'danger' : 'warning'}
        />
      </View>
      {data?.reason?.trim() ? <Txt variant="caption">{data.reason}</Txt> : null}
      {documents.length ? (
        documents.map((doc, index) => {
          const uri = mediaUrl(doc.url) || doc.url;
          return (
            <View key={`${doc.url}-${index}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {isImage(doc.url) ? (
                <Image source={{ uri }} style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: colors.surfaceMuted }} contentFit="cover" />
              ) : (
                <View style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: colors.surfaceMuted }} />
              )}
              <Txt variant="body" style={{ flex: 1 }} numberOfLines={2}>
                {doc.name || doc.documentType || 'Justificatif'}
              </Txt>
            </View>
          );
        })
      ) : (
        <Txt variant="caption">Aucun document joint.</Txt>
      )}
      {canAdd ? (
        <Button title={busy ? 'Envoi…' : 'Ajouter un justificatif'} onPress={add} loading={busy} variant="secondary" />
      ) : (
        <Txt variant="caption">Lecture seule. Un justificatif ne peut être ajouté que si l’équipe le demande.</Txt>
      )}
    </Card>
  );
}
