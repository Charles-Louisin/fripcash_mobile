import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import {
  EMPTY_SHOP_DRAFT,
  ShopApplicationFields,
  shopDraftToApplication,
  validateShopDraft,
  type ShopDraft,
} from '@/components/seller/shop-application-fields';
import { SelectField } from '@/components/select-field';
import { Badge, Button, Card, Input, Screen, ScreenHeader, toast, Txt } from '@/components/ui';
import { qk, useMe } from '@/hooks/queries';
import { verificationLabel } from '@/lib/account-type';
import {
  applyForShop,
  errorMessage,
  fetchSellerVerification,
  sendVerificationMessage,
  type SellerVerification,
  type SignupRole,
} from '@/lib/api';
import { formatRelative } from '@/lib/format';

type ShopRole = Extract<SignupRole, 'boutique' | 'commerceLocal' | 'grandeSurface'>;

const ROLE_OF_KIND: Record<string, ShopRole> = {
  standard: 'boutique',
  proximite: 'commerceLocal',
  enseigne: 'grandeSurface',
};

function draftFrom(v: SellerVerification, zoneId: string): ShopDraft {
  return {
    ...EMPTY_SHOP_DRAFT,
    name: v.shopName || '',
    description: v.shopDescription || '',
    storeAddress: v.storeAddress || '',
    soldCategories: v.soldCategories ?? [],
    deliveredCommunes: v.deliveredCommunes ?? [],
    deliveryDelay: v.deliveryDelay || '',
    neighborhood: v.neighborhood || '',
    landmark: v.landmark || '',
    orangeMoneyPhone: v.orangeMoneyPhone || '',
    openingTime: v.openingTime || '',
    closingTime: v.closingTime || '',
    shippingZoneId: zoneId,
    documents: v.documents.map((d) => ({
      url: d.url,
      name: d.name,
      mimeType: d.mimeType,
      documentType: 'id' as const,
    })),
  };
}

export default function DemandeBoutiqueScreen() {
  const client = useQueryClient();
  const me = useMe();
  const [verif, setVerif] = useState<SellerVerification | null>(null);
  const [role, setRole] = useState<ShopRole>('boutique');
  const [draft, setDraft] = useState<ShopDraft>(EMPTY_SHOP_DRAFT);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const zoneId = me.data?.shippingZoneId ?? '';

  const load = () =>
    fetchSellerVerification()
      .then((v) => {
        setVerif(v);
        if (v.shopKind && ROLE_OF_KIND[v.shopKind]) setRole(ROLE_OF_KIND[v.shopKind]);
        setDraft(draftFrom(v, zoneId));
      })
      .catch(() => {});

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoneId]);

  const editable = !verif || verif.status === 'none' || verif.status === 'rejected';

  const submit = async () => {
    const error = validateShopDraft(role, draft);
    if (error) {
      toast.error(error);
      return;
    }
    setBusy(true);
    try {
      await applyForShop(shopDraftToApplication(role, draft));
      await client.invalidateQueries({ queryKey: qk.me });
      toast.success('Dossier envoyé');
      load();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const sendMsg = async () => {
    if (!message.trim()) return;
    try {
      await sendVerificationMessage(message.trim());
      setMessage('');
      load();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <Screen keyboard>
      <ScreenHeader title="Dossier boutique" />
      {verif && verif.status !== 'none' ? (
        <Card style={{ marginBottom: 12, gap: 6 }}>
          <Badge
            label={verificationLabel(verif.status)}
            tone={verif.status === 'approved' ? 'success' : verif.status === 'rejected' ? 'danger' : 'neutral'}
          />
          {verif.status === 'rejected' && verif.reason ? <Txt variant="caption">Motif : {verif.reason}</Txt> : null}
        </Card>
      ) : null}

      {editable ? (
        <View style={{ gap: 12 }}>
          <SelectField
            label="Type de boutique"
            value={role}
            onChange={(v) => setRole(v as ShopRole)}
            options={[
              { value: 'boutique', label: 'Boutique (articles neufs)' },
              { value: 'commerceLocal', label: 'Commerce local' },
              { value: 'grandeSurface', label: 'Enseigne / grande surface' },
            ]}
          />
          <ShopApplicationFields role={role} value={draft} onChange={setDraft} />
          <Button title="Envoyer le dossier" onPress={submit} loading={busy} full />
        </View>
      ) : (
        <Card>
          <Txt variant="bodyStrong">{verif?.shopName}</Txt>
          <Txt variant="caption" style={{ marginTop: 4 }}>
            {verif?.status === 'pending'
              ? 'Ton dossier est en cours d’examen. Tu peux échanger avec l’équipe ci-dessous.'
              : 'Ta boutique est validée.'}
          </Txt>
        </Card>
      )}

      {verif && verif.status !== 'none' ? (
        <View style={{ marginTop: 20, gap: 8 }}>
          <Txt variant="h3">Échanges avec l’équipe</Txt>
          {verif.messages.map((m, i) => (
            <Card key={i}>
              <Txt variant="label">{m.fromAdmin ? 'Équipe' : 'Toi'}</Txt>
              <Txt variant="body">{m.body}</Txt>
              <Txt variant="small">{formatRelative(m.createdAt)}</Txt>
            </Card>
          ))}
          <Input value={message} onChangeText={setMessage} placeholder="Message…" />
          <Button title="Envoyer" size="sm" onPress={sendMsg} disabled={!message.trim()} />
        </View>
      ) : null}
    </Screen>
  );
}
