// FILE: backend/src/services/gpa.service.js
const repository = require('../repositories/gpa.repository');
const { generateCode } = require('../utils/codeGenerator');
const auditService = require('./audit.service');
const settingsRepository = require('../repositories/settings.repository');
const { convertToGradePoints } = require('../utils/gpaCalculator');
const { pick } = require('../utils/pick');
// FIX (auditoria hallazgo C1 - aislamiento por sede)
const { scopeFiltersToUserBranches, assertBranchAccess } = require('../utils/branchScope');

// FIX (auditoria hallazgo #5 - mass assignment): whitelist explícita de
// columnas reales de la tabla que el cliente puede escribir. Cualquier
// otro campo del body se ignora en vez de llegar crudo al INSERT/UPDATE.
const ALLOWED_FIELDS = ['student_id', 'academic_period_id', 'academic_year_id', 'gpa_value', 'cumulative_gpa', 'credit_hours', 'status', 'calculation_date'];

/**
 * Reads the GPA scale from System Settings (Rule 55: "La escala será
 * configurable desde Settings. No se debe dejar la fórmula rígidamente
 * programada sin configuración."). Falls back to 4.0 when not configured.
 */
const getGpaScale = async () => {
  const setting = await settingsRepository.getByKey('gpa_scale', null);
  const parsed = setting ? parseFloat(setting.setting_value) : NaN;
  return Number.isFinite(parsed) && (parsed === 4.0 || parsed === 5.0) ? parsed : 4.0;
};

const GPAService = {
  async findAll(filters, user) {
    const { page = 1, pageSize = 20, search, studentId, academicPeriodId, academicYearId, status } = filters;
    const queryFilters = scopeFiltersToUserBranches({ search, studentId, academicPeriodId, academicYearId, status }, user);
    const [data, total] = await Promise.all([
      repository.findAll({ ...queryFilters, page, pageSize }),
      repository.count(queryFilters),
    ]);
    return { data, total, page: Number(page), pageSize: Number(pageSize) };
  },

  async findById(id, user) {
    const record = await repository.findById(id);
    assertBranchAccess(record, user, 'GPA record not found');
    return record;
  },

  async create(payload, user) {
    const code = await generateCode('GPA');
    const scale = await getGpaScale();

    // Rule 55: if the caller supplies a raw grade_value instead of an
    // already-computed gpa_value, derive it using the configurable scale
    // from System Settings instead of a hardcoded formula.
    let gpaValue = payload.gpa_value;
    if ((gpaValue === undefined || gpaValue === null) && payload.grade_value !== undefined) {
      gpaValue = convertToGradePoints(payload.grade_value, scale);
    }

    const data = {
      ...pick(payload, ALLOWED_FIELDS),
      gpa_value: gpaValue,
      code,
      status: payload.status || 'PENDING',
      created_by: user.id,
      updated_by: user.id
    };
    delete data.grade_value; // not a column on gpa_records
    const [id] = await repository.create(data);
    const record = await repository.findById(id);
    
    await auditService.log({
      user,
      action: 'CREATE',
      module: 'gpa',
      recordCode: code,
      after: record,
      req: null
    });
    
    return record;
  },

  async update(id, payload, user) {
    const existing = await repository.findById(id);
    assertBranchAccess(existing, user, 'GPA record not found');
    
    const before = { ...existing };
    const updatePayload = { ...pick(payload, ALLOWED_FIELDS), updated_by: user.id };
    if ((updatePayload.gpa_value === undefined || updatePayload.gpa_value === null) && payload.grade_value !== undefined) {
      const scale = await getGpaScale();
      updatePayload.gpa_value = convertToGradePoints(payload.grade_value, scale);
    }
    delete updatePayload.grade_value; // not a column on gpa_records
    await repository.update(id, updatePayload);
    const after = await repository.findById(id);
    
    await auditService.log({
      user,
      action: 'UPDATE',
      module: 'gpa',
      recordCode: existing.code,
      before,
      after,
      req: null
    });
    
    return after;
  },

  async softDelete(id, user) {
    const existing = await repository.findById(id);
    assertBranchAccess(existing, user, 'GPA record not found');
    
    await repository.softDelete(id, user.id);
    
    await auditService.log({
      user,
      action: 'DELETE',
      module: 'gpa',
      recordCode: existing.code,
      before: existing,
      req: null
    });
    
    return true;
  },

  async recalculate(studentId, user) {
    // This would recalculate GPA based on grades
    const gpaRecords = await repository.findByStudent(studentId);
    // Calculate cumulative GPA
    let totalPoints = 0;
    let totalCredits = 0;
    
    for (const record of gpaRecords) {
      totalPoints += record.gpa_value * (record.credit_hours || 1);
      totalCredits += (record.credit_hours || 1);
    }
    
    const cumulativeGPA = totalCredits > 0 ? totalPoints / totalCredits : 0;
    
    return { studentId, cumulativeGPA, records: gpaRecords };
  },

  async getCumulative(studentId, user) {
    const records = await repository.findByStudent(studentId);
    let totalPoints = 0;
    let totalCredits = 0;
    
    for (const record of records) {
      totalPoints += record.gpa_value * (record.credit_hours || 1);
      totalCredits += (record.credit_hours || 1);
    }
    
    const cumulativeGPA = totalCredits > 0 ? totalPoints / totalCredits : 0;
    
    return { studentId, cumulativeGPA, totalCredits, records };
  }
};

module.exports = GPAService;