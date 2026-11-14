import { Dimensions, type ScaledSize } from 'react-native';

/**
 * Plafond du grossissement de texte choisi dans les réglages du téléphone.
 * Sur Android, « Taille de police » + « Taille d'affichage » au maximum multiplient le texte
 * par ~1,6 : les écrans paraissent alors zoomés. Au-delà de 1,2, on garde la mise en page.
 */
export const MAX_FONT_MULTIPLIER = 1.2;

// Largeur suivie au niveau du module (rotation incluse) : aucun abonnement React par texte.
let width = Dimensions.get('window').width;
Dimensions.addEventListener('change', ({ window }: { window: ScaledSize }) => {
  width = window.width;
});

/**
 * Échelle du texte selon la largeur : la maquette est pensée pour ~390 pt.
 * Sur les écrans plus étroits (Android d'entrée de gamme, 360 pt), on réduit légèrement
 * pour garder de l'air autour du contenu.
 */
export function fontScaleForScreen() {
  if (width <= 340) return 0.9;
  if (width <= 370) return 0.94;
  if (width < 390) return 0.97;
  return 1;
}
