import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ZoneSelect } from '@/components/select-field';
import {
  Button,
  Card,
  EmptyState,
  Input,
  Screen,
  ScreenHeader,
  Sheet,
  StickyFooter,
  toast,
  Txt,
} from '@/components/ui';
import { useAuth, useMe, useTariffs, useZones } from '@/hooks/queries';
import { bundleDiscountGnf, lineTotalGnf, useCart } from '@/hooks/use-cart';
import { checkout, errorMessage, type PaymentMethod } from '@/lib/api';
import { PAYMENT_METHOD_LABELS } from '@/lib/domain';
import { formatGnf } from '@/lib/format';
import { isValidEmail, parseGnMobile, toE164 } from '@/lib/gn-phone';
import { cartShippingGnf } from '@/lib/shipping';
import { colors, radius } from '@/theme';

type FieldErrors = {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  zone?: string;
  mobile?: string;
  payment?: string;
};

const METHODS: { id: PaymentMethod; label: string; hint: string }[] = [
  { id: 'OM_GN', label: 'Orange Money', hint: 'Paiement sur ton 62…' },
  { id: 'MTN_GN', label: 'MTN MoMo', hint: 'Paiement sur ton 65…' },
  { id: 'CINETPAY', label: 'CinetPay', hint: 'Carte ou autre Mobile Money' },
];

function personName(value?: string | null) {
  const v = value?.trim() ?? '';
  if (!v || v.includes('@') || /^\+?\d[\d\s]{6,}$/.test(v)) return '';
  return v;
}

export default function CheckoutScreen() {
  const { isConsumer } = useAuth();
  const { data: me } = useMe();
  const cart = useCart();
  const tariffs = useTariffs();
  const [zoneId, setZoneId] = useState(me?.shippingZoneId ?? '');
  const [name, setName] = useState(personName(me?.displayName));
  const [phone, setPhone] = useState(me?.phone ?? '');
  const [email, setEmail] = useState(me?.email ?? '');
  const [address, setAddress] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('OM_GN');
  const [mobile, setMobile] = useState('');
  const [offer, setOffer] = useState('');
  const [loading, setLoading] = useState(false);
  const [recap, setRecap] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const zones = useZones();
  const zoneName = zones.data?.find((z) => z.id === zoneId)?.nameFr ?? '';

  const clearError = (key: keyof FieldErrors) => {
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const shipping = useMemo(
    () => cartShippingGnf(tariffs.data ?? [], zoneId, cart.lines.map((l) => l.zoneId)),
    [tariffs.data, zoneId, cart.lines]
  );
  const sellerCount = new Set(cart.lines.map((l) => l.sellerId ?? l.key)).size;
  const acceptedOffers = cart.lines.filter((l) => l.offerPriceGnf !== null);
  const canOffer = cart.lines.some((l) => l.negotiable) && sellerCount === 1 && !acceptedOffers.length;
  const offerAmount = Number(offer.replace(/\s/g, ''));
  const withOffer = canOffer && offerAmount > 0 && offerAmount < cart.subtotal;
  const bundleDiscount = withOffer ? 0 : bundleDiscountGnf(cart.lines);
  const goods = withOffer ? offerAmount : cart.subtotal - bundleDiscount;
  const total = goods + shipping;
  const onVacation = cart.lines.find((l) => l.sellerOnVacation);

  const pay = async () => {
    if (!isConsumer) {
      router.push('/connexion');
      return;
    }
    if (onVacation) {
      toast.error(`${onVacation.sellerName || 'Ce vendeur'} est en vacances : retire ses articles du panier pour continuer.`);
      return;
    }
    const next: FieldErrors = {};
    if (!name.trim()) next.name = 'Indique le nom complet du destinataire.';
    if (!address.trim()) next.address = 'Indique l’adresse de livraison (quartier, repère).';
    if (!zoneId) next.zone = 'Choisis la zone de livraison. La ville en dépend.';
    const e164 = toE164(phone);
    if (!phone.trim()) next.phone = 'Indique un numéro de téléphone.';
    else if (!e164) next.phone = 'Ce numéro n’est pas valide. Utilise un numéro guinéen, par exemple 622 00 00 00.';
    if (email.trim() && !isValidEmail(email)) next.email = 'Cet e-mail n’est pas valide. Exemple : nom@mail.com.';
    const payPhone = method === 'CINETPAY' ? e164 : parseGnMobile(mobile || phone)?.e164;
    if (method !== 'CINETPAY' && !payPhone) {
      next.mobile = `Le numéro ${PAYMENT_METHOD_LABELS[method]} doit commencer par ${method === 'OM_GN' ? '62' : '65'}.`;
    }
    const messages = Object.values(next).filter(Boolean) as string[];
    if (messages.length) {
      setErrors(next);
      toast.error(messages[0]);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const res = await checkout({
        paymentMethod: method,
        address: address.trim(),
        city: zoneName || undefined,
        phone: e164!,
        name: name.trim(),
        email: email.trim() || `${e164!.replace('+', '')}@fripcash.gn`,
        mobileNumber: payPhone ?? undefined,
        fulfillmentMode: 'courier',
        shippingCostGnf: shipping,
        toZoneId: zoneId,
        offerAmountGnf: withOffer ? offerAmount : undefined,
      });
      if (res.payment.mustRedirect && res.payment.paymentUrl) {
        await WebBrowser.openBrowserAsync(res.payment.paymentUrl);
      }
      router.replace({ pathname: '/paiement/[ref]', params: { ref: res.payment.merchantTransactionId } });
    } catch (e) {
      const message = errorMessage(e);
      toast.error(message);
      const lower = message.toLowerCase();
      const api: FieldErrors = {};
      if (lower.includes('zone')) api.zone = message;
      else if (lower.includes('téléphone') || lower.includes('telephone') || lower.includes('phone')) api.phone = message;
      else if (lower.includes('mail')) api.email = message;
      else if (lower.includes('adresse') || lower.includes('address')) api.address = message;
      else if (lower.includes('orange') || lower.includes('mtn') || lower.includes('mobile') || lower.includes('paiement') || lower.includes('payment')) api.payment = message;
      else api.payment = message;
      setErrors((prev) => ({ ...prev, ...api }));
    } finally {
      setLoading(false);
    }
  };

  if (!cart.lines.length) {
    return (
      <Screen>
        <ScreenHeader title="Commande" />
        <EmptyState icon="bag-outline" title="Panier vide" actionLabel="Retour" onAction={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen
      keyboard
      skeleton="form"
      footer={
        <StickyFooter>
          <View style={styles.payBar}>
            <Pressable
              style={styles.payTotal}
              onPress={() => setRecap(true)}
              accessibilityRole="button"
              accessibilityLabel="Ouvrir le récapitulatif de la commande">
              <Txt variant="caption" color={colors.textMuted}>
                Total
              </Txt>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Txt variant="h2" weight="bold">
                  {formatGnf(total)}
                </Txt>
                <Ionicons name="chevron-up" size={18} color={colors.textMuted} />
              </View>
            </Pressable>
            <Button title="Payer" size="lg" onPress={pay} loading={loading} />
          </View>
        </StickyFooter>
      }>
      <ScreenHeader title="Commande" subtitle={`${cart.count} article${cart.count > 1 ? 's' : ''}`} />
      {onVacation ? (
        <Card style={{ marginBottom: 14, backgroundColor: colors.primarySoft }}>
          <Txt variant="bodyStrong">Vendeur en vacances</Txt>
          <Txt variant="caption">
            {onVacation.sellerName || 'Un vendeur'} ne prend pas de commande en ce moment. Retire ses articles du panier pour payer le reste.
          </Txt>
        </Card>
      ) : null}
      {acceptedOffers.length ? (
        <Card style={{ marginBottom: 14, backgroundColor: colors.secondary }}>
          <Txt variant="bodyStrong">
            {acceptedOffers.length > 1 ? 'Offres acceptées appliquées' : 'Offre acceptée appliquée'}
          </Txt>
          {acceptedOffers.map((l) => (
            <Txt key={l.key} variant="caption">
              {l.title} : {formatGnf(l.offerPriceGnf)} au lieu de {formatGnf(l.priceGnf)}
            </Txt>
          ))}
        </Card>
      ) : null}
      {bundleDiscount > 0 ? (
        <Card style={{ marginBottom: 14, backgroundColor: colors.secondary }}>
          <Txt variant="bodyStrong">Remise lot appliquée : − {formatGnf(bundleDiscount)}</Txt>
          <Txt variant="caption">Le vendeur offre une remise quand tu prends plusieurs de ses articles.</Txt>
        </Card>
      ) : null}

      <View style={{ gap: 12, marginBottom: 18 }}>
        <Txt variant="h3">Livraison</Txt>
        <Input label="Nom" value={name} onChangeText={(v) => { setName(v); clearError('name'); }} error={errors.name} />
        <Input label="Téléphone" value={phone} onChangeText={(v) => { setPhone(v); clearError('phone'); }} keyboardType="phone-pad" prefix="+224" error={errors.phone} />
        <Input label="E-mail" value={email} onChangeText={(v) => { setEmail(v); clearError('email'); }} keyboardType="email-address" autoCapitalize="none" error={errors.email} />
        <Input label="Adresse" value={address} onChangeText={(v) => { setAddress(v); clearError('address'); }} placeholder="Quartier, repère…" error={errors.address} />
        <ZoneSelect
          label="Zone de livraison"
          value={zoneId}
          error={errors.zone}
          onChange={(id) => {
            setZoneId(id);
            clearError('zone');
          }}
        />
        {canOffer ? (
          <Input
            label="Offre globale (optionnel)"
            value={offer}
            onChangeText={setOffer}
            keyboardType="numeric"
            hint={
              offerAmount >= cart.subtotal
                ? `L’offre doit être inférieure à ${formatGnf(cart.subtotal)}.`
                : 'Si le vendeur accepte, ce montant remplace le sous-total.'
            }
          />
        ) : null}
      </View>

      <Txt variant="h3" style={{ marginBottom: 10 }}>
        Paiement
      </Txt>
      {errors.payment ? (
        <Txt variant="caption" color={colors.error} style={{ marginBottom: 8 }}>
          {errors.payment}
        </Txt>
      ) : null}
      <View style={[styles.methods, !!errors.payment && styles.methodsError]}>
        {METHODS.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => {
              setMethod(m.id);
              clearError('payment');
              clearError('mobile');
            }}
            style={[styles.method, method === m.id && styles.methodOn, !!errors.payment && styles.methodError]}>
            <View style={{ flex: 1 }}>
              <Txt variant="bodyStrong">{m.label}</Txt>
              <Txt variant="caption">{m.hint}</Txt>
            </View>
          </Pressable>
        ))}
      </View>
      {method !== 'CINETPAY' ? (
        <Input
          label={`Numéro ${PAYMENT_METHOD_LABELS[method]}`}
          value={mobile}
          onChangeText={(v) => {
            setMobile(v);
            clearError('mobile');
            clearError('payment');
          }}
          keyboardType="phone-pad"
          placeholder={method === 'MTN_GN' ? '65X XX XX XX' : '62X XX XX XX'}
          error={errors.mobile}
        />
      ) : null}

      <Card style={{ marginTop: 16, backgroundColor: colors.secondary }}>
        <Txt variant="bodyStrong">Paiement sécurisé (séquestre)</Txt>
        <Txt variant="caption">
          Ton paiement est bloqué jusqu’à ce que tu confirmes la réception. Le vendeur n’est payé qu’après.
        </Txt>
      </Card>

      <Sheet visible={recap} onClose={() => setRecap(false)} title="Ta commande">
        <View style={{ gap: 14, paddingBottom: 8 }}>
          {cart.lines.map((l) => (
            <View key={l.key} style={styles.item}>
              {l.imageUrl ? (
                <Image source={{ uri: l.imageUrl }} style={styles.thumb} contentFit="cover" />
              ) : (
                <View style={[styles.thumb, styles.thumbEmpty]}>
                  <Ionicons name="image-outline" size={22} color={colors.textSubtle} />
                </View>
              )}
              <View style={{ flex: 1, gap: 6 }}>
                <Txt variant="bodyStrong" numberOfLines={2}>
                  {l.title}
                </Txt>
                <Txt variant="caption" numberOfLines={1}>
                  {l.sellerName || 'Vendeur'}
                </Txt>
                <View style={styles.qtyRow}>
                  <Pressable
                    onPress={() => cart.setQuantity(l, l.quantity - 1)}
                    disabled={l.quantity <= 1}
                    hitSlop={8}
                    accessibilityLabel="Diminuer la quantité"
                    style={[styles.qtyBtn, l.quantity <= 1 && { opacity: 0.35 }]}>
                    <Ionicons name="remove" size={16} color={colors.text} />
                  </Pressable>
                  <Txt variant="bodyStrong">{l.quantity}</Txt>
                  <Pressable
                    onPress={() => cart.setQuantity(l, l.quantity + 1)}
                    disabled={l.quantity >= l.maxQuantity}
                    hitSlop={8}
                    accessibilityLabel="Augmenter la quantité"
                    style={[styles.qtyBtn, l.quantity >= l.maxQuantity && { opacity: 0.35 }]}>
                    <Ionicons name="add" size={16} color={colors.text} />
                  </Pressable>
                  <Txt variant="bodyStrong" style={{ marginLeft: 'auto' }}>
                    {formatGnf(lineTotalGnf(l))}
                  </Txt>
                </View>
              </View>
            </View>
          ))}
          {bundleDiscount > 0 ? (
            <View style={styles.line}>
              <Txt variant="caption">Remise lot</Txt>
              <Txt variant="bodyStrong" color={colors.success}>
                − {formatGnf(bundleDiscount)}
              </Txt>
            </View>
          ) : null}
          <View style={styles.line}>
            <Txt variant="caption">Livraison{zoneName ? ` · ${zoneName}` : ''}</Txt>
            <Txt variant="bodyStrong">{zoneId ? formatGnf(shipping) : '—'}</Txt>
          </View>
          <View style={styles.line}>
            <Txt variant="bodyStrong">Total</Txt>
            <Txt variant="h3" weight="bold">
              {formatGnf(total)}
            </Txt>
          </View>
          <Button title="Payer" size="lg" onPress={pay} loading={loading} full />
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  payBar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  payTotal: { flex: 1, gap: 2, paddingVertical: 4 },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  item: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  thumb: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  methods: { gap: 8, marginBottom: 12 },
  methodsError: { marginBottom: 8 },
  method: {
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.borderSoft,
    backgroundColor: colors.white,
  },
  methodOn: { borderColor: colors.primary, backgroundColor: colors.secondary },
  methodError: { borderColor: colors.error },
});
