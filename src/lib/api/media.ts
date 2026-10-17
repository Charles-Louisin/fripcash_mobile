import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import { api, API_ORIGIN, getAuthToken } from './client';

export type UploadFolder = 'listings' | 'categories' | 'excel' | 'kyc' | 'disputes' | 'profile';
export type UploadResult = { url: string; publicId: string; mimeType: string; name: string };

const PRIVATE_HOST =
  /^(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)$/i;

export function mediaUrl(value?: string | null): string | null {
  if (!value) return null;
  const raw = value.trim();
  if (!raw) return null;
  if (raw.startsWith('/uploads/')) return `${API_ORIGIN}${raw}`;
  if (/^(listings|categories|kyc|excel|disputes|profile)\//.test(raw)) return `${API_ORIGIN}/uploads/${raw}`;
  if (raw.startsWith('//')) return `https:${raw}`;
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    const match = raw.match(/^https?:\/\/([^/:]+)(?::\d+)?(\/uploads\/.*)$/);
    if (match && PRIVATE_HOST.test(match[1])) return `${API_ORIGIN}${match[2]}`;
    return raw;
  }
  if (raw.startsWith('utfs.io/') || raw.includes('.ufs.sh/')) return `https://${raw}`;
  return null;
}

export function listingImages(listing?: {
  media?: { url?: string | null; storageKey?: string | null; sortOrder?: number }[] | null;
} | null): string[] {
  if (!listing?.media?.length) return [];
  return [...listing.media]
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((m) => mediaUrl(m.url) || mediaUrl(m.storageKey))
    .filter((u): u is string => !!u);
}

export async function uploadBase64(input: {
  base64: string;
  filename: string;
  mimeType: string;
  folder: UploadFolder;
}): Promise<UploadResult> {
  const data = await api.post<{ url?: string; secure_url?: string; publicId?: string; public_id?: string }>(
    '/media/upload',
    {
      filename: input.filename,
      mimeType: input.mimeType,
      dataBase64: `data:${input.mimeType};base64,${input.base64}`,
      folder: input.folder,
    },
    { timeoutMs: 90_000 }
  );
  const url = data.secure_url || data.url;
  if (!url) throw new Error("L'envoi du fichier a échoué.");
  return {
    url,
    publicId: data.public_id || data.publicId || url,
    mimeType: input.mimeType,
    name: input.filename,
  };
}

async function fetchToBase64(uri: string): Promise<string> {
  const response = await fetch(uri);
  if (!response.ok) throw new Error('Lecture du fichier impossible.');
  const blob = await response.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Lecture du fichier impossible.'));
    reader.readAsDataURL(blob);
  });
  const comma = dataUrl.indexOf(',');
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
}

export async function uriToBase64(uri: string): Promise<string> {
  if (Platform.OS === 'web' || uri.startsWith('blob:') || uri.startsWith('data:')) {
    return fetchToBase64(uri);
  }
  try {
    const { File } = await import('expo-file-system');
    return await new File(uri).base64();
  } catch {
    try {
      return await fetchToBase64(uri);
    } catch {
      throw new Error('Impossible de lire ce fichier. Choisis-le à nouveau ou prends une photo.');
    }
  }
}

function asPdf(filename: string, mimeType: string, base64: string) {
  const name = filename.toLowerCase();
  const mime = mimeType.split(';')[0].trim().toLowerCase();
  return name.endsWith('.pdf') || mime.includes('pdf') || base64.startsWith('JVBER');
}

const IMAGE_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

/** Type réel du fichier : le picker donne parfois un MIME vide ou application/octet-stream. */
function kycMime(filename: string, mimeType: string, base64: string) {
  if (asPdf(filename, mimeType, base64)) return 'application/pdf';
  if (base64.startsWith('/9j/')) return 'image/jpeg';
  if (base64.startsWith('iVBORw0KGgo')) return 'image/png';
  if (base64.startsWith('R0lGOD')) return 'image/gif';
  if (base64.startsWith('UklGR')) return 'image/webp';
  const mime = mimeType.split(';')[0].trim().toLowerCase();
  if (mime.startsWith('image/')) return mime;
  const ext = filename.toLowerCase().split('.').pop() ?? '';
  const byExt = Object.entries(IMAGE_EXT).find(([, e]) => e === ext || (e === 'jpg' && ext === 'jpeg'));
  return byExt ? byExt[0] : null;
}

function base64ToBytes(base64: string) {
  const clean = base64.replace(/\s/g, '');
  const binary = globalThis.atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64Size(base64: string) {
  const clean = base64.replace(/\s/g, '');
  const padding = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0;
  return Math.floor((clean.length * 3) / 4) - padding;
}

function multipartBody(bytes: Uint8Array, filename: string, type: string) {
  const boundary = `----FripCashBoundary${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
  const safeName = filename.replace(/[^\w.-]/g, '_');
  const encoder = new TextEncoder();
  const head = encoder.encode(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${safeName}"\r\nContent-Type: ${type}\r\n\r\n`
  );
  const tail = encoder.encode(`\r\n--${boundary}--\r\n`);
  const body = new Uint8Array(head.length + bytes.length + tail.length);
  body.set(head, 0);
  body.set(bytes, head.length);
  body.set(tail, head.length + bytes.length);
  return { body, contentType: `multipart/form-data; boundary=${boundary}` };
}

/** Images ou PDF (seuls ou mélangés) via une route UploadThing : kycDocument ou disputeFile. */
async function uploadDocFile(
  slug: 'kycDocument' | 'disputeFile',
  filename: string,
  mimeType: string,
  base64: string
): Promise<UploadResult> {
  const type = kycMime(filename, mimeType, base64);
  if (!type) throw new Error('Format non pris en charge : envoie une image (JPG, PNG…) ou un PDF.');
  const ext = type === 'application/pdf' ? 'pdf' : IMAGE_EXT[type] ?? 'jpg';
  const name = /\.[a-z0-9]{2,5}$/i.test(filename) ? filename : `${filename}.${ext}`;
  const size = base64Size(base64);
  if (size > 8 * 1024 * 1024) throw new Error('Fichier trop lourd (8 Mo max).');
  const endpoint = new URL('/api/uploadthing', API_ORIGIN);
  endpoint.searchParams.set('slug', slug);
  endpoint.searchParams.set('actionType', 'upload');
  const token = getAuthToken();
  const presignRes = await fetch(endpoint.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-uploadthing-package': 'uploadthing/client',
      'x-uploadthing-version': '7.7.4',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      files: [{ name, size, type, lastModified: Date.now() }],
      input: null,
    }),
  });
  const payload = (await presignRes.json().catch(() => null)) as
    | { url?: string; key?: string; message?: string }[]
    | { message?: string }
    | null;
  if (!presignRes.ok || !Array.isArray(payload) || !payload[0]?.url) {
    const message = !Array.isArray(payload) ? payload?.message : undefined;
    throw new Error(message || 'Envoi du document refusé.');
  }
  const bytes = base64ToBytes(base64);
  let put: Response;
  if (Platform.OS === 'web') {
    const form = new FormData();
    form.append('file', new File([bytes], name, { type }));
    put = await fetch(payload[0].url, {
      method: 'PUT',
      body: form,
      headers: { 'x-uploadthing-version': '7.7.4' },
    });
  } else {
    // Le fetch d'Expo n'accepte ni Blob construit depuis des octets ni { uri } dans un FormData.
    const multipart = multipartBody(bytes, name, type);
    put = await fetch(payload[0].url, {
      method: 'PUT',
      body: multipart.body,
      headers: { 'x-uploadthing-version': '7.7.4', 'Content-Type': multipart.contentType },
    });
  }
  const uploaded = (await put.json().catch(() => null)) as { ufsUrl?: string; url?: string; error?: string; serverData?: { key?: string } } | null;
  const url = uploaded?.ufsUrl || uploaded?.url;
  if (!put.ok || !url) throw new Error(uploaded?.error || 'Envoi du document refusé.');
  return {
    url,
    publicId: uploaded?.serverData?.key || payload[0].key || url,
    mimeType: type,
    name,
  };
}

export async function uploadFileUri(
  uri: string,
  filename: string,
  mimeType: string,
  folder: UploadFolder
): Promise<UploadResult> {
  const base64 = await uriToBase64(uri);
  if (folder === 'kyc') return uploadDocFile('kycDocument', filename, mimeType, base64);
  if (folder === 'disputes') return uploadDocFile('disputeFile', filename, mimeType, base64);
  const pdf = asPdf(filename, mimeType, base64);
  return uploadBase64({
    base64,
    filename: pdf && !filename.toLowerCase().endsWith('.pdf') ? `${filename}.pdf` : filename,
    mimeType: pdf ? 'application/pdf' : mimeType,
    folder,
  });
}

export async function pickImages(options: { multiple?: boolean; camera?: boolean } = {}) {
  const permission = options.camera
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error(
      options.camera
        ? "Autorise l'accès à l'appareil photo dans les réglages."
        : "Autorise l'accès à tes photos dans les réglages."
    );
  }
  const config: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    quality: 0.7,
    base64: true,
    allowsMultipleSelection: !!options.multiple,
    selectionLimit: options.multiple ? 8 : 1,
  };
  const result = options.camera
    ? await ImagePicker.launchCameraAsync(config)
    : await ImagePicker.launchImageLibraryAsync(config);
  if (result.canceled) return [];
  return result.assets;
}

/** Images et PDF pour les pièces d’identité et les justificatifs KYC. */
export async function pickKycFiles(options: { multiple?: boolean } = {}) {
  const result = await DocumentPicker.getDocumentAsync({
    type: Platform.OS === 'web' ? 'image/*,application/pdf,.pdf' : ['image/*', 'application/pdf'],
    multiple: !!options.multiple,
    copyToCacheDirectory: Platform.OS === 'ios',
  });
  if (result.canceled) return [];
  return result.assets;
}

export async function uploadDocumentAsset(
  asset: { uri: string; name?: string | null; mimeType?: string | null },
  folder: 'kyc' | 'disputes' = 'kyc'
) {
  const filename = asset.name || `document-${Date.now()}`;
  const mimeType =
    asset.mimeType || (filename.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');
  return uploadFileUri(asset.uri, filename, mimeType, folder);
}

export async function uploadPickedImage(asset: ImagePicker.ImagePickerAsset, folder: UploadFolder) {
  const mimeType = asset.mimeType || 'image/jpeg';
  const filename = asset.fileName || `photo-${Date.now()}.${mimeType.split('/')[1] || 'jpg'}`;
  if (asset.base64) {
    return uploadBase64({ base64: asset.base64, filename, mimeType, folder });
  }
  return uploadFileUri(asset.uri, filename, mimeType, folder);
}
