// FILE: backend/src/middleware/authRateLimit.middleware.js
// FIX (auditoria hallazgo medio #3 - sin rate-limiting específico en el
// endpoint de login): el rate limiter global (middleware/rateLimit.middleware.js)
// permite 300 peticiones/15min por IP, un umbral pensado para uso normal de
// toda la API, no para proteger un endpoint de autenticación. Con ese único
// límite, un atacante puede hacer cientos de intentos de login por IP en la
// misma ventana — suficiente para enumerar usuarios existentes (por la
// diferencia de respuesta/tiempo entre "no existe" y "contraseña
// incorrecta") o para probar contraseñas comunes contra muchas cuentas
// distintas (credential stuffing / password spraying) sin disparar nunca el
// bloqueo por cuenta de `usersRepository.registerFailedLogin`, que solo
// cuenta intentos fallidos por *usuario*, no por IP.
//
// Este limiter es más estricto y específico: 10 intentos cada 15 minutos
// por IP contra /api/auth/login. No cuenta los logins exitosos
// (`skipSuccessfulRequests`) para no penalizar a un usuario legítimo que
// tras loguearse sigue generando tráfico desde la misma IP/NAT.
const rateLimit = require('express-rate-limit');

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // intentos por IP en la ventana
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    code: 'LOGIN_RATE_LIMIT_EXCEEDED',
    message: 'Too many login attempts from this IP. Please try again later.',
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      code: 'LOGIN_RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts from this IP. Please try again later.',
    });
  },
});

// SEGURIDAD (bajo B8): el refresh tampoco tenía límite propio. Con un
// refresh token robado no debería poder martillarse el endpoint (rotación
// masiva, sondeo de jti). Un cliente legítimo refresca como mucho una vez
// por ciclo de expiración del access token, así que 30/15min por IP es
// holgado para uso real y estrecho para abuso.
const refreshRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30, // peticiones por IP en la ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'REFRESH_RATE_LIMIT_EXCEEDED',
    message: 'Too many refresh attempts from this IP. Please try again later.',
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      code: 'REFRESH_RATE_LIMIT_EXCEEDED',
      message: 'Too many refresh attempts from this IP. Please try again later.',
    });
  },
});

module.exports = { loginRateLimiter, refreshRateLimiter };
