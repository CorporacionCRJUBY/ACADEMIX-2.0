// FILE: backend/src/validators/attendance.validator.js
const { body, param, query } = require('express-validator');

const VALID_STATUSES = ['P', 'O', 'E', 'U'];
const STATUS_MSG = 'Status must be P (Present), O (Online), E (Excused), or U (Unexcused)';

const attendanceValidators = {
  create: [
    body('assignment_id').isInt().withMessage('Assignment ID must be an integer'),
    body('student_id').isInt().withMessage('Student ID must be an integer'),
    body('date').isISO8601().withMessage('Date must be a valid date'),
    body('status').isIn(VALID_STATUSES).withMessage(STATUS_MSG),
    body('check_in_time').optional().isString().withMessage('Check in time must be a string'),
    body('check_out_time').optional().isString().withMessage('Check out time must be a string'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
  ],
  saveDaily: [
    body('assignment_id').isInt().withMessage('Assignment ID must be an integer'),
    body('date').isISO8601().withMessage('Date must be a valid date'),
    body('records').isArray().withMessage('Records must be an array'),
    body('records.*.student_id').isInt().withMessage('Each record must have a student ID'),
    body('records.*.status').isIn(VALID_STATUSES).withMessage(STATUS_MSG),
    body('records.*.check_in_time').optional().isString().withMessage('Check in time must be a string'),
    body('records.*.check_out_time').optional().isString().withMessage('Check out time must be a string'),
    body('records.*.notes').optional().isString().withMessage('Notes must be a string'),
  ],
  update: [
    param('id').isInt().withMessage('ID must be an integer'),
    body('status').optional().isIn(VALID_STATUSES).withMessage(STATUS_MSG),
    body('check_in_time').optional().isString().withMessage('Check in time must be a string'),
    body('check_out_time').optional().isString().withMessage('Check out time must be a string'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
  ],
  getMonthlyGrid: [
    param('assignmentId').isInt().withMessage('Assignment ID must be an integer'),
    param('year').isInt({ min: 2000, max: 2100 }).withMessage('Year must be a valid year'),
    param('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  ],
  findById: [
    param('id').isInt().withMessage('ID must be an integer'),
  ],
  softDelete: [
    param('id').isInt().withMessage('ID must be an integer'),
  ],
  findAll: [
    query('assignmentId').optional().isInt().withMessage('Assignment ID must be an integer'),
    query('studentId').optional().isInt().withMessage('Student ID must be an integer'),
    query('dateFrom').optional().isISO8601().withMessage('Date from must be a valid date'),
    query('dateTo').optional().isISO8601().withMessage('Date to must be a valid date'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('Page size must be between 1 and 100'),
  ],
};

module.exports = attendanceValidators;
