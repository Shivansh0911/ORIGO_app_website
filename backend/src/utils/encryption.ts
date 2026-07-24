import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function loadEncryptionKey(): Buffer {
  const raw = process.env['FIELD_ENCRYPTION_KEY'];
  if (!raw || !/^[0-9a-fA-F]{64}$/.test(raw)) {
    throw new Error('[startup] FIELD_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }
  return Buffer.from(raw, 'hex');
}

const KEY = loadEncryptionKey();

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(stored: string): string {
  const [ivHex, authTagHex, cipherHex] = stored.split(':');
  if (!ivHex || !authTagHex || !cipherHex) throw new Error('Invalid encrypted format');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const ciphertext = Buffer.from(cipherHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}
