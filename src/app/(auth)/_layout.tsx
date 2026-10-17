import { Stack } from 'expo-router';

import { fadeMotion, stackMotion } from '@/theme/motion';

export default function AuthLayout() {
  return (
    <Stack screenOptions={stackMotion}>
      <Stack.Screen name="connexion" options={fadeMotion} />
      <Stack.Screen name="inscription" />
      <Stack.Screen name="mot-de-passe-oublie" />
    </Stack>
  );
}
