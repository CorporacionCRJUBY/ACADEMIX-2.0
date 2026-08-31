// FILE: backend/src/utils/AppError.js

/**
 * Error de aplicación con código de estado HTTP asociado.
 * Permite que errorHandler.middleware.js devuelva el status correcto
 * (404, 401, 403, 409, 400) en lugar de 500 para errores de negocio esperados.
 */
class AppError extends Error {
  constructor(message, status = 500, code = null) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code || undefined;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
