import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { OtpStep } from '@/components/auth/otp-step';
import { Button, Input, Logo, Screen, ScreenHeader, Segmented, toast, Txt } from '@/components/ui';
import { useSessionActions } from '@/hooks/use-session-actions';
import { authApi, errorMessage, type AuthUser } from '@/lib/api';
import { isValidEmail, toE164 } from '@/lib/gn-phone';
import { needsAccountVerification } from '@/stores/session';
import { colors } from '@/theme';

type Mode = 'phone' | 'email';

function withAudience(user: AuthUser): AuthUser {
  const courier = user.authAudience === 'COURIER' || user.userKind === 'COURIER';
  return { ...user, authAudience: courier ? 'COURIER' : user.authAudience ?? 'CONSUMER' };
}

export default function ConnexionScreen() {
  const { login } = useSessionActions();
  const [mode, setMode] = useState<Mode>('phone');
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finish = async (
    token: string | null | undefined,
    user: AuthUser,
    verification?: { hint: string | null; sentAt: number | null }
  ) => {
    if (!token) throw new Error('Session introuvable. Réessaie.');
    await login(token, withAudience(user), { verification });
    if (needsAccountVerification(user)) toast.info('Vérifie ton compte pour continuer.');
    else toast.success(`Bienvenue ${user.name || ''} !`.trim());
  };

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

  const sendCode = () =>
    run(async () => {
      const e164 = toE164(phone);
      if (!e164) throw new Error('Numéro guinéen invalide (9 chiffres, commence par 6).');
      const res = await authApi.sendOtp(e164);
      setDevCode(res.code ?? null);
      setOtpSent(true);
    });

  const verifyCode = (code: string) =>
    run(async () => {
      const res = await authApi.verifyOtp({ phoneNumber: toE164(phone)!, code });
      await finish(authApi.tokenFrom(res), res.user);
    });

  const emailLogin = () =>
    run(async () => {
      if (!isValidEmail(email)) throw new Error('Adresse e-mail invalide.');
      if (!password) throw new Error('Entre ton mot de passe.');
      const mail = email.trim().toLowerCase();
      try {
        const res = await authApi.signInEmail(mail, password);
        await finish(authApi.tokenFrom(res), res.user, {
          hint: res.verificationCode ?? null,
          sentAt: res.user.emailVerified ? null : Date.now(),
        });
      } catch (first) {
        try {
          const res = await authApi.courierLogin({ email: mail, password });
          await finish(authApi.tokenFrom(res), { ...res.user, authAudience: 'COURIER' });
        } catch {
          throw first;
        }
      }
    });

  return (
    <Screen keyboard edges={['top', 'bottom']} lazy={false} skeleton="form">
      <ScreenHeader />
      <View style={styles.hero}>
        <Logo size={30} />
        <Txt variant="h1">Content de te revoir</Txt>
        <Txt variant="body" color={colors.textMuted}>
          Connecte-toi pour acheter, vendre et suivre tes commandes.
        </Txt>
      </View>

      <Segmented
        value={mode}
        onChange={(m) => {
          setMode(m);
          setError(null);
        }}
        options={[
          { value: 'phone', label: 'Téléphone' },
          { value: 'email', label: 'E-mail' },
        ]}
      />

      <View style={styles.form}>
        {mode === 'phone' ? (
          otpSent ? (
            <OtpStep
              phone={toE164(phone) ?? phone}
              devCode={devCode}
              loading={loading}
              onSubmit={verifyCode}
              onResend={sendCode}
              onChangeNumber={() => setOtpSent(false)}
            />
          ) : (
            <>
              <Input
                label="Numéro de téléphone"
                prefix="+224"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="62X XX XX XX"
                autoComplete="tel"
              />
              <Button title="Recevoir le code" onPress={sendCode} loading={loading} size="lg" full />
            </>
          )
        ) : (
          <>
            <Input
              label="Adresse e-mail"
              icon="mail-outline"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholder="toi@exemple.com"
            />
            <Input
              label="Mot de passe"
              icon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              placeholder="••••••••"
            />
            <Link href="/mot-de-passe-oublie" asChild>
              <Pressable hitSlop={6} style={{ alignSelf: 'flex-end' }}>
                <Txt variant="label" color={colors.primary}>
                  Mot de passe oublié ?
                </Txt>
              </Pressable>
            </Link>
            <Button title="Se connecter" onPress={emailLogin} loading={loading} size="lg" full />
          </>
        )}

        {error ? (
          <View style={styles.error}>
            <Txt variant="bodyStrong" color={colors.error}>
              {error}
            </Txt>
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <Txt variant="body" color={colors.textMuted}>
          Pas encore de compte ?
        </Txt>
        <Link href="/inscription" replace asChild>
          <Pressable hitSlop={6}>
            <Txt variant="bodyStrong" color={colors.primary}>
              Créer un compte
            </Txt>
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 8, marginTop: 8, marginBottom: 22 },
  form: { gap: 14, marginTop: 20 },
  error: { backgroundColor: colors.errorSoft, padding: 12, borderRadius: 12 },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 28 },
});
