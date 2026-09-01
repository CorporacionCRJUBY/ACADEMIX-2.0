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
// FIX (segunda pasada, BAJO #9): los valores fallidos se eco-envían en el
// body 422; para campos sensibles (contraseñas, códigos 2FA) eso las deja
// en logs de proxies y devtools. Se sustituyen por un marcador.
const SENSITIVE_FIELDS = [
  'password', 'newPassword', 'currentPassword', 'password_confirmation',
  'code', 'challengeToken'
];

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
    value: SENSITIVE_FIELDS.includes(err.path) ? '[REDACTED]' : err.value,
  }));

  return res.status(422).json({
    success: false,
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    errors: formattedErrors,
  });
};

module.exports = { validate };