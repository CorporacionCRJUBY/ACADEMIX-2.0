// FILE: backend/src/services/audit.service.js
const AppError = require('../utils/AppError');
const repository = require('../repositories/audit.repository');

const AuditService = {
  async findAll(filters, user) {
    const { page = 1, pageSize = 20, search, userId, module, action, recordCode, dateFrom, dateTo } = filters;
    const queryFilters = { search, userId, module, action, recordCode, dateFrom, dateTo };
    const [data, total] = await Promise.all([
      repository.findAll({ ...queryFilters, page, pageSize }),
      repository.count(queryFilters),
    ]);
    return { data, total, page: Number(page), pageSize: Number(pageSize) };
  },

  async findById(id, user) {
    const record = await repository.findById(id);
    if (!record) throw new AppError('Audit record not found', 404);
    return record;
  },

  async findByRecordCode(recordCode, user) {
    return repository.findByRecordCode(recordCode);
  },

  async log({ user, action, module, recordCode, before, after, reason, req }) {
    const ip = req?.ip || req?.connection?.remoteAddress || null;
    const userAgent = req?.headers?.['user-agent'] || null;
    
    const beforeJson = before ? JSON.stringify(before) : null;
    const afterJson = after ? JSON.stringify(after) : null;
    
    return repository.create({
      // user_id NULL = acción del sistema (jobs programados); la columna es
      // nullable desde la migración 055.
      user_id: user?.id ?? null,
      action,
      module,
      record_code: recordCode,
      before: beforeJson,
      after: afterJson,
      reason: reason || null,
      ip,
      user_agent: userAgent
    });
  },

  async getHistory(recordCode) {
    return repository.findByRecordCode(recordCode);
  },

  async getActivityFeed(userId, limit = 20) {
    return repository.findByUser(userId, limit);
  }
};

module.exports = AuditService;