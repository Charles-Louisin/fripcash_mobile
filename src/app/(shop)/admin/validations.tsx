import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Badge, Button, Card, EmptyState, Input, Screen, ScreenHeader, Skeleton, toast, Txt } from '@/components/ui';
import {
  approveSellerVerification,
  errorMessage,
  fetchSellerVerifications,
  mediaUrl,
  rejectSellerVerification,
  type SellerVerificationRow,
} from '@/lib/api';
import { formatDate } from '@/lib/format';
import { colors } from '@/theme';

const KIND_LABEL: Record<string, string> = {
  standard: 'Boutique',
  proximite: 'Commerce local',
  enseigne: 'Enseigne',
};

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={{ gap: 2 }}>
      <Txt variant="small">{label}</Txt>
      <Txt variant="body">{value}</Txt>
    </View>
  );
}

function Dossier({ row }: { row: SellerVerificationRow }) {
  const docs = row.documents ?? [];
  const hours = row.openingTime && row.closingTime ? `${row.openingTime} – ${row.closingTime}` : undefined;
  return (
    <View style={{ gap: 10, paddingTop: 4 }}>
      {row.coverUrl ? (
        <Image source={mediaUrl(row.coverUrl) ?? row.coverUrl} style={{ height: 110, borderRadius: 12 }} contentFit="cover" />
      ) : null}
      <Field label="Description" value={row.shopDescription} />
      <Field label="Adresse" value={[row.storeAddress, row.neighborhood].filter(Boolean).join(', ')} />
      <Field label="Repère" value={row.landmark} />
      <Field label="Catégories vendues" value={row.soldCategories?.join(', ')} />
      <Field label="Communes livrées" value={row.deliveredCommunes?.join(', ')} />
      <Field label="Délai de livraison" value={row.deliveryDelay} />
      <Field label="Horaires" value={hours} />
      <Field label="Mobile Money" value={row.orangeMoneyPhone} />
      <View style={{ gap: 6 }}>
        <Txt variant="small">Pièces KYC ({docs.length})</Txt>
        {docs.length === 0 ? <Txt variant="caption">Aucune pièce fournie</Txt> : null}
        {docs.map((doc, i) => {
          const url = mediaUrl(doc.url) ?? doc.url;
          const pdf = doc.mimeType?.includes('pdf') || url.toLowerCase().endsWith('.pdf');
          return (
            <Pressable
              key={`${doc.url}-${i}`}
              onPress={() => WebBrowser.openBrowserAsync(url).catch(() => toast.error('Ouverture impossible.'))}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                padding: 10,
                borderRadius: 12,
                backgroundColor: colors.surfaceMuted,
              }}>
              {pdf ? (
                <Ionicons name="document-text-outline" size={22} color={colors.primary} />
              ) : (
                <Image source={url} style={{ width: 36, height: 36, borderRadius: 8 }} contentFit="cover" />
              )}
              <Txt variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                {doc.name || (pdf ? 'Document PDF' : 'Image')}
              </Txt>
              <Ionicons name="open-outline" size={16} color={colors.textMuted} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function AdminValidations() {
  const client = useQueryClient();
  const [note, setNote] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const list = useQuery({ queryKey: ['admin', 'verifications'], queryFn: fetchSellerVerifications });
  const refresh = () => {
    client.invalidateQueries({ queryKey: ['admin', 'verifications'] });
    client.invalidateQueries({ queryKey: ['admin', 'stats'] });
  };
  const approve = useMutation({
    mutationFn: approveSellerVerification,
    onSuccess: () => {
      toast.success('Boutique validée');
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const reject = useMutation({
    mutationFn: (id: string) => rejectSellerVerification(id, note.trim()),
    onSuccess: () => {
      toast.success('Dossier refusé');
      setNote('');
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <Screen keyboard refreshing={list.isRefetching} onRefresh={() => list.refetch()}>
      <ScreenHeader title="Validations" subtitle="Commerce local et enseignes" />
      <Input label="Motif de refus" value={note} onChangeText={setNote} placeholder="Pièce illisible, adresse incomplète…" />
      <View style={{ height: 12 }} />
      {list.isLoading ? (
        <View style={{ gap: 12 }}>
          {[0, 1].map((i) => (
            <Skeleton key={i} height={120} radius={16} />
          ))}
        </View>
      ) : null}
      {!list.isLoading && !(list.data ?? []).length ? (
        <EmptyState icon="shield-checkmark-outline" title="Aucun dossier en attente" />
      ) : null}
      {(list.data ?? []).map((row) => {
        const expanded = open === row.id;
        return (
          <Card key={row.id} style={{ marginBottom: 12, gap: 8 }}>
            <Pressable onPress={() => setOpen(expanded ? null : row.id)} style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Txt variant="bodyStrong" style={{ flex: 1 }}>
                  {row.shopName || row.displayName || 'Boutique'}
                </Txt>
                <Badge
                  label={row.verificationStatus === 'rejected' ? 'Refusé' : 'En attente'}
                  tone={row.verificationStatus === 'rejected' ? 'danger' : 'warning'}
                />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Txt variant="caption" style={{ flex: 1 }}>
                  {KIND_LABEL[row.shopKind ?? ''] ?? 'Boutique'} · {row.phone || row.displayName}
                  {row.createdAt ? ` · ${formatDate(row.createdAt)}` : ''}
                </Txt>
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
              </View>
              {row.verificationStatus === 'rejected' && row.rejectionReason ? (
                <Txt variant="small" color={colors.error}>
                  Motif : {row.rejectionReason}
                </Txt>
              ) : null}
            </Pressable>
            {expanded ? <Dossier row={row} /> : null}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button title="Valider" size="sm" onPress={() => approve.mutate(row.id)} style={{ flex: 1 }} />
              <Button title="Refuser" size="sm" variant="danger" onPress={() => reject.mutate(row.id)} style={{ flex: 1 }} />
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}
