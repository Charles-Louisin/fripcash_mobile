import { Image } from 'expo-image';
import { Linking, Pressable, View } from 'react-native';

import { Avatar, Txt } from '@/components/ui';
import { colors, radius } from '@/theme';

export function CourierIntro({
  name,
  phone,
  portraitUrl,
  vehicle,
  plate,
}: {
  name: string;
  phone?: string | null;
  portraitUrl?: string | null;
  vehicle?: string | null;
  plate?: string | null;
}) {
  const moto = [vehicle, plate].filter(Boolean).join(' · ');
  return (
    <View
      style={{
        alignSelf: 'stretch',
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.borderSoft,
        padding: 12,
      }}>
      {portraitUrl ? (
        <Image source={{ uri: portraitUrl }} style={{ width: 56, height: 56, borderRadius: 28 }} contentFit="cover" />
      ) : (
        <Avatar name={name} size={56} />
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="caption">Livreur du colis</Txt>
        <Txt variant="title">{name || 'Livreur'}</Txt>
        {moto ? <Txt variant="caption">{moto}</Txt> : null}
        {phone ? (
          <Pressable onPress={() => Linking.openURL(`tel:${phone}`)}>
            <Txt variant="caption" color={colors.primary}>
              {phone}
            </Txt>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
