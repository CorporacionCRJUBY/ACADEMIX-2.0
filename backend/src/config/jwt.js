// FILE: backend/src/config/jwt.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('./env');

// FIX (auditoria hallazgo alto #5 - el logout no invalida tokens): un JWT
// firmado es válido en cualquier lugar hasta que expira; la única manera de
// revocar uno puntual antes de eso es tener un identificador propio del
// token (jti) que se pueda meter en una lista de exclusión (ver
// repositories/revokedTokens.repository.js) y consultar en cada request.
// Antes ningún token llevaba jti, así que no había nada que revocar.
const sign = (payload, expiresIn = config.JWT_EXPIRES_IN) => {
  // FIX (auditoria hallazgo bajo #2 - 2FA): se agrega `type: 'access'` al
  // payload. Antes, un token cualquiera firmado con JWT_SECRET era válido
  // en cualquier endpoint que esperara un access token; a partir de ahora
  // que también existen tokens de "desafío 2FA" (ver signTwoFactorChallenge
  // más abajo), es importante que un desafío 2FA nunca pueda colarse como
  // si fuera una sesión real, ni viceversa. `verify()` rechaza cualquier
  // token cuyo `type` no sea exactamente 'access'.
  return jwt.sign({ ...payload, type: 'access', jti: crypto.randomUUID() }, config.JWT_SECRET, { expiresIn });
};

/**
 * Verifica un token de acceso
 * @param {string} token
 * @returns {Object} Payload decodificado
 * @throws {JsonWebTokenError} Si el token es inválido, expiró, o no es del tipo esperado
 */
const verify = (token) => {
  const decoded = jwt.verify(token, config.JWT_SECRET);
  if (decoded.type !== 'access') {
    const err = new Error('Invalid token type');
    err.name = 'JsonWebTokenError';
    throw err;
  }
  return decoded;
};

/**
 * Firma un refresh token (mayor duración: 7 días)
 * @param {Object} payload - Datos a incluir (normalmente { userId, role })
 * @returns {string} Refresh token firmado
 */
const signRefresh = (payload) => {
  return jwt.sign({ ...payload, type: 'refresh', jti: crypto.randomUUID() }, config.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

/**
 * Verifica un refresh token
 * @param {string} token
 * @returns {Object} Payload decodificado
 * @throws {JsonWebTokenError} Si el token es inválido, expiró, o no es del tipo esperado
 */
const verifyRefresh = (token) => {
  const decoded = jwt.verify(token, config.JWT_REFRESH_SECRET);
  if (decoded.type !== 'refresh') {
    const err = new Error('Invalid token type');
    err.name = 'JsonWebTokenError';
    throw err;
  }
  return decoded;
};

// FIX (auditoria hallazgo bajo #2 - falta de 2FA): token de "desafío"
// intermedio, de vida muy corta (5 minutos), que se emite tras validar
// email+password de una cuenta con 2FA activo, ANTES de otorgar una sesión
// real. No lleva roles/permisos ni sirve para autenticar peticiones a la
// API — solo es canjeable, una vez, en POST /auth/2fa/verify, junto con un
// código TOTP o de respaldo válido. Se firma con JWT_SECRET pero con
// `type: '2fa_challenge'`, así que aunque un atacante lo capturara no
// podría usarlo como si fuera un access token (verify() lo rechazaría).
const signTwoFactorChallenge = (payload) => {
  return jwt.sign({ ...payload, type: '2fa_challenge', jti: crypto.randomUUID() }, config.JWT_SECRET, { expiresIn: '5m' });
};

const verifyTwoFactorChallenge = (token) => {
  const decoded = jwt.verify(token, config.JWT_SECRET);
  if (decoded.type !== '2fa_challenge') {
    const err = new Error('Invalid token type');
    err.name = 'JsonWebTokenError';
    throw err;
  }
  return decoded;
};

module.exports = {
  sign,
  verify,
  signRefresh,
  verifyRefresh,
  signTwoFactorChallenge,
  verifyTwoFactorChallenge,
};