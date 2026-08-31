// FILE: backend/src/middleware/rateLimit.middleware.js
const rateLimit = require('express-rate-limit');

/**
 * Rate limiter - 300 peticiones cada 15 minutos por IP
 * Headers estándar X-RateLimit-* incluídos por defecto
 */
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300, // límite por IP
  standardHeaders: true, // Retorna headers X-RateLimit-*
  legacyHeaders: false, // Desactiva headers antiguos X-RateLimit-*
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests, please try again later.',
  },
  // Handler personalizado (opcional)
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
    });
  },
});

module.exports = { rateLimiter };