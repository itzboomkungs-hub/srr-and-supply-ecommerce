import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'node:crypto';

function decodeKey(raw) {
  const value = String(raw || '').trim();
  if (!value) {
    throw new Error('SRR_SETTINGS_ENCRYPTION_KEY is required');
  }

  if (/^[a-fA-F0-9]{64}$/.test(value)) {
    return Buffer.from(value, 'hex');
  }

  try {
    const base64 = Buffer.from(value, 'base64');
    if (base64.length === 32) return base64;
  } catch {
    // continue
  }

  const utf8 = Buffer.from(value, 'utf8');
  if (utf8.length === 32) return utf8;

  throw new Error(
    'SRR_SETTINGS_ENCRYPTION_KEY must be 32 bytes (base64, 64-char hex, or 32-byte UTF-8)'
  );
}

function getKey() {
  return decodeKey(process.env.SRR_SETTINGS_ENCRYPTION_KEY);
}

export function encryptSettingSecret(value) {
  const plaintext = String(value ?? '');
  if (!plaintext) return '';

  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    'v1',
    iv.toString('base64url'),
    tag.toString('base64url'),
    encrypted.toString('base64url'),
  ].join('.');
}

export function decryptSettingSecret(payload) {
  const value = String(payload ?? '');
  if (!value) return '';

  const [version, ivPart, tagPart, cipherPart] = value.split('.');
  if (version !== 'v1' || !ivPart || !tagPart || !cipherPart) {
    throw new Error('Encrypted setting payload is invalid');
  }

  const key = getKey();
  const decipher = createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(ivPart, 'base64url')
  );
  decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(cipherPart, 'base64url')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}
