import Constants from 'expo-constants';
import { Platform } from 'react-native';

export class ApiError extends Error {
  statusCode: number;
  code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

const TUNNEL_HOST =
  /(\.exp\.direct|\.expo\.dev|\.ngrok(?:-free)?\.(?:app|io)|exp\.host)$/i;
const PRIVATE_IP =
  /^(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)$/;

const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL;

function configuredUrl() {
  if (ENV_API_URL && ENV_API_URL.trim()) return ENV_API_URL.trim().replace(/\/$/, '');
  const extra = (Constants.expoConfig?.extra ?? Constants.easConfig) as { apiUrl?: string } | undefined;
  if (extra?.apiUrl?.trim()) return extra.apiUrl.trim().replace(/\/$/, '');
  return '';
}

function defaultBaseUrl() {
  const configured = configuredUrl();
  if (configured) return configured;

  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host && PRIVATE_IP.test(host) && !TUNNEL_HOST.test(host)) {
    return `http://${host}:5000/api/v1`;
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:5000/api/v1' : 'http://127.0.0.1:5000/api/v1';
}

export const API_URL = defaultBaseUrl();
export const API_ORIGIN = API_URL.replace(/\/api\/v1$/, '');

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

type Query = Record<string, string | number | boolean | null | undefined>;

type RequestOptions = {
  query?: Query;
  body?: unknown;
  anonymous?: boolean;
  timeoutMs?: number;
};

const MAX_IN_FLIGHT = 8;
let inFlight = 0;
const waiters: Array<() => void> = [];

function acquireSlot() {
  if (inFlight < MAX_IN_FLIGHT) {
    inFlight += 1;
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    waiters.push(() => {
      inFlight += 1;
      resolve();
    });
  });
}

function releaseSlot() {
  inFlight = Math.max(0, inFlight - 1);
  const next = waiters.shift();
  if (next) next();
}

function buildUrl(path: string, query?: Query) {
  const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return url;
  const params = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return params.length ? `${url}?${params.join('&')}` : url;
}

async function rawFetch(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal, credentials: 'omit' });
  } finally {
    clearTimeout(timer);
  }
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  await acquireSlot();
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (!options.anonymous && authToken) headers.Authorization = `Bearer ${authToken}`;

  const url = buildUrl(path, options.query);
  const init: RequestInit = {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  };
  const timeoutMs = options.timeoutMs ?? 45_000;

  let response: Response;
  try {
    try {
      response = await rawFetch(url, init, timeoutMs);
    } catch {
      response = await rawFetch(url, init, timeoutMs);
    }
  } catch (e) {
    const aborted = e instanceof Error && e.name === 'AbortError';
    throw new ApiError(
      0,
      aborted ? 'TIMEOUT' : 'NETWORK',
      aborted
        ? 'Le serveur met trop de temps à répondre. Réessaie dans quelques secondes.'
        : Platform.OS === 'web'
          ? "Le navigateur bloque l’API (CORS). Ouvre l’app dans Expo Go sur le téléphone, pas dans Chrome."
          : `Impossible de joindre ${API_URL}. Vérifie ta connexion, puis réessaie.`
    );
  } finally {
    releaseSlot();
  }

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    if (response.status === 401 && authToken && !options.anonymous) {
      onUnauthorized?.();
    }
    const body = (data && typeof data === 'object' ? data : {}) as {
      code?: string;
      message?: string;
    };
    throw new ApiError(
      response.status,
      String(body.code || `HTTP_${response.status}`),
      String(body.message || 'Une erreur est survenue. Réessaie.')
    );
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, query?: Query) => request<T>('GET', path, { query }),
  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'body'>) =>
    request<T>('POST', path, { ...opts, body }),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, { body }),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

export function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Une erreur est survenue.';
}
