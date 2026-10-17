import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, ScreenHeader, toast, Txt } from '@/components/ui';
import { CourierIntro } from '@/components/commerce/courier-intro';
import { useAuth, useConversations, useMessages } from '@/hooks/queries';
import { errorMessage, sendMessage } from '@/lib/api';
import { useKeyboardSpace } from '@/lib/keyboard-space';
import { formatTime } from '@/lib/format';
import { colors, fonts, radius } from '@/theme';

export default function LivreurConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const convos = useConversations();
  const messages = useMessages(id, 5_000);
  const peer = (convos.data ?? []).find((c) => c.id === id)?.peer;
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);
  const keyboardSpace = useKeyboardSpace();

  const send = async () => {
    if (!text.trim()) return;
    try {
      await sendMessage(id, text.trim());
      setText('');
      messages.refetch();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={{ flex: 1, paddingBottom: keyboardSpace }}>
        <ScreenHeader title={peer?.name || 'Discussion'} />
        <FlatList
          ref={listRef}
          data={messages.data ?? []}
          keyExtractor={(m) => m.id}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          contentContainerStyle={{ padding: 16, gap: 8, flexGrow: 1 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={<EmptyState icon="chatbubble-outline" title="Dis bonjour" />}
          renderItem={({ item }) => {
            const card = item.kind === 'courier' || item.meta?.kind === 'courier';
            if (card) {
              return (
                <CourierIntro
                  name={item.meta?.name || 'Livreur'}
                  phone={item.meta?.phone}
                  portraitUrl={item.meta?.portraitUrl}
                  vehicle={item.meta?.vehicle}
                  plate={item.meta?.plate}
                />
              );
            }
            const mine = item.senderId === user?.id;
            return (
              <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                <Txt variant="body" color={mine ? colors.white : colors.text}>
                  {item.body}
                </Txt>
                <Txt variant="small" color={mine ? colors.onDarkMuted : colors.textSubtle}>
                  {formatTime(item.createdAt)}
                </Txt>
              </View>
            );
          }}
        />
        <View style={styles.composer}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Écrire un message…"
            placeholderTextColor={colors.textSubtle}
            style={styles.input}
            multiline
          />
          <Pressable onPress={send} disabled={!text.trim()} style={styles.send}>
            <Ionicons name="send" size={18} color={colors.white} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  bubble: { maxWidth: '82%', padding: 12, borderRadius: 16, gap: 4 },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.white },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 110,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
  },
  send: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
