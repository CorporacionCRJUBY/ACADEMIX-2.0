// FILE: backend/src/validators/users.validator.js
const { body, param, query } = require('express-validator');
const passwordPolicy = require('../utils/passwordPolicy');

const usersValidators = {
  create: [
    body('email').isEmail().withMessage('Valid email is required'),
    // FIX (auditoria hallazgo medio #1 - política de contraseñas débil):
    // antes solo se exigía `isLength({ min: 8 })`, sin exigir mayúscula,
    // minúscula, número ni símbolo (ver utils/passwordPolicy.js).
    body('password')
      .custom(passwordPolicy.isStrongPassword)
      .withMessage(passwordPolicy.STRONG_PASSWORD_MESSAGE),
    body('full_name').isString().notEmpty().withMessage('Full name is required'),
    body('phone').optional().isString().withMessage('Phone must be a string'),
    body('role_id').optional().isInt().withMessage('Role ID must be an integer'),
    body('branch_id').optional().isInt().withMessage('Branch ID must be an integer'),
    body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED']).withMessage('Invalid status'),
  ],
  update: [
    param('id').isInt().withMessage('ID must be an integer'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    // FIX (segunda pasada de auditoría, MEDIO #3): PUT /users/:id puede
    // cambiar la contraseña, así que exige la misma política que create/
    // changePassword (antes por esta vía se podía fijar una contraseña débil).
    body('password')
      .optional()
      .custom(passwordPolicy.isStrongPassword)
      .withMessage(passwordPolicy.STRONG_PASSWORD_MESSAGE),
    body('full_name').optional().isString().notEmpty().withMessage('Full name must be a non-empty string'),
    body('phone').optional().isString().withMessage('Phone must be a string'),
    body('role_id').optional().isInt().withMessage('Role ID must be an integer'),
    body('branch_id').optional().isInt().withMessage('Branch ID must be an integer'),
    body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED']).withMessage('Invalid status'),
  ],
  changePassword: [
    param('id').isInt().withMessage('ID must be an integer'),
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    // FIX (auditoria hallazgo medio #1 - política de contraseñas débil):
    // misma regla que en `create`, para que un cambio de contraseña no
    // pueda debilitar una cuenta por debajo del estándar exigido al alta.
    body('newPassword')
      .custom(passwordPolicy.isStrongPassword)
      .withMessage(passwordPolicy.STRONG_PASSWORD_MESSAGE),
  ],
  assignRoles: [
    param('id').isInt().withMessage('ID must be an integer'),
    body('roleIds').isArray().withMessage('Role IDs must be an array'),
    body('roleIds.*').isInt().withMessage('Each role ID must be an integer'),
  ],
  findById: [
    param('id').isInt().withMessage('ID must be an integer'),
  ],
  softDelete: [
    param('id').isInt().withMessage('ID must be an integer'),
  ],
  findAll: [
    query('search').optional().isString().withMessage('Search must be a string'),
    query('email').optional().isString().withMessage('Email must be a string'),
    query('fullName').optional().isString().withMessage('Full name must be a string'),
    query('roleId').optional().isInt().withMessage('Role ID must be an integer'),
    query('branchId').optional().isInt().withMessage('Branch ID must be an integer'),
    query('status').optional().isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED']).withMessage('Invalid status'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('Page size must be between 1 and 100'),
  ],
};

module.exports = usersValidators;