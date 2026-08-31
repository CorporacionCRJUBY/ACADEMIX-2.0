// FILE: backend/src/models/studentStatusHistory.model.js
const db = require('../config/database');

const TABLE = 'student_status_history';
const FIELDS = [
  'id', 'student_id', 'from_status', 'to_status', 'reason',
  'observation', 'changed_by', 'created_at'
];

const StudentStatusHistory = {
  TABLE,
  FIELDS,

  findByStudent(studentId) {
    return db(TABLE)
      .leftJoin('users', 'student_status_history.changed_by', 'users.id')
      .where('student_status_history.student_id', studentId)
      .select(
        'student_status_history.*',
        'users.full_name as changed_by_name'
      )
      .orderBy('student_status_history.created_at', 'desc');
  },

  create(data) {
    return db(TABLE).insert(data);
  },
};

module.exports = StudentStatusHistory;
