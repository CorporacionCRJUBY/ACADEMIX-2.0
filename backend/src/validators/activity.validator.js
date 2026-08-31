// FILE: backend/src/validators/activity.validator.js
const { param, query } = require('express-validator');

const activityValidators = {
  getByUser: [
    param('userId').isInt().withMessage('User ID must be an integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  findAll: [
    query('module').optional().isString().withMessage('Module must be a string'),
    query('action').optional().isString().withMessage('Action must be a string'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('Page size must be between 1 and 100'),
  ],
};

module.exports = activityValidators;