// FILE: backend/src/services/academicYears.service.js
const AppError = require('../utils/AppError');
const repository = require('../repositories/academicYears.repository');
const { generateCode } = require('../utils/codeGenerator');
const auditService = require('./audit.service');
const { pick } = require('../utils/pick');

// FIX (auditoria hallazgo #5 - mass assignment): whitelist explícita de
// columnas reales de la tabla que el cliente puede escribir. Cualquier
// otro campo del body se ignora en vez de llegar crudo al INSERT/UPDATE.
const ALLOWED_FIELDS = ['name', 'start_date', 'end_date', 'status', 'is_active'];

const AcademicYearsService = {
  async findAll(filters, user) {
    const { page = 1, pageSize = 20, status, search } = filters;
    const queryFilters = { status, search };
    const [data, total] = await Promise.all([
      repository.findAll({ ...queryFilters, page, pageSize }),
      repository.count(queryFilters),
    ]);
    return { data, total, page: Number(page), pageSize: Number(pageSize) };
  },

  async findById(id, user) {
    const record = await repository.findById(id);
    if (!record) throw new AppError('Academic year not found', 404);
    return record;
  },

  async create(payload, user) {
    const code = await generateCode('AYR');
    const data = {
      ...pick(payload, ALLOWED_FIELDS),
      code,
      status: payload.status || 'ACTIVE',
      created_by: user.id,
      updated_by: user.id
    };
    // Only one academic year can be the "current" one at a time.
    if (data.is_active) {
      await repository.deactivateAllExcept(null);
    }
    const [id] = await repository.create(data);
    const record = await repository.findById(id);
    
    await auditService.log({
      user,
      action: 'CREATE',
      module: 'academic-years',
      recordCode: code,
      after: record,
      req: null
    });
    
    return record;
  },

  async update(id, payload, user) {
    const existing = await repository.findById(id);
    if (!existing) throw new AppError('Academic year not found', 404);
    
    const before = { ...existing };
    // Only one academic year can be the "current" one at a time — turning
    // this one on must turn every other one off.
    if (payload.is_active) {
      await repository.deactivateAllExcept(id);
    }
    await repository.update(id, { ...pick(payload, ALLOWED_FIELDS), updated_by: user.id });
    const after = await repository.findById(id);
    
    await auditService.log({
      user,
      action: 'UPDATE',
      module: 'academic-years',
      recordCode: existing.code,
      before,
      after,
      req: null
    });
    
    return after;
  },

  async softDelete(id, user) {
    const existing = await repository.findById(id);
    if (!existing) throw new AppError('Academic year not found', 404);
    
    await repository.softDelete(id, user.id);
    
    await auditService.log({
      user,
      action: 'DELETE',
      module: 'academic-years',
      recordCode: existing.code,
      before: existing,
      req: null
    });
    
    return true;
  }
};

module.exports = AcademicYearsService;
