// FILE: backend/src/middleware/validate.middleware.js
const { validationResult } = require('express-validator');

/**
 * Middleware - revisa los resultados de las validaciones de express-validator
 * que se ejecutaron como middlewares previos en la cadena de rutas
 * (ej: router.post('/x', [body('email').isEmail()], validate, controller.x))
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next
 */
const validate = (req, res, next) => {
  // Obtener errores acumulados por las validaciones previas
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  // Formatear errores
  const formattedErrors = errors.array().map(err => ({
    field: err.path,
    message: err.msg,
    value: err.value,
  }));

  return res.status(422).json({
    success: false,
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    errors: formattedErrors,
  });
};

module.exports = { validate };