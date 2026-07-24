import crypto from 'crypto';

// SEC-03: deterministic HMAC-SHA256 blind index for encrypted-field dedup lookups.
// BLIND_INDEX_KEY must be a 64-hex-char secret (32 bytes), separate from FIELD_ENCRYPTION_KEY.
// Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
function loadBlindKey(): Buffer {
  const raw = process.env['BLIND_INDEX_KEY'];
  if (!raw || !/^[0-9a-fA-F]{64}$/.test(raw)) {
    throw new Error('[startup] BLIND_INDEX_KEY must be a 64-character hex string (32 bytes)');
  }
  return Buffer.from(raw, 'hex');
}

const BLIND_KEY = loadBlindKey();

export function hashForIndex(value: string): string {
  return crypto.createHmac('sha256', BLIND_KEY).update(value.toLowerCase().trim()).digest('hex');
}
