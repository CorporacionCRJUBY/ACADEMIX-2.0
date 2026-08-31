// FILE: backend/src/validators/auth.validator.js
const { body } = require('express-validator');
const passwordPolicy = require('../utils/passwordPolicy');

const authValidators = {
  login: [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  refresh: [
    // FIX (auditoria hallazgo medio #2 - JWT en localStorage): el refresh
    // token ya no viaja en el body, sino en una cookie httpOnly (ver
    // controllers/auth.controller.js + utils/cookies.js), así que ya no
    // hay nada que validar aquí; el controlador responde 401 si la cookie
    // no viene.
  ],
  register: [
    body('email').isEmail().withMessage('Valid email is required'),
    // FIX (auditoria hallazgo medio #1 - política de contraseñas débil):
    // antes solo se exigía longitud mínima de 8, sin complejidad.
    body('password')
      .custom(passwordPolicy.isStrongPassword)
      .withMessage(passwordPolicy.STRONG_PASSWORD_MESSAGE),
    body('full_name').notEmpty().withMessage('Full name is required'),
    body('phone').optional().isString().withMessage('Phone must be a string'),
  ],
};

module.exports = authValidators;