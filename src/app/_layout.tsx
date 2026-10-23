import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AppState, Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { NotificationsBootstrap, PushRegistrar } from '@/components/push-registrar';
import { toast, ToastHost } from '@/components/ui';
import { ApiError, setUnauthorizedHandler } from '@/lib/api';
import { goHomeAfterLogout, openDashboard } from '@/lib/nav';
import { needsAccountVerification, useSession } from '@/stores/session';
import { colors } from '@/theme';
import { fadeMotion, sheetMotion, stackMotion } from '@/theme/motion';

export { ErrorPage as ErrorBoundary } from '@/components/ui/error-page';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Filet de sécurité : dès que le JS tourne, on quitte le splash natif
// même si React / la session / le tunnel trainent.
setTimeout(() => {
  SplashScreen.hideAsync().catch(() => {});
}, 1500);

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 45_000,
        gcTime: 10 * 60_000,
        refetchOnWindowFocus: false,
        retry: (count, error) => {
          if (error instanceof ApiError && error.statusCode >= 400 && error.statusCode < 500) return false;
          return count < 1;
        },
      },
    },
  });
}

export default function RootLayout() {
  const [client] = useState(makeClient);
  const hydrated = useSession((s) => s.hydrated);
  const onboarded = useSession((s) => s.onboarded);
  const token = useSession((s) => s.token);
  const audience = useSession((s) => s.audience);
  const enterDashboard = useSession((s) => s.enterDashboard);
  const unverified = useSession((s) => !!s.token && needsAccountVerification(s.user));

  useEffect(() => {
    console.log('[FripCash] JS démarré — si tu vois ça, le bundle a bien tourné sur le téléphone');
    SplashScreen.hideAsync().catch(() => {});
    useSession.getState().hydrate();
    // SecureStore parfois bloque sur Android : on force l'UI après 3 s.
    const hydrateWatchdog = setTimeout(() => {
      if (!useSession.getState().hydrated) {
        console.warn('[FripCash] hydrate timeout — démarrage sans session persistée');
        useSession.setState({ hydrated: true });
      }
    }, 3000);
    setUnauthorizedHandler(() => {
      // Idempotent : sans ça, un 401 pendant la déconnexion relance signOut +
      // navigation + toast en concurrence avec le flux normal.
      if (!useSession.getState().token) return;
      useSession.getState().signOut();
      client.clear();
      goHomeAfterLogout();
      toast.info('Ta session a expiré. Reconnecte-toi.');
    });
    const sub = AppState.addEventListener('change', (state) => {
      if (Platform.OS !== 'web') focusManager.setFocused(state === 'active');
    });
    return () => {
      clearTimeout(hydrateWatchdog);
      sub.remove();
      setUnauthorizedHandler(null);
    };
  }, [client]);

  useEffect(() => {
    if (!hydrated || !token || !enterDashboard || unverified) return;
    useSession.setState({ enterDashboard: false });
    openDashboard().catch(() => {});
  }, [hydrated, token, enterDashboard, unverified]);

  const isAuthed = !!token;
  const isCourier = isAuthed && audience === 'COURIER';

  // Ne jamais `return null` : un écran vide + splash = illusion de "Bundling 99%".
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <QueryClientProvider client={client}>
        <StatusBar style="dark" />
        {hydrated ? (
          <Stack screenOptions={stackMotion}>
            <Stack.Protected guard={!onboarded}>
              <Stack.Screen name="onboarding" options={fadeMotion} />
            </Stack.Protected>
            <Stack.Protected guard={onboarded && unverified}>
              <Stack.Screen name="verification" options={fadeMotion} />
            </Stack.Protected>
            <Stack.Protected guard={onboarded && !unverified && !isCourier}>
              <Stack.Screen name="(shop)" />
            </Stack.Protected>
            <Stack.Protected guard={onboarded && !unverified && isCourier}>
              <Stack.Screen name="livreur" />
            </Stack.Protected>
            <Stack.Protected guard={onboarded && !isAuthed}>
              <Stack.Screen name="(auth)" options={sheetMotion} />
            </Stack.Protected>
          </Stack>
        ) : (
          <View style={{ flex: 1, backgroundColor: colors.background }} />
        )}
        <NotificationsBootstrap />
        {hydrated && isAuthed && !unverified ? (
          <PushRegistrar audience={audience ?? 'CONSUMER'} />
        ) : null}
        <ToastHost />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
