import { CartScreen } from '@/components/commerce/cart-screen';

/**
 * Panier des utilisateurs connectés : écran de pile classique. L'onglet « panier » masqué
 * (href: null) animé en fondu laissait sur Android un écran transparent bloquant l'accueil.
 */
export default function MonPanierScreen() {
  return <CartScreen />;
}
