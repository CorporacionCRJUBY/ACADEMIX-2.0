// FILE: backend/src/services/gransif.service.js
const AppError = require('../utils/AppError');
const repository = require('../repositories/gransif.repository');
const { generateCode } = require('../utils/codeGenerator');
const auditService = require('./audit.service');
const { pick } = require('../utils/pick');

// FIX (auditoria hallazgo #5 - mass assignment): whitelist explícita de
// columnas reales de la tabla que el cliente puede escribir. Cualquier
// otro campo del body se ignora en vez de llegar crudo al INSERT/UPDATE.
const ALLOWED_FIELDS = ['student_id', 'academic_year_id', 'assessment_date', 'score', 'status', 'notes'];

const GransifService = {
  async findAll(filters, user) {
    const { page = 1, pageSize = 20, search, studentId, academicYearId, status } = filters;
    const queryFilters = { search, studentId, academicYearId, status };
    const [data, total] = await Promise.all([
      repository.findAll({ ...queryFilters, page, pageSize }),
      repository.count(queryFilters),
    ]);
    return { data, total, page: Number(page), pageSize: Number(pageSize) };
  },

  async findById(id, user) {
    const record = await repository.findById(id);
    if (!record) throw new AppError('Gransif record not found', 404);
    return record;
  },

  async create(payload, user) {
    const code = await generateCode('GRN');
    const data = {
      ...pick(payload, ALLOWED_FIELDS),
      code,
      status: payload.status || 'PENDING',
      created_by: user.id,
      updated_by: user.id
    };
    const [id] = await repository.create(data);
    const record = await repository.findById(id);
    
    await auditService.log({
      user,
      action: 'CREATE',
      module: 'gransif',
      recordCode: code,
      after: record,
      req: null
    });
    
    return record;
  },

  async update(id, payload, user) {
    const existing = await repository.findById(id);
    if (!existing) throw new AppError('Gransif record not found', 404);
    
    const before = { ...existing };
    await repository.update(id, { ...pick(payload, ALLOWED_FIELDS), updated_by: user.id });
    const after = await repository.findById(id);
    
    await auditService.log({
      user,
      action: 'UPDATE',
      module: 'gransif',
      recordCode: existing.code,
      before,
      after,
      req: null
    });
    
    return after;
  },

  async softDelete(id, user) {
    const existing = await repository.findById(id);
    if (!existing) throw new AppError('Gransif record not found', 404);
    
    await repository.softDelete(id, user.id);
    
    await auditService.log({
      user,
      action: 'DELETE',
      module: 'gransif',
      recordCode: existing.code,
      before: existing,
      req: null
    });
    
    return true;
  },

  async activate(id, user) {
    const existing = await repository.findById(id);
    if (!existing) throw new AppError('Gransif record not found', 404);
    if (existing.status === 'ACTIVE') throw new AppError('Gransif already active', 409);
    
    // Would also validate that student is in final grade
    const before = { ...existing };
    await repository.activate(id, user.id);
    const after = await repository.findById(id);
    
    await auditService.log({
      user,
      action: 'ACTIVATE',
      module: 'gransif',
      recordCode: existing.code,
      before,
      after,
      req: null
    });
    
    return after;
  }
};

module.exports = GransifService;
