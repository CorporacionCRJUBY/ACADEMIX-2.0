// FILE: backend/src/validators/academicHistory.validator.js
const { body, param, query } = require('express-validator');

const academicHistoryValidators = {
  create: [
    body('student_id').isInt().withMessage('Student ID must be an integer'),
    body('academic_period_id').isInt().withMessage('Academic period ID must be an integer'),
    body('academic_year_id').isInt().withMessage('Academic year ID must be an integer'),
    body('subject_id').isInt().withMessage('Subject ID must be an integer'),
    body('grade_value').isFloat({ min: 0, max: 100 }).withMessage('Grade value must be between 0 and 100'),
    body('status').optional().isString().withMessage('Status must be a string'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
  ],
  update: [
    param('id').isInt().withMessage('ID must be an integer'),
    body('grade_value').optional().isFloat({ min: 0, max: 100 }).withMessage('Grade value must be between 0 and 100'),
    body('status').optional().isString().withMessage('Status must be a string'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
  ],
  softDelete: [
    param('id').isInt().withMessage('ID must be an integer'),
  ],
  findById: [
    param('id').isInt().withMessage('ID must be an integer'),
  ],
  getByStudent: [
    param('studentId').isInt().withMessage('Student ID must be an integer'),
  ],
  findAll: [
    query('search').optional().isString().withMessage('Search must be a string'),
    query('studentId').optional().isInt().withMessage('Student ID must be an integer'),
    query('academicYearId').optional().isInt().withMessage('Academic year ID must be an integer'),
    query('periodId').optional().isInt().withMessage('Period ID must be an integer'),
    query('status').optional().isIn(['DRAFT', 'PUBLISHED', 'LOCKED']).withMessage('Invalid status'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('Page size must be between 1 and 100'),
  ],
};

module.exports = academicHistoryValidators;