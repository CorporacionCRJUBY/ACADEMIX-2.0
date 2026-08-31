// FILE: backend/src/controllers/academicYears.controller.js
const academicYearsService = require('../services/academicYears.service');

const findAll = async (req, res, next) => {
  try {
    const { page, pageSize, status, search } = req.query;
    const result = await academicYearsService.findAll(
      { page, pageSize, status, search },
      req.user
    );
    res.json({ success: true, data: result.data, total: result.total, page: result.page, pageSize: result.pageSize });
  } catch (error) {
    next(error);
  }
};

const findById = async (req, res, next) => {
  try {
    const data = await academicYearsService.findById(req.params.id, req.user);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const data = await academicYearsService.create(req.body, req.user);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const data = await academicYearsService.update(req.params.id, req.body, req.user);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const softDelete = async (req, res, next) => {
  try {
    await academicYearsService.softDelete(req.params.id, req.user);
    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  softDelete,
};