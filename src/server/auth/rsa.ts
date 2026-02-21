import crypto from 'node:crypto';

let _privateKey: crypto.KeyObject | null = null;
let _publicKeyPem: string | null = null;

function getPrivateKey(): crypto.KeyObject {
  if (_privateKey) return _privateKey;

  const pem = process.env.RSA_PRIVATE_KEY;

  if (!pem) {
    throw new Error('RSA_PRIVATE_KEY environment variable is not configured');
  }

  _privateKey = crypto.createPrivateKey(pem.replace(/\\n/g, '\n'));
  return _privateKey;
}

export function getPublicKeyPem(): string {
  if (_publicKeyPem) return _publicKeyPem;

  _publicKeyPem = crypto
    .createPublicKey(getPrivateKey())
    .export({ type: 'spki', format: 'pem' }) as string;

  return _publicKeyPem;
}

export function decryptPassword(encryptedBase64: string): string {
  const privateKey = getPrivateKey();
  const buffer = Buffer.from(encryptedBase64, 'base64');

  const decrypted = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    },
    buffer
  );

  return decrypted.toString('utf8');
}
