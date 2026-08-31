// FILE: backend/src/validators/audit.validator.js
const { param, query } = require('express-validator');

const auditValidators = {
  getByRecord: [
    param('code').isString().notEmpty().withMessage('Record code is required'),
  ],
  findAll: [
    query('userId').optional().isInt().withMessage('User ID must be an integer'),
    query('module').optional().isString().withMessage('Module must be a string'),
    query('action').optional().isString().withMessage('Action must be a string'),
    query('recordCode').optional().isString().withMessage('Record code must be a string'),
    query('dateFrom').optional().isISO8601().withMessage('Date from must be a valid date'),
    query('dateTo').optional().isISO8601().withMessage('Date to must be a valid date'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('Page size must be between 1 and 100'),
  ],
};

module.exports = auditValidators;