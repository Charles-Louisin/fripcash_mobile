import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Switch, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { ZoneSelect } from '@/components/select-field';
import { Badge, Button, Card, Input, Screen, ScreenHeader, Segmented, toast, Txt } from '@/components/ui';
import { useAccountType } from '@/hooks/use-account-type';
import { qk, useMe } from '@/hooks/queries';
import { verificationLabel } from '@/lib/account-type';
import {
  becomeParticulier,
  errorMessage,
  fetchNotificationPreferences,
  setVacation,
  updateBundleSettings,
  updateMe,
  updateNotificationPreference,
  type Me,
  type NotificationPreference,
} from '@/lib/api';
import { colors } from '@/theme';

const TABS = [
  { value: 'account' as const, label: 'Compte' },
  { value: 'seller' as const, label: 'Vendre' },
  { value: 'notifications' as const, label: 'Notifications' },
];

const NOTIF_TYPES = [
  { type: 'MESSAGE', label: 'Nouveaux messages', desc: 'Recevoir une notification pour chaque nouveau message' },
  { type: 'ORDER', label: 'Mises à jour de commande', desc: 'Suivi de tes achats et ventes' },
  { type: 'OFFER', label: 'Offres', desc: 'Négociations et propositions de prix' },
  { type: 'PROMOTION', label: 'Promotions', desc: 'Offres spéciales et réductions' },
];

function prefOn(prefs: NotificationPreference[], type: string, key: 'push' | 'inApp') {
  const row = prefs.find((item) => item.type.toUpperCase() === type);
  if (!row) return true;
  return row[key] !== false;
}

export default function ParametresScreen() {
  const client = useQueryClient();
  const { data: me } = useMe();
  const { type } = useAccountType();
  const [tab, setTab] = useState<(typeof TABS)[number]['value']>('account');
  const [name, setName] = useState(me?.displayName ?? '');
  const [saving, setSaving] = useState(false);
  const [zoneId, setZoneId] = useState<string | null>(me?.shippingZoneId ?? null);
  const [upgrading, setUpgrading] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreference[]>([]);

  useEffect(() => {
    if (me?.displayName) setName(me.displayName);
    if (me?.shippingZoneId) setZoneId(me.shippingZoneId);
  }, [me?.displayName, me?.shippingZoneId]);

  useEffect(() => {
    fetchNotificationPreferences()
      .then(setPrefs)
      .catch(() => {});
  }, []);

  const saveAccount = async () => {
    const next = name.trim();
    if (!next) {
      toast.error("Le nom d'affichage est requis");
      return;
    }
    setSaving(true);
    try {
      await updateMe({ name: next });
      await client.invalidateQueries({ queryKey: qk.me });
      toast.success('Profil mis à jour');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (typeName: string, key: 'push' | 'inApp') => {
    const current = prefs.find((item) => item.type.toUpperCase() === typeName);
    const next: NotificationPreference = {
      type: current?.type || typeName,
      push: current?.push !== false,
      inApp: current?.inApp !== false,
      email: current?.email,
      [key]: !prefOn(prefs, typeName, key),
    };
    try {
      const all = await updateNotificationPreference(next);
      setPrefs(Array.isArray(all) ? all : prefs.map((item) => (item.type.toUpperCase() === typeName ? next : item)));
      toast.success('Préférence enregistrée');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const activate = async () => {
    if (!zoneId) {
      toast.error('Choisis ta zone d’expédition pour vendre.');
      return;
    }
    setUpgrading(true);
    try {
      await becomeParticulier({ displayName: name.trim() || undefined, shippingZoneId: zoneId });
      await client.invalidateQueries({ queryKey: qk.me });
      toast.success('Profil particulier activé. Tes achats restent sur ce compte.');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setUpgrading(false);
    }
  };

  const sellerLabel = type.isShop ? 'Boutique' : 'Vendre';

  return (
    <Screen>
      <ScreenHeader title="Paramètres" subtitle="Données du compte — pas de changement de rôle libre" />
      <View style={{ marginBottom: 16 }}>
        <Segmented
          value={tab}
          onChange={setTab}
          options={TABS.map((item) => ({ value: item.value, label: item.value === 'seller' ? sellerLabel : item.label }))}
        />
      </View>

      {tab === 'account' ? (
        <View style={{ gap: 12 }}>
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Txt variant="h3">Compte</Txt>
              <Badge label={type.label} />
            </View>
            <Txt variant="caption" style={{ marginBottom: 12 }}>
              {type.description}
            </Txt>
            <Input label="Nom d'affichage" value={name} onChangeText={setName} />
            <View style={{ height: 12 }} />
            <Input label="Téléphone" value={me?.phone || ''} editable={false} hint="Le numéro est géré via la connexion — non modifiable ici." />
            <View style={{ height: 12 }} />
            <Button title={saving ? 'Enregistrement…' : 'Enregistrer'} onPress={saveAccount} loading={saving} />
          </Card>
          <Card>
            <Txt variant="h3">Mot de passe</Txt>
            <Txt variant="caption" style={{ marginTop: 6 }}>
              Compte téléphone — pas de mot de passe sur cet écran. Les comptes email se gèrent via le flux de connexion.
            </Txt>
          </Card>
          <Card>
            <Txt variant="h3" color={colors.error}>
              Zone dangereuse
            </Txt>
            <Txt variant="caption" style={{ marginTop: 6 }}>
              La suppression de compte n’est pas encore disponible dans l’application. Contacte le support pour une demande.
            </Txt>
          </Card>
        </View>
      ) : null}

      {tab === 'seller' ? (
        <View style={{ gap: 12 }}>
          {type.requiresAdminApproval ? (
            <Card>
              <Txt variant="bodyStrong">Validation</Txt>
              <Txt variant="caption" style={{ marginTop: 4 }}>
                {verificationLabel(type.verificationStatus)}
              </Txt>
            </Card>
          ) : null}
          <Card>
            <Txt variant="h3">{type.isShop ? 'Ta boutique' : 'Profil vendeur'}</Txt>
            <Txt variant="body" color={colors.textMuted} style={{ marginTop: 8 }}>
              {type.id === 'boutique'
                ? 'Boutique d’articles neufs. Aucune validation n’est demandée pour publier.'
                : type.isShop
                  ? 'Certaines actions restent fermées tant que l’équipe n’a pas validé le dossier.'
                  : type.isSeller
                    ? 'Tu vends déjà en particulier. Tes achats restent sur le même compte.'
                    : 'Un seul compte. Tu peux activer un profil particulier pour vendre en seconde main.'}
            </Txt>
            <View style={{ marginTop: 12, gap: 8 }}>
              <Line label="Type" value={type.label} />
              <Line label="Validation" value={type.requiresAdminApproval ? verificationLabel(type.verificationStatus) : 'Non requise'} />
              {type.destination ? <Line label="Univers" value={type.destination} /> : null}
              <Line label="Zone d’expédition" value={me?.shippingZoneId ? 'Définie dans le profil' : 'À définir dans le profil'} />
            </View>
            <Button title="Ouvrir le profil" variant="secondary" onPress={() => router.push('/profil')} style={{ marginTop: 12 }} />
          </Card>

          {type.id === 'acheteur' ? (
            <Card>
              <Txt variant="h3">Devenir vendeur particulier</Txt>
              <Txt variant="body" color={colors.textMuted} style={{ marginTop: 8 }}>
                Publie en seconde main. Même compte, historique d’achats conservé. Boutique, commerce ou enseigne se choisissent dans Évoluer.
              </Txt>
              <View style={{ marginTop: 12 }}>
                <ZoneSelect label="Zone d’expédition" value={zoneId} onChange={setZoneId} />
              </View>
              <Button title="Activer le profil particulier" onPress={activate} loading={upgrading} style={{ marginTop: 12 }} />
            </Card>
          ) : null}

          {type.id === 'particulier' ? (
            <Card>
              <Txt variant="h3">Créer une boutique</Txt>
              <Txt variant="caption" style={{ marginTop: 6 }}>
                Boutique d’articles neufs sans validation, ou commerce local et enseigne avec un dossier KYC.
              </Txt>
              <Button title="Évoluer" onPress={() => router.push('/evoluer')} style={{ marginTop: 12 }} />
            </Card>
          ) : null}

          {type.isShop ? <ShopSettings /> : null}
        </View>
      ) : null}

      {tab === 'notifications' ? (
        <Card>
          <Txt variant="h3" style={{ marginBottom: 8 }}>
            Préférences de notifications
          </Txt>
          {NOTIF_TYPES.map((item) => (
            <View key={item.type} style={{ paddingVertical: 10, gap: 8 }}>
              <Txt variant="bodyStrong">{item.label}</Txt>
              <Txt variant="caption">{item.desc}</Txt>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Txt variant="caption">Push</Txt>
                <Switch value={prefOn(prefs, item.type, 'push')} onValueChange={() => toggle(item.type, 'push')} trackColor={{ true: colors.primary }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Txt variant="caption">Dans l’app</Txt>
                <Switch value={prefOn(prefs, item.type, 'inApp')} onValueChange={() => toggle(item.type, 'inApp')} trackColor={{ true: colors.primary }} />
              </View>
            </View>
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}

function ShopSettings() {
  const { data: me } = useMe();
  if (!me?.seller) return null;
  return <ShopSettingsForm seller={me.seller} />;
}

function ShopSettingsForm({ seller }: { seller: NonNullable<Me['seller']> }) {
  const client = useQueryClient();
  const [vacation, setVac] = useState(!!seller.vacationEnabled);
  const [bundle, setBundle] = useState(!!seller.bundleEnabled);
  const [minItems, setMinItems] = useState(String(seller.bundleMinItems || 2));
  const [discount, setDiscount] = useState(String(seller.bundleDiscountPercent || 10));
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const min = Number(minItems);
    const pct = Number(discount);
    if (bundle && (!Number.isInteger(min) || min < 2 || !(pct > 0 && pct <= 90))) {
      toast.error('Lots : au moins 2 articles et une remise entre 1 et 90 %.');
      return;
    }
    setBusy(true);
    try {
      await setVacation({ enabled: vacation });
      await updateBundleSettings({
        bundleEnabled: bundle,
        bundleMinItems: min || 2,
        bundleDiscountPercent: pct || 10,
      });
      await client.invalidateQueries({ queryKey: qk.me });
      toast.success('Réglages enregistrés');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Txt variant="bodyStrong">Mode vacances</Txt>
            <Txt variant="caption">Tes articles restent visibles mais non commandables.</Txt>
          </View>
          <Switch value={vacation} onValueChange={setVac} trackColor={{ true: colors.primary }} />
        </View>
      </Card>
      <Card style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Txt variant="bodyStrong">Lots / packs</Txt>
          <Switch value={bundle} onValueChange={setBundle} trackColor={{ true: colors.primary }} />
        </View>
        {bundle ? (
          <>
            <Input label="Minimum d’articles" value={minItems} onChangeText={setMinItems} keyboardType="numeric" />
            <Input label="Remise (%)" value={discount} onChangeText={setDiscount} keyboardType="numeric" />
          </>
        ) : null}
        <Button title="Enregistrer les réglages" onPress={save} loading={busy} />
      </Card>
    </View>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <Txt variant="caption">{label}</Txt>
      <Txt variant="bodyStrong" style={{ flexShrink: 1, textAlign: 'right' }}>
        {value}
      </Txt>
    </View>
  );
}
