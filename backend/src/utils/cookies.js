// FILE: backend/src/utils/cookies.js
// FIX (auditoria hallazgo medio #2 - JWT en localStorage): antes login/
// refresh devolvían accessToken/refreshToken en el body JSON y el frontend
// los guardaba en localStorage (ver frontend/src/context/AuthContext.jsx y
// frontend/src/api/axiosClient.js), donde cualquier script inyectado por un
// XSS puede leerlos con `localStorage.getItem(...)` y robarlos. Ahora los
// tokens se envían exclusivamente como cookies httpOnly: JavaScript no
// puede leerlas (`document.cookie` no las lista), así que un XSS ya no
// puede exfiltrarlas.
//
// - httpOnly: inaccesible desde JS (mitiga robo por XSS).
// - secure: en producción, la cookie solo viaja por HTTPS.
// - sameSite: 'strict' es la defensa principal contra CSRF ahora que el
//   token viaja automáticamente con la cookie en vez de tener que ponerlo
//   a mano en el header Authorization (que por diseño no sufre CSRF). Con
//   'strict' el navegador no envía la cookie en navegaciones cross-site,
//   lo cual es aceptable aquí porque Academix no depende de flujos
//   cross-site (SSO externo, enlaces desde otro dominio, etc.).
// - El refresh token se restringe con `path: '/api/auth'`: ningún otro
//   endpoint de la API necesita verlo, así que no se envía en cada
//   petición (reduce superficie de exposición del token de vida más larga).
const config = require('../config/env');
const ms = require('ms');

const isProd = config.NODE_ENV === 'production';

const ACCESS_TOKEN_COOKIE = 'accessToken';
const REFRESH_TOKEN_COOKIE = 'refreshToken';

// Mismos tiempos de vida que los JWT reales (config/jwt.js): el access
// token usa JWT_EXPIRES_IN y el refresh token siempre se firma con '7d'
// (hardcodeado en jwt.signRefresh). Si la cookie expirara antes que el
// token, el navegador dejaría de enviarlo aunque siguiera siendo válido;
// si expirara después, quedaría una cookie inútil con un token ya vencido.
const ACCESS_TOKEN_MAX_AGE_MS = ms(config.JWT_EXPIRES_IN);
const REFRESH_TOKEN_MAX_AGE_MS = ms('7d');

const baseCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'strict',
  path: '/',
};

const refreshCookieOptions = {
  ...baseCookieOptions,
  path: '/api/auth',
};

/**
 * Setea las cookies httpOnly de acceso/refresh en la respuesta.
 * @param {import('express').Response} res
 * @param {{ accessToken: string, refreshToken?: string }} tokens
 */
const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    ...baseCookieOptions,
    maxAge: ACCESS_TOKEN_MAX_AGE_MS,
  });

  if (refreshToken) {
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      ...refreshCookieOptions,
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    });
  }
};

/**
 * Limpia ambas cookies (logout, o cuando el refresh falla).
 * @param {import('express').Response} res
 */
const clearAuthCookies = (res) => {
  res.clearCookie(ACCESS_TOKEN_COOKIE, baseCookieOptions);
  res.clearCookie(REFRESH_TOKEN_COOKIE, refreshCookieOptions);
};

module.exports = {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  setAuthCookies,
  clearAuthCookies,
};
