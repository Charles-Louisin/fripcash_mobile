import { Stack } from 'expo-router';

import { stackMotion } from '@/theme/motion';

export default function LivreurLayout() {
  return (
    <Stack screenOptions={stackMotion}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="mission/[id]" />
      <Stack.Screen name="messages/[id]" />
    </Stack>
  );
}
