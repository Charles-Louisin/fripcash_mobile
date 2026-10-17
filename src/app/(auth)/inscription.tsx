import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { OtpStep } from '@/components/auth/otp-step';
import {
  CourierSignupFields,
  EMPTY_COURIER_DRAFT,
  validateCourierDraft,
  type CourierSignupDraft,
} from '@/components/courier/courier-signup-fields';
import { ZoneSelect } from '@/components/select-field';
import {
  EMPTY_SHOP_DRAFT,
  ShopApplicationFields,
  shopDraftToApplication,
  shopKindForRole,
  validateShopDraft,
  type ShopDraft,
} from '@/components/seller/shop-application-fields';
import { Button, Chip, Input, Screen, ScreenHeader, Segmented, toast, Txt } from '@/components/ui';
import { useSessionActions } from '@/hooks/use-session-actions';
import { needsAccountVerification } from '@/stores/session';
import {
  applyForShop,
  authApi,
  errorMessage,
  setAuthToken,
  submitCourierKyc,
  type AuthUser,
  type SignupRole,
} from '@/lib/api';
import { SIGNUP_ROLE_OPTIONS } from '@/lib/domain';
import { isValidEmail, isValidPassword, toE164 } from '@/lib/gn-phone';
import { colors, radius } from '@/theme';

type Step = 'role' | 'profile' | 'account' | 'otp';

function generatePseudos(firstName: string, lastName: string): string[] {
  const f = firstName.toLowerCase().trim().replace(/\s+/g, '');
  const l = lastName.toLowerCase().trim().replace(/\s+/g, '');
  if (!f && !l) return [];
  const rand2 = () => Math.floor(Math.random() * 90 + 10);
  const rand3 = () => Math.floor(Math.random() * 900 + 100);
  const rand4 = () => Math.floor(Math.random() * 9000 + 1000);
  const suggestions: string[] = [];
  if (f && l) {
    suggestions.push(
      `${f}.${l}`,
      `${f}_${l}`,
      `${f}${l}${rand2()}`,
      `${f}.${l[0]}${rand2()}`,
      `${f[0]}${l}${rand3()}`,
      `${f}_${l}${rand2()}`,
      `${f}${rand4()}`,
      `${l}.${f}${rand2()}`
    );
  } else {
    const name = f || l;
    suggestions.push(`${name}${rand3()}`, `${name}_${rand2()}`, `${name}.shop${rand2()}`, `${name}frip${rand2()}`);
  }
  return [...new Set(suggestions)].slice(0, 4);
}

export default function InscriptionScreen() {
  const { login } = useSessionActions();
  const [step, setStep] = useState<Step>('role');
  const [role, setRole] = useState<SignupRole>('acheteur');
  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [suggestionKey, setSuggestionKey] = useState(0);
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [shop, setShop] = useState<ShopDraft>(EMPTY_SHOP_DRAFT);
  const [courier, setCourier] = useState<CourierSignupDraft>(EMPTY_COURIER_DRAFT);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLivreur = role === 'livreur';
  const needsShop = !!shopKindForRole(role);
  const isSeller = role !== 'acheteur' && !isLivreur;
  const displayName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
  const suggestions = useMemo(
    () => generatePseudos(firstName, lastName),
    // suggestionKey force de nouvelles propositions
    [firstName, lastName, suggestionKey]
  );
  const shippingZoneId = shop.shippingZoneId || zoneId || '';

  const finish = async (
    token: string | null | undefined,
    user: AuthUser,
    verifyEmail: { code?: string } | false
  ) => {
    if (!token) throw new Error('Session introuvable. Réessaie.');
    // Le dossier part avant l'ouverture de la session : une fois connecté, l'écran d'inscription est démonté.
    setAuthToken(token);
    let followUp: '/vendeur/demande' | '/livreur/profil' | null = null;
    if (needsShop) {
      try {
        await applyForShop(shopDraftToApplication(role, { ...shop, shippingZoneId }));
        toast.success('Dossier envoyé.');
      } catch (e) {
        toast.info(errorMessage(e) || 'Compte créé — complète ton dossier boutique.');
        followUp = '/vendeur/demande';
      }
    } else if (isLivreur) {
      try {
        await submitCourierKyc({
          portraitUrl: courier.portraitUrl,
          vehiclePhotoUrl: courier.vehiclePhotoUrl,
          vehicle: courier.vehicle.trim(),
          plate: courier.plate.trim(),
          zoneIds: courier.zoneIds,
          identityDocuments: courier.identity,
        });
        toast.success('Compte créé. Ton dossier livreur est envoyé.');
      } catch (e) {
        toast.info(errorMessage(e) || 'Compte créé — termine ton dossier livreur.');
        followUp = '/livreur/profil';
      }
    } else {
      toast.success('Compte créé, bienvenue sur FripCash !');
    }
    await login(token, user, {
      dashboard: !followUp,
      verification: verifyEmail ? { hint: verifyEmail.code ?? null, sentAt: Date.now() } : undefined,
    });
    if (followUp && !needsAccountVerification(user)) router.push(followUp);
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

  const validateProfile = () => {
    if (!firstName.trim() || !lastName.trim()) throw new Error('Indique ton prénom et ton nom.');
    if (needsShop) {
      const shopError = validateShopDraft(role, { ...shop, shippingZoneId });
      if (shopError) throw new Error(shopError);
    } else if (isLivreur) {
      const courierError = validateCourierDraft(courier);
      if (courierError) throw new Error(courierError);
    } else if (isSeller && !shippingZoneId) {
      throw new Error('Choisis ta zone d’expédition.');
    }
  };

  const goAccount = () =>
    run(async () => {
      validateProfile();
      setStep('account');
    });

  const submitAccount = () =>
    run(async () => {
      validateProfile();
      if (method === 'phone') {
        const e164 = toE164(phone);
        if (!e164) throw new Error('Numéro guinéen invalide (9 chiffres, commence par 6).');
        const res = await authApi.sendOtp(e164);
        setDevCode(res.code ?? null);
        setStep('otp');
        return;
      }
      if (!isValidEmail(email)) throw new Error('Adresse e-mail invalide.');
      if (!isValidPassword(password)) {
        throw new Error('Mot de passe : 8 caractères minimum, avec au moins une lettre et un chiffre.');
      }
      if (password !== confirmPassword) {
        throw new Error('Les deux mots de passe ne correspondent pas.');
      }
      const res = await authApi.signUpEmail({
        email: email.trim().toLowerCase(),
        password,
        name: pseudo.trim() || displayName,
        signupRole: role,
        shippingZoneId: shippingZoneId || undefined,
      });
      await finish(authApi.tokenFrom(res), res.user, { code: res.verificationCode });
    });

  const verifyCode = (code: string) =>
    run(async () => {
      const res = await authApi.verifyOtp({
        phoneNumber: toE164(phone)!,
        code,
        signupRole: role,
        name: displayName,
        displayName: pseudo.trim() || displayName,
        shippingZoneId: shippingZoneId || undefined,
      });
      await finish(authApi.tokenFrom(res), res.user, false);
    });

  const back = () => {
    if (step === 'otp') setStep('account');
    else if (step === 'account') setStep('profile');
    else if (step === 'profile') setStep('role');
    else if (router.canGoBack()) router.back();
    else router.replace('/connexion');
  };

  return (
    <Screen keyboard edges={['top', 'bottom']} lazy={false} skeleton="form">
      <ScreenHeader onBack={back} title={step === 'role' ? undefined : 'Créer un compte'} />

      {step === 'role' ? (
        <View style={{ gap: 18 }}>
          <View style={{ gap: 6 }}>
            <Txt variant="h1">Rejoins FripCash</Txt>
            <Txt variant="title">Je m’inscris en tant que :</Txt>
            <Txt variant="body" color={colors.textMuted}>
              Ce choix décide où tes annonces apparaîtront.
            </Txt>
          </View>
          <View style={{ gap: 10 }}>
            {SIGNUP_ROLE_OPTIONS.map((o) => {
              const active = o.id === role;
              return (
                <Pressable
                  key={o.id}
                  onPress={() => setRole(o.id)}
                  style={[styles.role, active && styles.roleActive]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}>
                  <View style={[styles.roleIcon, active && { backgroundColor: colors.primary }]}>
                    <Ionicons name={o.icon} size={22} color={active ? colors.white : colors.primary} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt variant="title">{o.title}</Txt>
                    <Txt variant="caption">{o.description}</Txt>
                  </View>
                  <Ionicons
                    name={active ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={active ? colors.primary : colors.border}
                  />
                </Pressable>
              );
            })}
          </View>
          <Button title="Continuer" onPress={() => setStep('profile')} size="lg" full iconRight="chevron-forward" />
        </View>
      ) : null}

      {step === 'profile' ? (
        <View style={{ gap: 14 }}>
          <View>
            <Txt variant="title">Tes infos</Txt>
            <Txt variant="caption">
              {needsShop
                ? 'Ton profil, puis le dossier boutique.'
                : isLivreur
                  ? 'Ton profil, puis les documents livreur, avant de créer le compte.'
                  : 'Comment tu apparais sur FripCash.'}
            </Txt>
          </View>
          <View style={styles.row}>
            <Input
              label="Nom"
              icon="person-outline"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Ton nom"
              autoCapitalize="words"
              containerStyle={{ flex: 1 }}
            />
            <Input
              label="Prénom"
              icon="person-outline"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Ton prénom"
              autoCapitalize="words"
              containerStyle={{ flex: 1 }}
            />
          </View>
          <Input
            label="Pseudo (optionnel)"
            icon="at-outline"
            value={pseudo}
            onChangeText={setPseudo}
            placeholder="Comment tu apparais"
            autoCapitalize="none"
          />
          {suggestions.length ? (
            <View style={{ gap: 8 }}>
              <View style={styles.suggestHead}>
                <Txt variant="caption">Suggestions</Txt>
                <Pressable onPress={() => setSuggestionKey((k) => k + 1)} hitSlop={8}>
                  <Ionicons name="refresh" size={14} color={colors.textMuted} />
                </Pressable>
              </View>
              <View style={styles.wrap}>
                {suggestions.map((s) => (
                  <Chip key={s} label={`@${s}`} active={pseudo === s} onPress={() => setPseudo(s)} />
                ))}
              </View>
            </View>
          ) : null}

          {isSeller && !needsShop ? (
            <ZoneSelect label="Zone d’expédition" value={zoneId} onChange={setZoneId} />
          ) : null}

          {needsShop ? <ShopApplicationFields role={role} value={shop} onChange={setShop} /> : null}
          {isLivreur ? <CourierSignupFields value={courier} onChange={setCourier} /> : null}

          <Button title="Continuer" onPress={goAccount} loading={loading} size="lg" full iconRight="chevron-forward" />
        </View>
      ) : null}

      {step === 'account' ? (
        <View style={{ gap: 14 }}>
          <Txt variant="body" color={colors.textMuted}>
            Profil : <Txt variant="bodyStrong">{SIGNUP_ROLE_OPTIONS.find((o) => o.id === role)?.title}</Txt>
          </Txt>
          <Segmented
            value={method}
            onChange={setMethod}
            options={[
              { value: 'phone', label: 'Téléphone' },
              { value: 'email', label: 'E-mail' },
            ]}
          />
          {method === 'phone' ? (
            <Input
              label="Numéro de téléphone"
              prefix="+224"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="62X XX XX XX"
            />
          ) : (
            <>
              <Input
                label="Adresse e-mail"
                icon="mail-outline"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="toi@exemple.com"
              />
              <Input
                label="Mot de passe"
                icon="lock-closed-outline"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                hint="8 caractères minimum, une lettre et un chiffre."
                placeholder="••••••••"
              />
              <Input
                label="Confirmer le mot de passe"
                icon="lock-closed-outline"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="••••••••"
                error={confirmPassword && password !== confirmPassword ? 'Les deux mots de passe ne correspondent pas.' : null}
              />
            </>
          )}
          {isLivreur ? (
            <View style={styles.notice}>
              <Ionicons name="information-circle-outline" size={18} color={colors.warning} />
              <Txt variant="caption" style={{ flex: 1 }}>
                Ton dossier livreur sera envoyé avec la création du compte. L’équipe le valide avant les missions.
              </Txt>
            </View>
          ) : null}
          {needsShop ? (
            <View style={styles.notice}>
              <Ionicons name="information-circle-outline" size={18} color={colors.warning} />
              <Txt variant="caption" style={{ flex: 1 }}>
                Ton dossier boutique / enseigne sera envoyé après création du compte. Validation manuelle pour les
                commerces locaux et enseignes.
              </Txt>
            </View>
          ) : null}
          <Button
            title={method === 'phone' ? 'Recevoir le code' : 'Créer mon compte'}
            onPress={submitAccount}
            loading={loading}
            size="lg"
            full
          />
        </View>
      ) : null}

      {step === 'otp' ? (
        <OtpStep
          phone={toE164(phone) ?? phone}
          devCode={devCode}
          loading={loading}
          onSubmit={verifyCode}
          onResend={() =>
            run(async () => {
              const res = await authApi.sendOtp(toE164(phone)!);
              setDevCode(res.code ?? null);
            })
          }
          onChangeNumber={() => setStep('account')}
        />
      ) : null}

      {error ? (
        <View style={styles.error}>
          <Txt variant="bodyStrong" color={colors.error}>
            {error}
          </Txt>
        </View>
      ) : null}

      <View style={styles.footer}>
        <Txt variant="body" color={colors.textMuted}>
          Déjà inscrit ?
        </Txt>
        <Link href="/connexion" replace asChild>
          <Pressable hitSlop={6}>
            <Txt variant="bodyStrong" color={colors.primary}>
              Se connecter
            </Txt>
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  role: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.borderSoft,
  },
  roleActive: { borderColor: colors.primary, backgroundColor: colors.secondary },
  roleIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', gap: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  notice: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.warningSoft,
  },
  error: { backgroundColor: colors.errorSoft, padding: 12, borderRadius: 12, marginTop: 14 },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 28 },
});
