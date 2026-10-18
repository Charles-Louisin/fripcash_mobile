import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, EmptyState, Screen, ScreenHeader, Sheet, Stepper, toast, Txt } from '@/components/ui';
import { useAuth, useMe, useTariffs } from '@/hooks/queries';
import { bundleDiscountGnf, lineTotalGnf, useCart, type CartLine } from '@/hooks/use-cart';
import { errorMessage } from '@/lib/api';
import { formatGnf } from '@/lib/format';
import { cartShippingGnf } from '@/lib/shipping';
import { colors, fonts, radius } from '@/theme';

function CartLines({ onCheckout }: { onCheckout?: () => void }) {
  const { isConsumer } = useAuth();
  const cart = useCart();
  const me = useMe();
  const tariffs = useTariffs();
  const zoneId = me.data?.shippingZoneId ?? '';
  const shipping = cartShippingGnf(
    tariffs.data ?? [],
    zoneId,
    cart.lines.map((line) => line.zoneId),
  );
  const bundle = bundleDiscountGnf(cart.lines);
  const goods = cart.subtotal - bundle;
  const total = goods + shipping;

  const soldOutLines = cart.lines.filter((line) => line.soldOut);
  const overStock = cart.lines.find((line) => !line.soldOut && line.quantity > line.maxQuantity);

  const checkout = () => {
    if (!cart.lines.length) return;
    if (soldOutLines.length) {
      toast.error(`Stock épuisé : retire « ${soldOutLines[0].title} » du panier pour continuer.`);
      return;
    }
    if (overStock) {
      toast.error(`Il ne reste que ${overStock.maxQuantity} « ${overStock.title} » en stock.`);
      return;
    }
    onCheckout?.();
    if (!isConsumer) {
      toast.info('Connecte-toi pour passer commande.');
      router.push('/connexion');
      return;
    }
    router.push('/checkout');
  };

  if (!cart.lines.length) {
    return (
      <EmptyState
        icon="bag-outline"
        title="Ton panier est vide"
        message="Ajoute des articles depuis les univers FripCash."
        actionLabel="Explorer"
        onAction={() => router.push('/explorer')}
      />
    );
  }

  return (
    <View style={{ gap: 16 }}>
      {cart.lines.map((line) => (
        <CartLineCard key={line.key} line={line} />
      ))}
      <View style={styles.totals}>
        <TotalRow label="Sous-total" value={formatGnf(cart.subtotal)} />
        {bundle > 0 ? <TotalRow label="Remise lot" value={`− ${formatGnf(bundle)}`} /> : null}
        <TotalRow label="Frais de livraison (estimés)" value={zoneId ? formatGnf(shipping) : '—'} />
        <TotalRow label="Total" value={formatGnf(zoneId ? total : goods)} strong />
      </View>
      <Button
        title="Passer la commande"
        iconRight="chevron-forward"
        onPress={checkout}
        variant={soldOutLines.length || overStock ? 'muted' : 'primary'}
        full
      />
    </View>
  );
}

function CartLineCard({ line }: { line: CartLine }) {
  const cart = useCart();
  const note = line.conditionNote?.trim();
  const lowStock = !line.soldOut && line.maxQuantity > 0 && line.maxQuantity <= 3;
  return (
    <View style={[styles.line, line.soldOut && styles.lineSoldOut]}>
      <Pressable onPress={() => router.push({ pathname: '/article/[id]', params: { id: line.listingId } })}>
        {line.imageUrl ? (
          <Image source={{ uri: line.imageUrl }} style={styles.thumb} contentFit="cover" />
        ) : (
          <View style={[styles.thumb, { backgroundColor: colors.surfaceMuted }]} />
        )}
      </Pressable>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={styles.lineTop}>
          <Txt style={styles.lineTitle} numberOfLines={1}>
            {line.title}
          </Txt>
          <Pressable
            onPress={() => cart.remove(line).catch((e) => toast.error(errorMessage(e)))}
            hitSlop={8}
            accessibilityLabel="Retirer">
            <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
          </Pressable>
        </View>
        {note ? (
          <Txt variant="caption" numberOfLines={1}>
            {note}
          </Txt>
        ) : null}
        {line.soldOut ? (
          <Txt style={styles.stockOut}>Stock épuisé : retire cet article</Txt>
        ) : lowStock ? (
          <Txt style={styles.stockLow}>
            Plus que {line.maxQuantity} en stock
          </Txt>
        ) : null}
        <View style={styles.lineBottom}>
          {line.soldOut ? (
            <View />
          ) : (
            <Stepper
              value={line.quantity}
              max={Math.max(1, line.maxQuantity)}
              onMax={() =>
                toast.info(
                  `Stock maximum atteint : ${line.maxQuantity} disponible${line.maxQuantity > 1 ? 's' : ''}.`,
                )
              }
              onChange={(n) => cart.setQuantity(line, n).catch((e) => toast.error(errorMessage(e)))}
            />
          )}
          <View style={{ alignItems: 'flex-end' }}>
            <Txt style={styles.linePrice}>{formatGnf(lineTotalGnf(line))}</Txt>
            <Txt variant="small" color={line.offerPriceGnf !== null ? colors.success : undefined}>
              {line.offerPriceGnf !== null ? 'Offre acceptée appliquée' : 'Frais de service inclus'}
            </Txt>
          </View>
        </View>
      </View>
    </View>
  );
}

function TotalRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.totalRow}>
      <Txt style={strong ? styles.totalStrong : styles.totalLabel}>{label}</Txt>
      <Txt style={[strong ? styles.totalStrong : styles.totalValue, strong && { color: colors.primary }]}>{value}</Txt>
    </View>
  );
}

export function CartSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { count } = useCart();
  return (
    <Sheet visible={visible} onClose={onClose} title={`Mon panier (${count})`} icon="bag-outline" showClose>
      <CartLines onCheckout={onClose} />
    </Sheet>
  );
}

export function CartScreen() {
  const { count } = useCart();
  return (
    <Screen background={colors.white}>
      <ScreenHeader title={`Mon panier${count ? ` (${count})` : ''}`} />
      <CartLines />
    </Screen>
  );
}

const styles = StyleSheet.create({
  line: {
    flexDirection: 'row',
    gap: 12,
    padding: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  lineSoldOut: { borderColor: colors.error, opacity: 0.85 },
  stockOut: { fontFamily: fonts.bold, fontSize: 12, color: colors.error },
  stockLow: { fontFamily: fonts.semibold, fontSize: 12, color: colors.warning },
  thumb: { width: 72, height: 84, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  lineTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  lineTitle: { flex: 1, fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  lineBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  linePrice: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  totals: { gap: 8, paddingTop: 4 },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.textMuted },
  totalValue: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  totalStrong: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
});
