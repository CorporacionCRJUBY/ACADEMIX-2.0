// FILE: backend/src/middleware/errorHandler.middleware.js
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

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
  // Restricciones UNIQUE de la base (migración 056 y existentes): traducir
  // el error crudo del driver a un 409 de negocio en vez de un 500 que
  // además revelaría SQL/internals.
  if (err.errno === 1062 || err.code === 'ER_DUP_ENTRY') {
    err = new AppError('A record with the same unique data already exists', 409, 'DUPLICATE_RECORD');
  }

  // Determinar código de error
  const status = err.status || err.statusCode || 500;
  const code = err.code || DEFAULT_CODE_BY_STATUS[status] || 'INTERNAL_ERROR';

  // SEGURIDAD (bajo B4): los mensajes crudos de errores 5xx inesperados
  // (SQL, driver, TypeError...) pueden revelar internals de la base de
  // datos o del servidor. Solo los AppError lanzados a propósito se
  // devuelven tal cual; el resto recibe un mensaje genérico. El detalle
  // real queda igualmente en los logs de abajo.
  const isOperational = err instanceof AppError;
  const message = (status >= 500 && !isOperational)
    ? 'An unexpected error occurred'
    : (err.message || 'An unexpected error occurred');

  // Loguear errores internos del servidor (status >= 500). A los logs va el
  // mensaje REAL aunque al cliente se le haya mandado el genérico.
  const logMessage = err.message || message;
  if (status >= 500) {
    logger.error({
      message: `[${code}] ${logMessage}`,
      stack: err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
      user: req.user?.id || 'anonymous',
    });
  } else {
    // Errores de cliente (400-499) se loguean como warning
    logger.warn({
      message: `[${code}] ${logMessage}`,
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