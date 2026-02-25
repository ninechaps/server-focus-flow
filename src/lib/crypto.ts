import { apiClient } from '@/lib/api-client';
interface CachedKey {
  value: string;
  expiresAt: number;
}

const KEY_CACHE_TTL_MS = 60 * 60 * 1000;

let cachedPublicKey: CachedKey | null = null;

async function fetchPublicKey(): Promise<string> {
  if (cachedPublicKey && Date.now() < cachedPublicKey.expiresAt) {
    return cachedPublicKey.value;
  }

  const res = await apiClient('/api/auth/public-key');

  if (!res.ok) {
    throw new Error(`Failed to fetch public key: HTTP ${res.status}`);
  }

  const json = await res.json();

  if (!json.success) {
    throw new Error('Failed to fetch public key');
  }

  const key = json.data.publicKey as string;
  cachedPublicKey = { value: key, expiresAt: Date.now() + KEY_CACHE_TTL_MS };

  return key;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PUBLIC KEY-----/, '')
    .replace(/-----END PUBLIC KEY-----/, '')
    .replace(/\s/g, '');

  const binary = atob(b64);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0)).buffer;
}

export async function encryptPassword(password: string): Promise<string> {
  const publicKeyPem = await fetchPublicKey();
  const keyData = pemToArrayBuffer(publicKeyPem);

  const cryptoKey = await crypto.subtle.importKey(
    'spki',
    keyData,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  );

  const encoded = new TextEncoder().encode(password);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    cryptoKey,
    encoded
  );

  const bytes = new Uint8Array(encrypted);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}
