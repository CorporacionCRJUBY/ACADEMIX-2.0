// FILE: backend/src/controllers/users.controller.js
const usersService = require('../services/users.service');

const findAll = async (req, res, next) => {
  try {
    const { page, pageSize, search, email, fullName, roleId, branchId, status } = req.query;
    const result = await usersService.findAll(
      { page, pageSize, search, email, fullName, roleId, branchId, status },
      req.user
    );
    res.json({ success: true, data: result.data, total: result.total, page: result.page, pageSize: result.pageSize });
  } catch (error) {
    next(error);
  }
};

const findById = async (req, res, next) => {
  try {
    const data = await usersService.findById(req.params.id, req.user);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const data = await usersService.create(req.body, req.user);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const data = await usersService.update(req.params.id, req.body, req.user);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const softDelete = async (req, res, next) => {
  try {
    await usersService.softDelete(req.params.id, req.user);
    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const data = await usersService.changePassword(
      req.params.id,
      currentPassword,
      newPassword,
      req.user
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const assignRoles = async (req, res, next) => {
  try {
    const { roleIds } = req.body;
    const data = await usersService.assignRoles(req.params.id, roleIds, req.user);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getRoles = async (req, res, next) => {
  try {
    const data = await usersService.getRoles(req.params.id, req.user);
    res.json({ success: true, data });
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
  changePassword,
  assignRoles,
  getRoles,
};