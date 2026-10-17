import { useLocalSearchParams } from 'expo-router';

import { DisputeChat } from '@/components/commerce/dispute-chat';

export default function LitigeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DisputeChat id={id} />;
}
