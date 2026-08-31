// FILE: backend/src/repositories/studentStatusHistory.repository.js
const StudentStatusHistoryModel = require('../models/studentStatusHistory.model');

const StudentStatusHistoryRepository = {
  findByStudent: (studentId) => StudentStatusHistoryModel.findByStudent(studentId),
  create: (data) => StudentStatusHistoryModel.create(data),
};

module.exports = StudentStatusHistoryRepository;
