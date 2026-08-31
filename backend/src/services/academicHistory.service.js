// FILE: backend/src/services/academicHistory.service.js
const AppError = require('../utils/AppError');
const repository = require('../repositories/academicHistory.repository');
const { generateCode } = require('../utils/codeGenerator');
const auditService = require('./audit.service');
const { pick } = require('../utils/pick');
// FIX (auditoria hallazgo C1 - aislamiento por sede)
const { scopeFiltersToUserBranches, assertBranchAccess } = require('../utils/branchScope');

// FIX (auditoria hallazgo #5 - mass assignment): whitelist explícita de
// columnas reales de la tabla que el cliente puede escribir. Cualquier
// otro campo del body se ignora en vez de llegar crudo al INSERT/UPDATE.
const ALLOWED_FIELDS = ['student_id', 'academic_period_id', 'academic_year_id', 'subject_id', 'grade_value', 'grade_letter', 'status', 'notes'];

const AcademicHistoryService = {
  async findAll(filters, user) {
    const { page = 1, pageSize = 20, search, studentId, academicYearId, periodId, status } = filters;
    const queryFilters = scopeFiltersToUserBranches({ search, studentId, academicYearId, periodId, status }, user);
    const [data, total] = await Promise.all([
      repository.findAll({ ...queryFilters, page, pageSize }),
      repository.count(queryFilters),
    ]);
    return { data, total, page: Number(page), pageSize: Number(pageSize) };
  },

  async findById(id, user) {
    const record = await repository.findById(id);
    assertBranchAccess(record, user, 'Academic history record not found');
    return record;
  },

  async findByStudent(studentId, user) {
    return repository.findByStudent(studentId);
  },

  async create(payload, user) {
    const code = await generateCode('AHI');
    const data = {
      ...pick(payload, ALLOWED_FIELDS),
      code,
      status: payload.status || 'PUBLISHED',
      created_by: user.id,
      updated_by: user.id
    };
    const [id] = await repository.create(data);
    const record = await repository.findById(id);

    await auditService.log({
      user,
      action: 'CREATE',
      module: 'academic-history',
      recordCode: code,
      after: record,
      req: null
    });

    return record;
  },

  // Bug fix: update() existed in the model/repository but was never wired
  // up through the service/controller/routes, so the "Edit" button in the
  // UI called an api.js method (academicHistoryApi.update) that didn't
  // even exist — it always crashed client-side before reaching the network.
  async update(id, payload, user) {
    const existing = await repository.findById(id);
    assertBranchAccess(existing, user, 'Academic history record not found');
    if (existing.status === 'LOCKED') {
      throw new AppError('Cannot edit a locked academic history record', 409);
    }

    const before = { ...existing };
    await repository.update(id, { ...pick(payload, ALLOWED_FIELDS), updated_by: user.id });
    const after = await repository.findById(id);

    await auditService.log({
      user,
      action: 'UPDATE',
      module: 'academic-history',
      recordCode: existing.code,
      before,
      after,
      req: null
    });

    return after;
  },

  // Bug fix: same as update() — softDelete existed lower in the stack but
  // was never exposed, so the "Delete" button called a method that didn't
  // exist on the frontend api object.
  async softDelete(id, user) {
    const existing = await repository.findById(id);
    assertBranchAccess(existing, user, 'Academic history record not found');
    if (existing.status === 'LOCKED') {
      throw new AppError('Cannot delete a locked academic history record', 409);
    }

    await repository.softDelete(id, user.id);

    await auditService.log({
      user,
      action: 'DELETE',
      module: 'academic-history',
      recordCode: existing.code,
      before: existing,
      req: null
    });

    return true;
  }
};

module.exports = AcademicHistoryService;
