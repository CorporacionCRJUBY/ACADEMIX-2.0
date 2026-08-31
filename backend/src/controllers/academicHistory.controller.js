// FILE: backend/src/controllers/academicHistory.controller.js
const academicHistoryService = require('../services/academicHistory.service');

const findAll = async (req, res, next) => {
  try {
    const { page, pageSize, search, studentId, academicYearId, periodId, status } = req.query;
    const result = await academicHistoryService.findAll(
      { page, pageSize, search, studentId, academicYearId, periodId, status },
      req.user
    );
    res.json({ success: true, data: result.data, total: result.total, page: result.page, pageSize: result.pageSize });
  } catch (error) {
    next(error);
  }
};

const findById = async (req, res, next) => {
  try {
    const data = await academicHistoryService.findById(req.params.id, req.user);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getByStudent = async (req, res, next) => {
  try {
    const data = await academicHistoryService.findByStudent(req.params.studentId, req.user);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const data = await academicHistoryService.create(req.body, req.user);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const data = await academicHistoryService.update(req.params.id, req.body, req.user);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const softDelete = async (req, res, next) => {
  try {
    await academicHistoryService.softDelete(req.params.id, req.user);
    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  findAll,
  findById,
  getByStudent,
  create,
  update,
  softDelete,
};
