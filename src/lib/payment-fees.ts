import type { PaymentConfig, PaymentMethod } from '@/lib/api';

/**
 * Frais Chap Chap Pay ajoutés au total, pour affichage avant paiement.
 * Même formule que le serveur (qui recalcule et fait foi) : la commission retenue
 * (taux × montant payé + fixe) est entièrement couverte, sans sur-facturation.
 */
export function paymentFeeGnf(amount: number, method: PaymentMethod, fees?: PaymentConfig['fees']) {
  if (!fees?.passedToBuyer || amount <= 0) return 0;
  const rate = method === 'OM_GN' || method === 'MTN_GN' ? fees.mobileMoneyRate : fees.otherRate;
  if (rate <= 0 && fees.fixedGnf <= 0) return 0;
  return Math.ceil((rate * amount + fees.fixedGnf) / (1 - rate));
}
