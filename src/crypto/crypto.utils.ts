import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/**
 * AES-256-GCM encryption for sensitive task fields (title, description).
 * The key is read lazily (at call time) so it's available after the app's
 * config/env is loaded. ENCRYPTION_KEY must be a 32-byte value, base64-encoded.
 */
function getKey(): Buffer {
  const k = process.env.ENCRYPTION_KEY;
  if (!k) throw new Error('ENCRYPTION_KEY is not set (need a 32-byte base64 key).');
  const buf = Buffer.from(k, 'base64');
  if (buf.length !== 32) throw new Error('ENCRYPTION_KEY must decode to 32 bytes.');
  return buf;
}

/** Encrypt on write. Returns "iv:tag:ciphertext" (all base64). */
export function encrypt(plain: string | null): string | null {
  if (plain == null) return plain;
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${tag.toString('base64')}:${ct.toString('base64')}`;
}

/** Decrypt on read. Plaintext/legacy values (not in iv:tag:ct form) pass through unchanged. */
export function decrypt(stored: string | null): string | null {
  if (stored == null) return stored;
  const parts = stored.split(':');
  if (parts.length !== 3) return stored; // legacy plaintext — leave as-is
  try {
    const [iv, tag, ct] = parts.map((s) => Buffer.from(s, 'base64'));
    const d = createDecipheriv('aes-256-gcm', getKey(), iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(ct), d.final()]).toString('utf8');
  } catch {
    return stored; // not our ciphertext — return as-is rather than crash
  }
}
