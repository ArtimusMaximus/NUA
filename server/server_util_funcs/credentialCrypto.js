const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ALGORITHM = 'aes-256-gcm';
const KEY_ENV = 'CREDENTIAL_ENCRYPTION_KEY';
const KEY_FILE = path.join(process.cwd(), 'config', 'encryption.key');
const ENCRYPTED_PREFIX = 'ENC:';

// Cached in-process key (set by generateAndSaveKey or loaded lazily)
let _cachedKey = null;

function getKey() {
  if (_cachedKey) {
    return _cachedKey;
  }

  // 1. Environment variable takes priority
  const keyHex = process.env[KEY_ENV];
  if (keyHex) {
    if (keyHex.length !== 64) {
      throw new Error(`${KEY_ENV} must be a 64-character hex string (32 bytes).`);
    }
    _cachedKey = Buffer.from(keyHex, 'hex');
    return _cachedKey;
  }

  // 2. Key file
  try {
    const fileHex = fs.readFileSync(KEY_FILE, 'utf8').trim();
    if (fileHex.length === 64) {
      _cachedKey = Buffer.from(fileHex, 'hex');
      return _cachedKey;
    }
  } catch (_) {
    // File does not exist — encryption not yet enabled
  }

  return null; // Not enabled
}

/** Returns true if a key is available (env var or key file). */
function isEncryptionEnabled() {
  try {
    return getKey() !== null;
  } catch (_) {
    return false;
  }
}

/**
 * Generates a fresh 32-byte key, persists it to config/encryption.key
 * (mode 0o600), caches it and returns the hex string.
 */
function generateAndSaveKey() {
  const keyHex = crypto.randomBytes(32).toString('hex');
  const dir = path.dirname(KEY_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(KEY_FILE, keyHex, { encoding: 'utf8', mode: 0o600 });
  _cachedKey = Buffer.from(keyHex, 'hex');
  return keyHex;
}

/**
 * Encrypts a plaintext string. Returns the original string unchanged if
 * no key is configured (backward compatibility).
 */
function encrypt(plaintext) {
  if (!plaintext) {
    return plaintext;
  }
  const key = getKey();
  if (!key) {
    return plaintext; // Encryption not enabled — store as-is
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ENCRYPTED_PREFIX + Buffer.concat([iv, tag, encrypted]).toString('base64');
}

/**
 * Decrypts an encrypted string. Returns the value unchanged if it is not
 * prefixed with ENC: (supports existing plaintext values in the database).
 */
function decrypt(value) {
  if (!value || !value.startsWith(ENCRYPTED_PREFIX)) {
    return value;
  } // plaintext passthrough
  const key = getKey();
  if (!key) {
    throw new Error('A key is required to decrypt stored credentials. Enable encryption in Site Settings or set CREDENTIAL_ENCRYPTION_KEY.');
  }
  const buf = Buffer.from(value.slice(ENCRYPTED_PREFIX.length), 'base64');
  const iv = buf.slice(0, 12);
  const tag = buf.slice(12, 28);
  const encrypted = buf.slice(28);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final('utf8');
}

module.exports = { encrypt, decrypt, isEncryptionEnabled, generateAndSaveKey };
