// FILE: backend/src/utils/cryptoBox.js
// SEGURIDAD (hardening 2026-08-31): cifrado en reposo de secretos
// sensibles (secretos TOTP del 2FA) con AES-256-GCM (autenticado: detecta
// cualquier manipulación del ciphertext). La clave maestra sale de
// ENCRYPTION_KEY (obligatoria en producción, ver config/env.js).
//
// Formato almacenado: enc:v1:<iv hex>:<authTag hex>:<ciphertext hex>
// El prefijo permite distinguir valores cifrados de texto plano legacy
// (bases creadas antes de este hardening), que se siguen aceptando en la
// lectura y se recifran de forma transparente en el primer uso (lazy
// migration, ver auth.service.js#verifyTwoFactor).
const crypto = require('crypto');
const config = require('../config/env');

const ALGORITHM = 'aes-256-gcm';
const PREFIX = 'enc:v1:';
const IV_BYTES = 12; // Tamaño recomendado para GCM (NIST SP 800-38D).

// Normaliza la clave maestra (longitud arbitraria) a 32 bytes. El material
// de partida ya es un secreto de alta entropía, no una contraseña humana.
const getKey = () =>
  crypto.createHash('sha256').update(String(config.ENCRYPTION_KEY)).digest();

/**
 * Cifra un valor. Devuelve null si el valor es null/undefined.
 * @param {string} plaintext
 * @returns {string|null} Valor cifrado con prefijo `enc:v1:`.
 */
function encrypt(plaintext) {
  if (plaintext === null || plaintext === undefined) return null;
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext.toString('hex')}`;
}

/**
 * Descifra un valor almacenado. Si no lleva el prefijo `enc:v1:` se
 * devuelve tal cual (compatibilidad con texto plano legacy).
 * @param {string|null} stored
 * @returns {string|null}
 */
function decrypt(stored) {
  if (stored === null || stored === undefined) return null;
  if (!isEncrypted(stored)) return stored;

  const [ivHex, authTagHex, ciphertextHex] = String(stored).slice(PREFIX.length).split(':');
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, 'hex')),
    decipher.final(), // Lanza si el authTag no valida (dato manipulado o clave incorrecta).
  ]);
  return plaintext.toString('utf8');
}

/**
 * Indica si un valor almacenado ya está cifrado.
 * @param {*} stored
 * @returns {boolean}
 */
function isEncrypted(stored) {
  return typeof stored === 'string' && stored.startsWith(PREFIX);
}

module.exports = { encrypt, decrypt, isEncrypted };
