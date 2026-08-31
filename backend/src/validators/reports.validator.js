// FILE: backend/src/validators/reports.validator.js
const { param, query } = require('express-validator');

const reportsValidators = {
  findById: [
    param('id').isInt().withMessage('ID must be an integer'),
  ],
  findAll: [
    query('search').optional().isString().withMessage('Search must be a string'),
    query('category').optional().isIn(['attendance', 'grades', 'progress-reports', 'report-cards', 'academic-history', 'transcripts', 'scholarships', 'graduation']).withMessage('Invalid category'),
    query('status').optional().isIn(['DRAFT', 'OFFICIAL', 'ARCHIVED', 'REPRINTED']).withMessage('Invalid status'),
    query('studentId').optional().isInt().withMessage('Student ID must be an integer'),
    query('academicPeriodId').optional().isInt().withMessage('Academic period ID must be an integer'),
    query('dateFrom').optional().isISO8601().withMessage('Date from must be a valid date'),
    query('dateTo').optional().isISO8601().withMessage('Date to must be a valid date'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('Page size must be between 1 and 100'),
  ],
};

module.exports = reportsValidators;