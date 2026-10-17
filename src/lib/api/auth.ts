import { api } from './client';
import type { AuthUser, SignupRole } from './types';

type TokenResponse = { token?: string | null; user: AuthUser; session?: { token?: string } };

export function sendOtp(phoneNumber: string) {
  return api.post<{ message: string; code?: string; simulated?: boolean }>(
    '/auth/phone-number/send-otp',
    { phoneNumber },
    { anonymous: true }
  );
}

export function verifyOtp(body: {
  phoneNumber: string;
  code: string;
  signupRole?: SignupRole;
  name?: string;
  displayName?: string;
  shippingZoneId?: string;
}) {
  return api.post<TokenResponse>('/auth/phone-number/verify', body, { anonymous: true });
}

export function signInEmail(email: string, password: string) {
  return api.post<TokenResponse & { verificationCode?: string }>(
    '/auth/sign-in/email',
    { email, password },
    { anonymous: true }
  );
}

export function signUpEmail(body: {
  email: string;
  password: string;
  name: string;
  signupRole?: SignupRole;
  shippingZoneId?: string;
}) {
  return api.post<TokenResponse & { verificationCode?: string; emailSent?: boolean }>('/auth/sign-up/email', body, {
    anonymous: true,
  });
}

export function courierLogin(body: { email?: string; phone?: string; password: string }) {
  return api.post<TokenResponse>('/auth/courier/login', body, { anonymous: true });
}

export function sendVerificationEmail(email: string) {
  return api.post<{ message: string; code?: string; emailSent?: boolean }>('/auth/send-verification-email', {
    email,
  });
}

export function verifyEmailCode(body: { email?: string; code: string }) {
  return api.post<{ status: boolean; message: string }>('/auth/verify-email-code', body);
}

export function requestPasswordReset(email: string) {
  return api.post<{ message: string; token?: string }>(
    '/auth/request-password-reset',
    { email },
    { anonymous: true }
  );
}

export function resetPassword(token: string, newPassword: string) {
  return api.post<{ status: boolean }>('/auth/reset-password', { token, newPassword }, { anonymous: true });
}

export function signOut() {
  return api.post<{ status: boolean }>('/auth/sign-out');
}

export function tokenFrom(res: TokenResponse) {
  return res.token || res.session?.token || null;
}
