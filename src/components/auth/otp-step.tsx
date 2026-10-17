import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button, Input, Txt } from '@/components/ui';
import { colors } from '@/theme';

export function OtpStep({
  phone,
  devCode,
  loading,
  onSubmit,
  onResend,
  onChangeNumber,
}: {
  phone: string;
  devCode?: string | null;
  loading?: boolean;
  onSubmit: (code: string) => void;
  onResend: () => void;
  onChangeNumber: () => void;
}) {
  const [typed, setTyped] = useState('');
  const code = typed || devCode || '';
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  return (
    <View style={{ gap: 16 }}>
      <Txt variant="body" color={colors.textMuted}>
        Entre le code reçu par SMS au <Txt variant="bodyStrong">{phone}</Txt>.
      </Txt>
      {devCode ? (
        <Txt variant="caption" color={colors.primary}>
          Mode test : le code est {devCode}.
        </Txt>
      ) : null}
      <Input
        label="Code de vérification"
        value={code}
        onChangeText={(v) => setTyped(v.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        placeholder="••••••"
        maxLength={6}
        autoFocus
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        style={{ fontSize: 22, letterSpacing: 8 }}
      />
      <Button title="Valider" onPress={() => onSubmit(code)} loading={loading} disabled={code.length < 4} size="lg" full />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Pressable onPress={onChangeNumber} hitSlop={8}>
          <Txt variant="label" color={colors.primary}>
            Changer de numéro
          </Txt>
        </Pressable>
        <Pressable
          disabled={cooldown > 0}
          onPress={() => {
            setCooldown(60);
            onResend();
          }}
          hitSlop={8}>
          <Txt variant="label" color={cooldown > 0 ? colors.textSubtle : colors.primary}>
            {cooldown > 0 ? `Renvoyer (${cooldown}s)` : 'Renvoyer le code'}
          </Txt>
        </Pressable>
      </View>
    </View>
  );
}
