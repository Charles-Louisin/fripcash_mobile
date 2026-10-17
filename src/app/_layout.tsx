import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { NotificationsBootstrap, PushRegistrar } from '@/components/push-registrar';
import { toast, ToastHost } from '@/components/ui';
import { ApiError, setUnauthorizedHandler } from '@/lib/api';
import { goHomeAfterLogout, openDashboard } from '@/lib/nav';
import { needsAccountVerification, useSession } from '@/stores/session';
import { colors } from '@/theme';
import { fadeMotion, sheetMotion, stackMotion } from '@/theme/motion';

export { ErrorPage as ErrorBoundary } from '@/components/ui/error-page';

SplashScreen.preventAutoHideAsync();

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
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_300Light: require('../../node_modules/@expo-google-fonts/plus-jakarta-sans/300Light/PlusJakartaSans_300Light.ttf'),
    PlusJakartaSans_400Regular: require('../../node_modules/@expo-google-fonts/plus-jakarta-sans/400Regular/PlusJakartaSans_400Regular.ttf'),
    PlusJakartaSans_500Medium: require('../../node_modules/@expo-google-fonts/plus-jakarta-sans/500Medium/PlusJakartaSans_500Medium.ttf'),
    PlusJakartaSans_600SemiBold: require('../../node_modules/@expo-google-fonts/plus-jakarta-sans/600SemiBold/PlusJakartaSans_600SemiBold.ttf'),
    PlusJakartaSans_700Bold: require('../../node_modules/@expo-google-fonts/plus-jakarta-sans/700Bold/PlusJakartaSans_700Bold.ttf'),
    PlayfairDisplay_600SemiBold: require('../../node_modules/@expo-google-fonts/playfair-display/600SemiBold/PlayfairDisplay_600SemiBold.ttf'),
    PlayfairDisplay_700Bold: require('../../node_modules/@expo-google-fonts/playfair-display/700Bold/PlayfairDisplay_700Bold.ttf'),
  });
  const hydrated = useSession((s) => s.hydrated);
  const onboarded = useSession((s) => s.onboarded);
  const token = useSession((s) => s.token);
  const audience = useSession((s) => s.audience);
  const enterDashboard = useSession((s) => s.enterDashboard);
  const unverified = useSession((s) => !!s.token && needsAccountVerification(s.user));

  useEffect(() => {
    useSession.getState().hydrate();
    setUnauthorizedHandler(() => {
      useSession.getState().signOut();
      client.clear();
      goHomeAfterLogout();
      toast.info('Ta session a expiré. Reconnecte-toi.');
    });
    const sub = AppState.addEventListener('change', (state) => {
      if (Platform.OS !== 'web') focusManager.setFocused(state === 'active');
    });
    return () => {
      sub.remove();
      setUnauthorizedHandler(null);
    };
  }, [client]);

  const ready = fontsLoaded && hydrated;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  useEffect(() => {
    if (!ready || !token || !enterDashboard || unverified) return;
    useSession.setState({ enterDashboard: false });
    openDashboard().catch(() => {});
  }, [ready, token, enterDashboard, unverified]);

  if (!ready) return null;

  const isAuthed = !!token;
  const isCourier = isAuthed && audience === 'COURIER';

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <QueryClientProvider client={client}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={stackMotion}>
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
        <NotificationsBootstrap />
        {isAuthed && !unverified ? <PushRegistrar audience={audience ?? 'CONSUMER'} /> : null}
        <ToastHost />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
