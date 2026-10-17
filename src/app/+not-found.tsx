import { router } from 'expo-router';

import { StatusPage } from '@/components/ui';
import { homeHref } from '@/lib/nav';

const FUNNY_TEXTS = [
  'Oups ! Cette page a été vendue avant ton arrivée.',
  '404 : Article introuvable dans le placard.',
  'On dirait que cette page est partie en fripe !',
  'Cette page a déjà trouvé preneur, désolé !',
  'Même FripCash ne retrouve pas cette page.',
];

export default function NotFoundScreen() {
  return (
    <StatusPage
      label="Erreur 404"
      texts={FUNNY_TEXTS}
      description="La page que tu cherches est introuvable ou a été déplacée."
      note="(On est presque sûrs que ce n'est pas de ta faute... probablement.)"
      primary={{ label: 'Accueil', onPress: () => router.replace(homeHref) }}
      secondary={{
        label: 'Retour',
        icon: false,
        onPress: () => (router.canGoBack() ? router.back() : router.replace(homeHref)),
      }}
    />
  );
}
