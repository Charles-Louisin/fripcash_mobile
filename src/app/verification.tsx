import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Input, Logo, Screen, toast, Txt } from '@/components/ui';
import { useSessionActions } from '@/hooks/use-session-actions';
import { authApi, errorMessage, fetchMe } from '@/lib/api';
import { useSession } from '@/stores/session';
import { colors } from '@/theme';

const RESEND_DELAY_S = 60;

export default function VerificationScreen() {
  const { logout } = useSessionActions();
  const user = useSession((s) => s.user);
  const verification = useSession((s) => s.verification);
  const setUser = useSession((s) => s.setUser);
  const setVerification = useSession((s) => s.setVerification);
  const signIn = useSession((s) => s.signIn);

  const byEmail = !!user?.email;
  const target = byEmail ? user?.email : user?.phoneNumber;
  const [typed, setTyped] = useState<string | null>(null);
  const code = typed ?? verification.hint ?? '';
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const remaining = verification.sentAt
    ? Math.max(0, RESEND_DELAY_S - Math.floor((now - verification.sentAt) / 1000))
    : 0;

  useEffect(() => {
    if (!remaining) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [remaining]);

  useEffect(() => {
    let alive = true;
    fetchMe()
      .then((me) => {
        if (!alive || !user) return;
        if (me.emailVerified || me.phoneNumberVerified) {
          setUser({ ...user, emailVerified: !!me.emailVerified, phoneNumberVerified: !!me.phoneNumberVerified });
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
    // Vérifie une seule fois à l'ouverture si le compte a été confirmé ailleurs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resend = async () => {
    if (!target || remaining > 0) return;
    setSending(true);
    try {
      const res = byEmail ? await authApi.sendVerificationEmail(target) : await authApi.sendOtp(target);
      setVerification({ hint: res.code ?? null, sentAt: Date.now() });
      setNow(Date.now());
      if (res.code) {
        setTyped(res.code);
        toast.info(`Mode test : utilise le code ${res.code}.`);
      } else {
        toast.success(byEmail ? 'Nouveau code envoyé par e-mail.' : 'Nouveau code envoyé par SMS.');
      }
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSending(false);
    }
  };

  const submit = async () => {
    const digits = code.replace(/\D/g, '');
    if (digits.length !== 6) {
      toast.error('Entre le code à 6 chiffres.');
      return;
    }
    if (!user || !target) return;
    setLoading(true);
    try {
      if (byEmail) {
        await authApi.verifyEmailCode({ email: target, code: digits });
        await setUser({ ...user, emailVerified: true });
      } else {
        const res = await authApi.verifyOtp({ phoneNumber: target, code: digits });
        const token = authApi.tokenFrom(res);
        if (!token) throw new Error('Session introuvable. Réessaie.');
        await signIn(token, { ...res.user, authAudience: user.authAudience ?? res.user.authAudience });
      }
      useSession.setState({ enterDashboard: true });
      toast.success('Compte vérifié, bienvenue !');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const resendLabel =
    remaining > 0 ? `Renvoyer le code (${remaining}s)` : verification.sentAt ? 'Renvoyer le code' : 'Envoyer le code';

  return (
    <Screen keyboard edges={['top', 'bottom']} lazy={false}>
      <View style={styles.hero}>
        <Logo size={30} />
        <Txt variant="h1">Vérifie ton compte</Txt>
        <Txt variant="body" color={colors.textMuted}>
          {byEmail ? 'Nous avons envoyé un code à 6 chiffres à ' : 'Un code à 6 chiffres est envoyé par SMS au '}
          <Txt variant="bodyStrong">{target}</Txt>. Entre-le pour accéder à ton espace.
        </Txt>
      </View>

      <View style={styles.notice}>
        <Txt variant="caption" color={colors.text}>
          {byEmail
            ? 'Code bien reçu par e-mail ? Tape-le. Sinon, tape 000000.'
            : 'Mode test : tape 000000.'}
        </Txt>
      </View>

      <View style={{ gap: 14, marginTop: 18 }}>
        <Input
          label="Code de vérification"
          value={code}
          onChangeText={(v) => setTyped(v.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          placeholder="••••••"
          maxLength={6}
          autoFocus
          textContentType="oneTimeCode"
          style={{ fontSize: 22, letterSpacing: 8 }}
        />
        <Button
          title="Vérifier"
          onPress={submit}
          loading={loading}
          disabled={code.replace(/\D/g, '').length !== 6}
          size="lg"
          full
        />
        <Button
          title={resendLabel}
          onPress={resend}
          loading={sending}
          disabled={remaining > 0 || sending}
          variant="secondary"
          full
        />
      </View>

      <Pressable onPress={logout} hitSlop={8} style={styles.logout}>
        <Txt variant="label" color={colors.textMuted}>
          Se déconnecter
        </Txt>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 8, marginTop: 24 },
  notice: { marginTop: 16, backgroundColor: colors.surfaceMuted, padding: 12, borderRadius: 12 },
  logout: { alignSelf: 'center', marginTop: 28 },
});
