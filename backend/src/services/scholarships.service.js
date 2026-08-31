// FILE: backend/src/services/scholarships.service.js
const AppError = require('../utils/AppError');
const repository = require('../repositories/scholarships.repository');
const { generateCode } = require('../utils/codeGenerator');
const auditService = require('./audit.service');
const { pick } = require('../utils/pick');
// FIX (auditoria hallazgo C1 - aislamiento por sede)
const { scopeFiltersToUserBranches, assertBranchAccess } = require('../utils/branchScope');

// FIX (auditoria hallazgo #5 - mass assignment): whitelist explícita de
// columnas reales de la tabla que el cliente puede escribir. Cualquier
// otro campo del body se ignora en vez de llegar crudo al INSERT/UPDATE.
const ALLOWED_FIELDS = ['student_id', 'scholarship_type', 'percentage', 'amount', 'academic_year_id', 'start_date', 'end_date', 'status', 'approval_date', 'rejection_reason', 'notes'];

const ScholarshipsService = {
  async findAll(filters, user) {
    const { page = 1, pageSize = 20, search, studentId, scholarshipType, status, academicYearId } = filters;
    const queryFilters = scopeFiltersToUserBranches({ search, studentId, scholarshipType, status, academicYearId }, user);
    const [data, total] = await Promise.all([
      repository.findAll({ ...queryFilters, page, pageSize }),
      repository.count(queryFilters),
    ]);
    return { data, total, page: Number(page), pageSize: Number(pageSize) };
  },

  async findById(id, user) {
    const record = await repository.findById(id);
    assertBranchAccess(record, user, 'Scholarship not found');
    return record;
  },

  async create(payload, user) {
    const code = await generateCode('SCH');
    const data = {
      ...pick(payload, ALLOWED_FIELDS),
      code,
      status: payload.status || 'REQUESTED',
      created_by: user.id,
      updated_by: user.id
    };
    const [id] = await repository.create(data);
    const record = await repository.findById(id);
    
    await auditService.log({
      user,
      action: 'CREATE',
      module: 'scholarships',
      recordCode: code,
      after: record,
      req: null
    });
    
    return record;
  },

  async update(id, payload, user) {
    const existing = await repository.findById(id);
    assertBranchAccess(existing, user, 'Scholarship not found');
    
    const before = { ...existing };
    await repository.update(id, { ...pick(payload, ALLOWED_FIELDS), updated_by: user.id });
    const after = await repository.findById(id);
    
    await auditService.log({
      user,
      action: 'UPDATE',
      module: 'scholarships',
      recordCode: existing.code,
      before,
      after,
      req: null
    });
    
    return after;
  },

  async softDelete(id, user) {
    const existing = await repository.findById(id);
    assertBranchAccess(existing, user, 'Scholarship not found');
    
    await repository.softDelete(id, user.id);
    
    await auditService.log({
      user,
      action: 'DELETE',
      module: 'scholarships',
      recordCode: existing.code,
      before: existing,
      req: null
    });
    
    return true;
  },

  async updateStatus(id, status, reason, user) {
    const existing = await repository.findById(id);
    assertBranchAccess(existing, user, 'Scholarship not found');
    
    const validTransitions = {
      'REQUESTED': ['UNDER_REVIEW', 'REJECTED'],
      'UNDER_REVIEW': ['APPROVED', 'REJECTED'],
      'APPROVED': ['ACTIVE', 'CANCELLED'],
      'ACTIVE': ['SUSPENDED', 'EXPIRED', 'CANCELLED'],
      'SUSPENDED': ['ACTIVE', 'EXPIRED'],
      'REJECTED': ['REQUESTED']
    };
    
    if (!validTransitions[existing.status] || !validTransitions[existing.status].includes(status)) {
      throw new AppError(`Invalid status transition from ${existing.status} to ${status}`, 409);
    }
    
    const before = { ...existing };
    await repository.updateStatus(id, status, user.id, reason);

    // Record the transition in scholarship_history (029_create_scholarship_history.js)
    // so admissions/finance have an auditable approval timeline for this
    // scholarship, independent of the generic cross-module audit log.
    await repository.addStatusHistory({
      scholarshipId: id,
      fromStatus: existing.status,
      toStatus: status,
      reason,
      changedBy: user.id,
    });

    const after = await repository.findById(id);
    
    await auditService.log({
      user,
      action: 'UPDATE_STATUS',
      module: 'scholarships',
      recordCode: existing.code,
      before,
      after,
      req: null
    });
    
    return after;
  },

  async getHistory(id, user) {
    const existing = await repository.findById(id);
    assertBranchAccess(existing, user, 'Scholarship not found');
    return repository.getStatusHistory(id);
  }
};

module.exports = ScholarshipsService;