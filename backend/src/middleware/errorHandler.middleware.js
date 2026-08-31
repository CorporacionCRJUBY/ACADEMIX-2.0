// FILE: backend/src/middleware/errorHandler.middleware.js
const logger = require('../utils/logger');

/**
 * Códigos de error por defecto según el status HTTP, usados cuando el
 * AppError no especifica un `code` explícito (ver utils/AppError.js).
 * Evita que errores esperados de negocio (404, 400, 409, etc.) se reporten
 * como `INTERNAL_ERROR` en logs y respuestas solo por no pasar el tercer
 * parámetro al lanzar el AppError.
 */
const DEFAULT_CODE_BY_STATUS = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'VALIDATION_ERROR',
};

/**
 * Middleware de manejo de errores central de Express
 * @param {Error} err - Error capturado
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next
 */
const errorHandler = (err, req, res, next) => {
  // Determinar código de error
  const status = err.status || err.statusCode || 500;
  const code = err.code || DEFAULT_CODE_BY_STATUS[status] || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred';

  // Loguear errores internos del servidor (status >= 500)
  if (status >= 500) {
    logger.error({
      message: `[${code}] ${message}`,
      stack: err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
      user: req.user?.id || 'anonymous',
    });
  } else {
    // Errores de cliente (400-499) se loguean como warning
    logger.warn({
      message: `[${code}] ${message}`,
      path: req.path,
      method: req.method,
      user: req.user?.id || 'anonymous',
    });
  }

  // Enviar respuesta al cliente
  res.status(status).json({
    success: false,
    code: code,
    message: message,
    // Incluir stack solo en desarrollo
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { errorHandler };