// FILE: backend/src/utils/twoFactor.js
// FIX (auditoria hallazgo bajo #2 - falta de 2FA): implementación TOTP
// (RFC 6238, sobre HOTP de RFC 4226) usando únicamente el módulo `crypto`
// nativo de Node — sin dependencias externas de terceros para la parte
// criptográfica, así queda una única superficie a auditar. Compatible con
// cualquier app autenticadora estándar (Google Authenticator, Authy, 1Password,
// Microsoft Authenticator, etc.), que todas implementan el mismo RFC.
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const TOTP_STEP_SECONDS = 30;
const TOTP_DIGITS = 6;
const TOTP_ALGORITHM = 'sha1'; // El estándar de facto para apps autenticadoras.
const BACKUP_CODE_COUNT = 10;
const BACKUP_CODE_SALT_ROUNDS = 10;

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Codifica un Buffer a Base32 (RFC 4648), el formato en el que las apps
 * autenticadoras esperan recibir el secreto (tanto por QR como a mano).
 */
function base32Encode(buffer) {
  let bits = '';
  for (const byte of buffer) {
    bits += byte.toString(2).padStart(8, '0');
  }
  let output = '';
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    output += BASE32_ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
  }
  const remainder = bits.length % 5;
  if (remainder > 0) {
    const lastChunk = bits.slice(bits.length - remainder).padEnd(5, '0');
    output += BASE32_ALPHABET[parseInt(lastChunk, 2)];
  }
  return output;
}

/**
 * Decodifica un secreto Base32 a Buffer para poder usarlo como clave HMAC.
 */
function base32Decode(base32) {
  const clean = base32.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (const char of clean) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) continue;
    bits += index.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

/**
 * Genera un secreto TOTP nuevo, aleatorio, de 160 bits (20 bytes) — el
 * tamaño recomendado por RFC 4226 para HMAC-SHA1.
 * @returns {string} Secreto en Base32.
 */
function generateSecret() {
  return base32Encode(crypto.randomBytes(20));
}

/**
 * Calcula el código TOTP de `digits` dígitos para un secreto y un instante
 * dado, siguiendo RFC 6238 (HOTP con contador = floor(unixTime / step)).
 * @param {string} base32Secret
 * @param {number} [forTimeMs] - Momento a evaluar (default: ahora).
 * @param {number} [step] - Ventana de tiempo en segundos (default: 30).
 */
function generateTOTP(base32Secret, forTimeMs = Date.now(), step = TOTP_STEP_SECONDS) {
  const key = base32Decode(base32Secret);
  const counter = Math.floor(forTimeMs / 1000 / step);

  const counterBuffer = Buffer.alloc(8);
  // Los contadores HOTP se codifican como un entero de 64 bits big-endian.
  counterBuffer.writeUInt32BE(Math.floor(counter / 2 ** 32), 0);
  counterBuffer.writeUInt32BE(counter % 2 ** 32, 4);

  const hmac = crypto.createHmac(TOTP_ALGORITHM, key).update(counterBuffer).digest();

  // Truncamiento dinámico (RFC 4226 §5.3).
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binCode =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const code = (binCode % 10 ** TOTP_DIGITS).toString().padStart(TOTP_DIGITS, '0');
  return code;
}

/**
 * Verifica un código TOTP ingresado por el usuario contra un secreto,
 * tolerando un pequeño desfase de reloj entre cliente y servidor (±1 paso
 * de 30s, es decir hasta 30s de diferencia en cada dirección — suficiente
 * para relojes ligeramente desincronizados, sin ampliar demasiado la
 * ventana de validez de cada código).
 * @param {string} base32Secret
 * @param {string} token - Código de 6 dígitos ingresado por el usuario.
 * @param {number} [windowSteps] - Pasos de tolerancia hacia atrás/adelante.
 */
function verifyTOTP(base32Secret, token, windowSteps = 1) {
  if (!token || !/^\d{6}$/.test(String(token).trim())) return false;
  const normalized = String(token).trim();
  const now = Date.now();

  for (let errorWindow = -windowSteps; errorWindow <= windowSteps; errorWindow++) {
    const candidate = generateTOTP(base32Secret, now + errorWindow * TOTP_STEP_SECONDS * 1000);
    // Comparación en tiempo constante para no filtrar por timing cuántos
    // dígitos del código coinciden.
    if (
      candidate.length === normalized.length &&
      crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(normalized))
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Construye la URI `otpauth://` estándar que las apps autenticadoras leen
 * desde el QR (o se puede pegar a mano) para registrar la cuenta.
 */
function buildOtpAuthUrl(secret, accountEmail, issuer = 'ACADEMIX') {
  const label = encodeURIComponent(`${issuer}:${accountEmail}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: String(TOTP_DIGITS),
    period: String(TOTP_STEP_SECONDS),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/**
 * Genera códigos de respaldo de un solo uso (formato XXXX-XXXX, alfabeto
 * sin caracteres ambiguos) para cuando el usuario pierde su app
 * autenticadora. Se devuelven en claro UNA sola vez al usuario; el
 * llamador debe guardar solo su hash (ver hashBackupCodes).
 * @param {number} [count]
 */
function generateBackupCodes(count = BACKUP_CODE_COUNT) {
  const alphabet = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'; // sin 0/O/1/I/L
  const codes = [];
  for (let i = 0; i < count; i++) {
    let code = '';
    for (let j = 0; j < 8; j++) {
      if (j === 4) code += '-';
      const idx = crypto.randomInt(0, alphabet.length);
      code += alphabet[idx];
    }
    codes.push(code);
  }
  return codes;
}

/**
 * Hashea una lista de códigos de respaldo en claro para almacenamiento
 * (nunca se guardan en texto plano en la base de datos).
 * @param {string[]} plainCodes
 * @returns {Promise<string[]>} Hashes bcrypt.
 */
async function hashBackupCodes(plainCodes) {
  return Promise.all(plainCodes.map((code) => bcrypt.hash(code, BACKUP_CODE_SALT_ROUNDS)));
}

/**
 * Verifica un código de respaldo ingresado contra la lista de hashes
 * almacenados. Devuelve el array de hashes SIN el que fue consumido (los
 * códigos de respaldo son de un solo uso), o `null` si ninguno coincide.
 * @param {string} inputCode
 * @param {string[]} storedHashes
 * @returns {Promise<string[]|null>}
 */
async function consumeBackupCode(inputCode, storedHashes) {
  if (!inputCode || !Array.isArray(storedHashes) || storedHashes.length === 0) return null;
  const normalized = String(inputCode).trim().toUpperCase();

  for (let i = 0; i < storedHashes.length; i++) {
    // eslint-disable-next-line no-await-in-loop
    const matches = await bcrypt.compare(normalized, storedHashes[i]);
    if (matches) {
      return [...storedHashes.slice(0, i), ...storedHashes.slice(i + 1)];
    }
  }
  return null;
}

module.exports = {
  TOTP_STEP_SECONDS,
  TOTP_DIGITS,
  generateSecret,
  generateTOTP,
  verifyTOTP,
  buildOtpAuthUrl,
  generateBackupCodes,
  hashBackupCodes,
  consumeBackupCode,
  base32Encode,
  base32Decode,
};
