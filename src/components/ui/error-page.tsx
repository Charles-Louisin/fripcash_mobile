import { router, type ErrorBoundaryProps } from 'expo-router';

import { StatusPage } from './status-page';

const FUNNY_TEXTS = [
  'Oups ! Un bouton a sauté pendant l’essayage.',
  'Cette page s’est prise les pieds dans le tapis.',
  'Petit accroc dans la couture, on recoud ça.',
  'Même les meilleures fripes ont un défaut caché.',
  'FripCash a trébuché, mais se relève vite.',
];

/** Écran d’erreur global, même style que la page 404. */
export function ErrorPage({ error, retry }: ErrorBoundaryProps) {
  return (
    <StatusPage
      label="Erreur"
      texts={FUNNY_TEXTS}
      description="Quelque chose s’est mal passé en affichant cette page."
      note="(Réessaie : la plupart du temps, ça repart tout seul.)"
      details={__DEV__ ? error?.message : undefined}
      primary={{ label: 'Réessayer', onPress: () => retry() }}
      secondary={{
        label: 'Accueil',
        icon: false,
        onPress: () => {
          router.replace('/');
          retry();
        },
      }}
    />
  );
}
