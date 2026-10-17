import type { ImageSource } from 'expo-image';

/** Visuels d’habillage (univers et bandeau promo). Les photos d’articles et de boutiques viennent de l’API. */
export const photos = {
  secondeMain: require('@/assets/universes/seconde-main.jpg') as ImageSource,
  articlesNeufs: require('@/assets/universes/articles-neufs.jpg') as ImageSource,
  quartier: require('@/assets/universes/quartier.jpg') as ImageSource,
  enseignes: require('@/assets/universes/enseignes.jpg') as ImageSource,
};
