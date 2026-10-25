import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';

import { setAuthToken, type Audience, type AuthUser } from '@/lib/api';

const TOKEN_KEY = 'fripcash.token';
const USER_KEY = 'fripcash.user';
const ONBOARDING_KEY = 'fripcash.onboarded';

const secure = {
  get: (key: string) => (Platform.OS === 'web' ? AsyncStorage.getItem(key) : SecureStore.getItemAsync(key)),
  set: (key: string, value: string) =>
    Platform.OS === 'web' ? AsyncStorage.setItem(key, value) : SecureStore.setItemAsync(key, value),
  remove: (key: string) => (Platform.OS === 'web' ? AsyncStorage.removeItem(key) : SecureStore.deleteItemAsync(key)),
};

/** Ni l'e-mail ni le téléphone confirmés : l'accès au compte attend le code à 6 chiffres. */
export function needsAccountVerification(user: AuthUser | null | undefined) {
  return !!user && !user.emailVerified && !user.phoneNumberVerified;
}

export function isAdminUser(audience: Audience | null | undefined, user: AuthUser | null | undefined) {
  return audience === 'ADMIN' || user?.userKind?.toUpperCase() === 'ADMIN';
}

export type VerificationState = {
  /** Code renvoyé par l'API quand l'envoi réel n'a pas pu se faire (mode test). */
  hint: string | null;
  /** Horodatage du dernier envoi, pour le délai avant renvoi. */
  sentAt: number | null;
};

type SessionState = {
  hydrated: boolean;
  onboarded: boolean;
  token: string | null;
  user: AuthUser | null;
  audience: Audience | null;
  enterDashboard: boolean;
  verification: VerificationState;
  hydrate: () => Promise<void>;
  signIn: (
    token: string,
    user: AuthUser,
    opts?: { dashboard?: boolean; verification?: Partial<VerificationState> }
  ) => Promise<void>;
  setUser: (user: AuthUser) => Promise<void>;
  setVerification: (next: Partial<VerificationState>) => void;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
};

const NO_VERIFICATION: VerificationState = { hint: null, sentAt: null };

export const useSession = create<SessionState>((set) => ({
  hydrated: false,
  onboarded: false,
  token: null,
  user: null,
  audience: null,
  enterDashboard: false,
  verification: NO_VERIFICATION,
  hydrate: async () => {
    try {
      const [token, rawUser, onboarded] = await Promise.all([
        secure.get(TOKEN_KEY),
        secure.get(USER_KEY),
        AsyncStorage.getItem(ONBOARDING_KEY),
      ]);
      const user = rawUser ? (JSON.parse(rawUser) as AuthUser) : null;
      setAuthToken(token);
      const audience = token ? (user?.authAudience ?? 'CONSUMER') : null;
      set({
        hydrated: true,
        onboarded: onboarded === '1',
        token,
        user: token ? user : null,
        audience,
        // Le livreur démarre sur son tableau de bord ; l'accueil boutique reste accessible via son bouton.
        enterDashboard: audience === 'COURIER',
      });
    } catch {
      set({ hydrated: true });
    }
  },
  signIn: async (token, user, opts) => {
    setAuthToken(token);
    await Promise.all([secure.set(TOKEN_KEY, token), secure.set(USER_KEY, JSON.stringify(user))]);
    set({
      token,
      user,
      audience: user.authAudience ?? 'CONSUMER',
      enterDashboard: opts?.dashboard !== false,
      verification: { ...NO_VERIFICATION, ...opts?.verification },
    });
  },
  setUser: async (user) => {
    await secure.set(USER_KEY, JSON.stringify(user));
    set({ user });
  },
  setVerification: (next) => set((s) => ({ verification: { ...s.verification, ...next } })),
  signOut: async () => {
    setAuthToken(null);
    await Promise.all([secure.remove(TOKEN_KEY), secure.remove(USER_KEY)]);
    set({ token: null, user: null, audience: null, verification: NO_VERIFICATION });
  },
  completeOnboarding: async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    set({ onboarded: true });
  },
}));
