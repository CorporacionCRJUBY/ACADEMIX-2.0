// FILE: backend/src/services/calendar.service.js
const AppError = require('../utils/AppError');
const repository = require('../repositories/calendar.repository');
const { generateCode } = require('../utils/codeGenerator');
const auditService = require('./audit.service');
const { pick } = require('../utils/pick');

// FIX (auditoria hallazgo #5 - mass assignment): whitelist explícita de
// columnas reales de la tabla que el cliente puede escribir. Cualquier
// otro campo del body se ignora en vez de llegar crudo al INSERT/UPDATE.
const ALLOWED_FIELDS = ['branch_id', 'academic_year_id', 'date', 'title', 'description', 'event_type', 'is_holiday', 'is_working_day', 'status'];

const CalendarService = {
  async findAll(filters, user) {
    const { page = 1, pageSize = 20, search, year, month, branchId, academicYearId, eventType, status } = filters;
    const queryFilters = { search, year, month, branchId, academicYearId, eventType, status };
    const [data, total] = await Promise.all([
      repository.findAll({ ...queryFilters, page, pageSize }),
      repository.count(queryFilters),
    ]);
    return { data, total, page: Number(page), pageSize: Number(pageSize) };
  },

  async findById(id, user) {
    const record = await repository.findById(id);
    if (!record) throw new AppError('Calendar event not found', 404);
    return record;
  },

  async getByMonth(filters, user) {
    const { year, month, branchId, academicYearId, page = 1, pageSize = 20 } = filters;
    if (!year || !month) throw new AppError('Year and month are required', 400);
    // Bug fix: this previously ignored page/pageSize entirely and never
    // returned a total, so the list's pagination footer always showed
    // "0 results" even though rows for the month were being displayed.
    const [data, total] = await Promise.all([
      repository.findByMonth(year, month, branchId, academicYearId, page, pageSize),
      repository.countByMonth(year, month, branchId, academicYearId),
    ]);
    return { data, total, page: Number(page), pageSize: Number(pageSize) };
  },

  async create(payload, user) {
    const code = await generateCode('CAL');
    const data = {
      ...pick(payload, ALLOWED_FIELDS),
      code,
      status: payload.status || 'ACTIVE',
      created_by: user.id,
      updated_by: user.id
    };
    const [id] = await repository.create(data);
    const record = await repository.findById(id);
    
    await auditService.log({
      user,
      action: 'CREATE',
      module: 'calendar',
      recordCode: code,
      after: record,
      req: null
    });
    
    return record;
  },

  async update(id, payload, user) {
    const existing = await repository.findById(id);
    if (!existing) throw new AppError('Calendar event not found', 404);
    
    const before = { ...existing };
    await repository.update(id, { ...pick(payload, ALLOWED_FIELDS), updated_by: user.id });
    const after = await repository.findById(id);
    
    await auditService.log({
      user,
      action: 'UPDATE',
      module: 'calendar',
      recordCode: existing.code,
      before,
      after,
      req: null
    });
    
    return after;
  },

  async softDelete(id, user) {
    const existing = await repository.findById(id);
    if (!existing) throw new AppError('Calendar event not found', 404);
    
    await repository.softDelete(id, user.id);
    
    await auditService.log({
      user,
      action: 'DELETE',
      module: 'calendar',
      recordCode: existing.code,
      before: existing,
      req: null
    });
    
    return true;
  }
};

module.exports = CalendarService;
