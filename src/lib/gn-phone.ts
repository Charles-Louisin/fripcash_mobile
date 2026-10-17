export type GnOperator = 'OM_GN' | 'MTN_GN';

export function digitsOnly(value: string) {
  return String(value || '').replace(/\D/g, '');
}

export function gnLocalFromInput(value: string): string | null {
  let digits = digitsOnly(value);
  if (digits.startsWith('00224')) digits = digits.slice(5);
  if (digits.startsWith('224') && digits.length > 9) digits = digits.slice(3);
  if (digits.length !== 9 || !digits.startsWith('6')) return null;
  return digits;
}

export function parseGnMobile(value: string) {
  const local = gnLocalFromInput(value);
  if (!local) return null;
  const operator: GnOperator | null = local.startsWith('62') ? 'OM_GN' : local.startsWith('65') ? 'MTN_GN' : null;
  if (!operator) return null;
  return { local, e164: `+224${local}`, operator };
}

export function toE164(value: string) {
  const local = gnLocalFromInput(value);
  return local ? `+224${local}` : null;
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export function isValidPassword(value: string) {
  return value.length >= 8 && /[a-zA-Z]/.test(value) && /\d/.test(value);
}
