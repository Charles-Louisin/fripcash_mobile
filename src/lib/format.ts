export function formatGnf(value?: number | null) {
  const n = Math.round(Number(value) || 0);
  return `${n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} GNF`;
}

export function formatNumber(value?: number | null) {
  return Math.round(Number(value) || 0)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function discountPercent(price: number, compareAt?: number | null) {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const MONTHS_LONG = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

function pad(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

export function formatTime(value?: string | Date | null) {
  if (!value) return '';
  const d = new Date(value);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function formatDay(value?: string | Date | null) {
  if (!value) return '';
  const d = new Date(value);
  const now = new Date();
  if (sameDay(d, now)) return "Aujourd'hui";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(d, yesterday)) return 'Hier';
  return `${d.getDate()} ${MONTHS[d.getMonth()]}${d.getFullYear() !== now.getFullYear() ? ` ${d.getFullYear()}` : ''}`;
}

export function formatDate(value?: string | Date | null) {
  if (!value) return '';
  const d = new Date(value);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatMonthYear(value?: string | Date | null) {
  if (!value) return '';
  const d = new Date(value);
  const label = MONTHS_LONG[d.getMonth()];
  return `${label.charAt(0).toUpperCase()}${label.slice(1)} ${d.getFullYear()}`;
}

export function formatRelative(value?: string | Date | null) {
  if (!value) return '';
  const d = new Date(value);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "À l'instant";
  if (min < 60) return `Il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Il y a ${h} h`;
  return formatDay(d);
}

export function shortOrderId(id?: string | null) {
  if (!id) return '';
  return `#ord_${id.slice(-4).toUpperCase()}`;
}

export function initials(name?: string | null) {
  const parts = String(name || '?')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return ((parts[0]?.[0] || '?') + (parts[1]?.[0] || '')).toUpperCase();
}
