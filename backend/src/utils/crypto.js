// src/utils/crypto.js — Phase 13: encrypt secrets (SMTP password) at rest
//
// Uses AES-256-GCM. Key comes from SETTINGS_ENCRYPTION_KEY (32-byte value,
// hex or any string — we hash it to 32 bytes either way so operators don't
// have to generate a perfectly-formatted key). Falls back to deriving a
// key from JWT_SECRET with a loud warning if it's not set, so this never
// hard-crashes a deployment that hasn't set it yet — but that fallback is
// NOT a substitute for setting a real, dedicated key in production.
const crypto = require('crypto');

function getKey() {
  const raw = process.env.SETTINGS_ENCRYPTION_KEY;
  if (!raw) {
    console.warn(
      '[settings-crypto] SETTINGS_ENCRYPTION_KEY is not set — falling back to ' +
      'deriving a key from JWT_SECRET. Set SETTINGS_ENCRYPTION_KEY explicitly ' +
      'in production so rotating JWT_SECRET does not also break decryption ' +
      'of stored secrets like the SMTP password.'
    );
    return crypto.createHash('sha256').update(String(process.env.JWT_SECRET || 'insecure-fallback')).digest();
  }
  return crypto.createHash('sha256').update(raw).digest();
}

function encrypt(plaintext) {
  if (plaintext === null || plaintext === undefined || plaintext === '') return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':');
}

function decrypt(payload) {
  if (!payload) return null;
  try {
    const [ivHex, tagHex, dataHex] = payload.split(':');
    const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    console.error('[settings-crypto] Failed to decrypt stored value:', err.message);
    return null;
  }
}

module.exports = { encrypt, decrypt };
