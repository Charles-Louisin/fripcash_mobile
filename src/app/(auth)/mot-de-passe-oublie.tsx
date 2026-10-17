import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Input, Screen, ScreenHeader, toast, Txt } from '@/components/ui';
import { authApi, errorMessage } from '@/lib/api';
import { isValidEmail, isValidPassword } from '@/lib/gn-phone';
import { colors } from '@/theme';

export default function MotDePasseOublieScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const [step, setStep] = useState<'request' | 'reset'>(params.token ? 'reset' : 'request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState(params.token ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setError(null);
    setLoading(true);
    try {
      await fn();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const request = () =>
    run(async () => {
      if (!isValidEmail(email)) throw new Error('Adresse e-mail invalide.');
      const res = await authApi.requestPasswordReset(email.trim().toLowerCase());
      if (res.token) setToken(res.token);
      toast.info('Si un compte existe, un e-mail avec un lien a été envoyé.');
      setStep('reset');
    });

  const reset = () =>
    run(async () => {
      if (token.trim().length < 8) throw new Error('Colle le code reçu dans le lien de l’e-mail.');
      if (!isValidPassword(password))
        throw new Error('Mot de passe : 8 caractères minimum, avec au moins une lettre et un chiffre.');
      if (password !== confirm) throw new Error('Les mots de passe ne correspondent pas.');
      await authApi.resetPassword(token.trim(), password);
      toast.success('Mot de passe modifié. Tu peux te connecter.');
      router.replace('/connexion');
    });

  return (
    <Screen keyboard edges={['top', 'bottom']}>
      <ScreenHeader title="Mot de passe oublié" />
      <View style={{ gap: 14, marginTop: 8 }}>
        {step === 'request' ? (
          <>
            <Txt variant="body" color={colors.textMuted}>
              Entre l&apos;adresse e-mail de ton compte. Nous t&apos;enverrons un lien pour choisir un nouveau mot de
              passe.
            </Txt>
            <Input
              label="Adresse e-mail"
              icon="mail-outline"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="toi@exemple.com"
            />
            <Button title="Envoyer le lien" onPress={request} loading={loading} size="lg" full />
            <Button title="J'ai déjà un code" variant="ghost" onPress={() => setStep('reset')} full />
          </>
        ) : (
          <>
            <Txt variant="body" color={colors.textMuted}>
              Ouvre le lien reçu par e-mail ou colle ici le code (la valeur après « token= »).
            </Txt>
            <Input
              label="Code de réinitialisation"
              icon="key-outline"
              value={token}
              onChangeText={setToken}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Input
              label="Nouveau mot de passe"
              icon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              hint="8 caractères minimum, une lettre et un chiffre."
            />
            <Input
              label="Confirmer le mot de passe"
              icon="lock-closed-outline"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
            />
            <Button title="Changer mon mot de passe" onPress={reset} loading={loading} size="lg" full />
          </>
        )}
        {error ? (
          <View style={{ backgroundColor: colors.errorSoft, padding: 12, borderRadius: 12 }}>
            <Txt variant="bodyStrong" color={colors.error}>
              {error}
            </Txt>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
