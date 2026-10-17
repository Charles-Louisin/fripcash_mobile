import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  EMPTY_SHOP_DRAFT,
  ShopApplicationFields,
  shopDraftToApplication,
  validateShopDraft,
  type ShopDraft,
} from '@/components/seller/shop-application-fields';
import { ZoneSelect } from '@/components/select-field';
import { ShopDossierCard } from '@/components/dashboard/shop-dossier-card';
import { Badge, Button, Card, Screen, ScreenHeader, toast, Txt } from '@/components/ui';
import { useAccountType } from '@/hooks/use-account-type';
import { qk, useAuth } from '@/hooks/queries';
import { verificationLabel } from '@/lib/account-type';
import { applyForShop, becomeParticulier, errorMessage, fetchSellerVerification, type SignupRole } from '@/lib/api';
import { colors } from '@/theme';

type ShopTarget = 'boutique' | 'commerceLocal' | 'grandeSurface';

const NEXT: Record<string, ShopTarget[]> = {
  particulier: ['boutique', 'commerceLocal', 'grandeSurface'],
  boutique: ['commerceLocal', 'grandeSurface'],
  commerceLocal: ['grandeSurface'],
  grandeSurface: [],
  acheteur: [],
};

const OPTIONS: { id: ShopTarget; title: string; text: string }[] = [
  { id: 'boutique', title: 'Boutique', text: 'Articles neufs, livrés dans toute la ville.' },
  { id: 'commerceLocal', title: 'Commerce local', text: 'Boutique de quartier. Le rôle s’ouvre après validation du KYC.' },
  { id: 'grandeSurface', title: 'Enseigne', text: 'Grande surface. Le rôle s’ouvre après validation du KYC.' },
];

export default function EvoluerScreen() {
  const { isConsumer } = useAuth();
  const { me, type } = useAccountType();
  const client = useQueryClient();
  const dossier = useQuery({
    queryKey: ['seller', 'verification'],
    queryFn: fetchSellerVerification,
    enabled: !!me && type.isSeller,
  });
  const [target, setTarget] = useState<ShopTarget | 'particulier' | null>(null);
  const [draft, setDraft] = useState<ShopDraft>({ ...EMPTY_SHOP_DRAFT, shippingZoneId: me?.shippingZoneId ?? '' });
  const [zoneId, setZoneId] = useState<string | null>(me?.shippingZoneId ?? null);
  const [busy, setBusy] = useState(false);
  const pending = dossier.data?.status === 'pending';
  const choices = NEXT[type.id] ?? [];

  if (!isConsumer) {
    router.replace('/');
    return null;
  }

  const submitShop = async () => {
    if (!target || target === 'particulier') return;
    const error = validateShopDraft(target, draft);
    if (error) {
      toast.error(error);
      return;
    }
    setBusy(true);
    try {
      await applyForShop(shopDraftToApplication(target, draft));
      await client.invalidateQueries({ queryKey: qk.me });
      await client.invalidateQueries({ queryKey: ['seller', 'verification'] });
      toast.success('Dossier envoyé. Dès qu’il est accepté, ce rôle s’ouvre et le tableau de bord suit.');
      setTarget(null);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const submitParticulier = async () => {
    if (!zoneId) {
      toast.error('Choisis ta zone d’expédition.');
      return;
    }
    setBusy(true);
    try {
      await becomeParticulier({ displayName: me?.displayName || undefined, shippingZoneId: zoneId });
      await client.invalidateQueries({ queryKey: qk.me });
      toast.success('Profil particulier activé. Tu peux maintenant évoluer vers une boutique.');
      setTarget(null);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen keyboard>
      <ScreenHeader title="Évoluer" />
      <Card style={{ marginBottom: 14, gap: 6 }}>
        <Txt variant="label" color={colors.primary}>
          Profil actuel
        </Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Txt variant="h2" style={{ flex: 1 }}>
            {type.label}
          </Txt>
          <Badge label={type.label} />
        </View>
        <Txt variant="body" color={colors.textMuted}>
          {type.description}
        </Txt>
        {type.destination ? <Txt variant="bodyStrong">Univers : {type.destination}</Txt> : null}
        {type.requiresAdminApproval ? <Txt variant="caption">{verificationLabel(type.verificationStatus)}</Txt> : null}
      </Card>

      <ShopDossierCard />

      <Txt variant="h3" style={{ marginBottom: 8 }}>
        Évolutions possibles
      </Txt>

      {type.id === 'acheteur' ? (
        <Pressable onPress={() => setTarget('particulier')} style={{ marginBottom: 10 }}>
          <Card style={{ borderWidth: target === 'particulier' ? 1.5 : 0, borderColor: colors.primary }}>
            <Txt variant="bodyStrong">Vendeur particulier</Txt>
            <Txt variant="caption" style={{ marginTop: 4 }}>
              Seconde main, sans dossier admin. Les boutiques, commerces et enseignes viennent ensuite.
            </Txt>
          </Card>
        </Pressable>
      ) : null}

      {choices.map((id) => {
        const option = OPTIONS.find((item) => item.id === id)!;
        return (
          <Pressable key={id} disabled={pending} onPress={() => setTarget(id)} style={{ marginBottom: 10 }}>
            <Card style={{ borderWidth: target === id ? 1.5 : 0, borderColor: colors.primary, opacity: pending ? 0.55 : 1 }}>
              <Txt variant="bodyStrong">{option.title}</Txt>
              <Txt variant="caption" style={{ marginTop: 4 }}>
                {option.text}
              </Txt>
            </Card>
          </Pressable>
        );
      })}

      {!choices.length && type.id !== 'acheteur' ? (
        <Card style={{ marginBottom: 14 }}>
          <Txt variant="body">Tu es déjà au niveau enseigne. Il n’y a pas de rôle au-dessus.</Txt>
        </Card>
      ) : null}

      {pending ? (
        <Txt variant="caption" style={{ marginBottom: 12 }}>
          Un dossier est déjà en validation. Le nouveau rôle et ses options de tableau de bord s’ouvrent quand l’équipe l’accepte.
        </Txt>
      ) : null}

      {target === 'particulier' && !pending ? (
        <Card style={{ gap: 12 }}>
          <ZoneSelect label="Zone d’expédition" value={zoneId} onChange={setZoneId} />
          <Button title="Activer le profil particulier" onPress={submitParticulier} loading={busy} full />
        </Card>
      ) : null}

      {target && target !== 'particulier' && !pending ? (
        <Card style={{ gap: 12 }}>
          <ShopApplicationFields role={target as SignupRole} value={draft} onChange={setDraft} />
          <Button title={busy ? 'Envoi…' : 'Envoyer le dossier KYC'} onPress={submitShop} loading={busy} full />
        </Card>
      ) : null}
    </Screen>
  );
}
