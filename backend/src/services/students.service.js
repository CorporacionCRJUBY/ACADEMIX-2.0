// FILE: backend/src/services/students.service.js
const fs = require('fs');
const path = require('path');
const AppError = require('../utils/AppError');
const { scopeFiltersToUserBranches, assertBranchAccess } = require('../utils/branchScope');
const repository = require('../repositories/students.repository');
const { generateCode } = require('../utils/codeGenerator');
const auditService = require('./audit.service');
const guardiansRepository = require('../repositories/guardians.repository');
const medicalRecordsRepository = require('../repositories/medicalRecords.repository');
const scholarshipsRepository = require('../repositories/scholarships.repository');
const documentsRepository = require('../repositories/documents.repository');
const academicHistoryRepository = require('../repositories/academicHistory.repository');
const gradesRepository = require('../repositories/grades.repository');
const attendanceRepository = require('../repositories/attendance.repository');
const creditsRepository = require('../repositories/credits.repository');
const gpaRepository = require('../repositories/gpa.repository');
const previousSchoolsRepository = require('../repositories/previousSchools.repository');
const statusHistoryRepository = require('../repositories/studentStatusHistory.repository');
const { pick } = require('../utils/pick');

// FIX (auditoria hallazgo #5 - mass assignment): whitelist explícita de
// columnas reales de la tabla que el cliente puede escribir. Cualquier
// otro campo del body se ignora en vez de llegar crudo al INSERT/UPDATE.
const ALLOWED_FIELDS = ['user_id', 'first_name', 'middle_name', 'last_name', 'second_last_name', 'identification_type', 'identification_number', 'photo_url', 'email', 'phone', 'address', 'date_of_birth', 'gender', 'grade', 'section', 'branch_id', 'academic_year_id', 'enrollment_date', 'graduation_year', 'status', 'notes'];

const uploadsRoot = path.resolve(__dirname, '../../uploads');

const MIME_BY_EXT = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};
const mime = {
  lookup: (filePath) => MIME_BY_EXT[path.extname(filePath).toLowerCase()],
};

// Small helper so one failing related query never breaks the whole record.
const safe = async (promise, fallback) => {
  try {
    const result = await promise;
    return result === undefined || result === null ? fallback : result;
  } catch (err) {
    return fallback;
  }
};

const StudentsService = {
  async findAll(filters, user) {
    const { page = 1, pageSize = 20, search, firstName, lastName, email, grade, section, branchId, academicYearId, status } = filters;
    // FIX (aislamiento por sede): un usuario no-SUPER_ADMIN solo puede ver
    // estudiantes de sus propias sedes, sin importar qué branchId pida.
    const queryFilters = scopeFiltersToUserBranches(
      { search, firstName, lastName, email, grade, section, branchId, academicYearId, status },
      user
    );
    const [data, total] = await Promise.all([
      repository.findAll({ ...queryFilters, page, pageSize }),
      repository.count(queryFilters),
    ]);
    return { data, total, page: Number(page), pageSize: Number(pageSize) };
  },

  async findById(id, user) {
    const record = await repository.findById(id);
    assertBranchAccess(record, user, 'Student not found');
    return record;
  },

  async getFullRecord(id, user) {
    const student = await repository.findFullRecord(id);
    assertBranchAccess(student, user, 'Student not found');

    const [
      guardians,
      medicalRecord,
      scholarships,
      documents,
      academicHistory,
      grades,
      attendance,
      credits,
      gpaHistory,
      previousSchools,
      statusHistory,
    ] = await Promise.all([
      safe(guardiansRepository.findByStudent(id), []),
      safe(medicalRecordsRepository.findByStudent(id), null),
      safe(scholarshipsRepository.findByStudent(id), []),
      safe(documentsRepository.findByStudent(id), []),
      safe(academicHistoryRepository.findByStudent(id), []),
      safe(gradesRepository.findByStudent(id), []),
      safe(attendanceRepository.findAll({ studentId: id }), []),
      safe(creditsRepository.findByStudent(id), []),
      safe(gpaRepository.findByStudent(id), []),
      safe(previousSchoolsRepository.findByStudent(id), []),
      safe(statusHistoryRepository.findByStudent(id), []),
    ]);

    // Attendance summary (Present / Online / Excused / Unexcused + rate)
    const attendanceTotals = { P: 0, O: 0, E: 0, U: 0 };
    attendance.forEach((a) => {
      if (attendanceTotals[a.status] !== undefined) attendanceTotals[a.status] += 1;
    });
    const totalAttendanceRecords = attendance.length;
    const attendanceRate = totalAttendanceRecords > 0
      ? Number((((attendanceTotals.P + attendanceTotals.O) / totalAttendanceRecords) * 100).toFixed(1))
      : null;

    // Credits summary
    const totalCreditsEarned = credits.reduce((sum, c) => sum + Number(c.credit_earned || 0), 0);
    const totalCreditsAttempted = credits.reduce((sum, c) => sum + Number(c.credit_value || 0), 0);

    // GPA summary: most recent record is treated as current cumulative GPA
    const latestGpa = gpaHistory[0] || null;

    return {
      student,
      guardians,
      medical_record: medicalRecord,
      scholarships,
      documents,
      academic_history: academicHistory,
      grades: grades.slice(0, 50),
      previous_schools: previousSchools,
      status_history: statusHistory,
      attendance: {
        records: attendance.slice(0, 50),
        totals: attendanceTotals,
        total_records: totalAttendanceRecords,
        attendance_rate: attendanceRate,
      },
      credits: {
        records: credits,
        total_earned: Number(totalCreditsEarned.toFixed(2)),
        total_attempted: Number(totalCreditsAttempted.toFixed(2)),
      },
      gpa: {
        records: gpaHistory,
        cumulative_gpa: latestGpa ? latestGpa.cumulative_gpa : null,
        current_gpa: latestGpa ? latestGpa.gpa_value : null,
      },
    };
  },

  async create(payload, user) {
    const code = await generateCode('STU');
    const data = {
      ...pick(payload, ALLOWED_FIELDS),
      code,
      status: payload.status || 'ACTIVE',
      enrollment_date: payload.enrollment_date || new Date(),
      created_by: user.id,
      updated_by: user.id
    };
    const [id] = await repository.create(data);
    const record = await repository.findById(id);
    
    await auditService.log({
      user,
      action: 'CREATE',
      module: 'students',
      recordCode: code,
      after: record,
      req: null
    });
    
    return record;
  },

  async update(id, payload, user) {
    const existing = await repository.findById(id);
    assertBranchAccess(existing, user, 'Student not found');

    const before = { ...existing };
    await repository.update(id, { ...pick(payload, ALLOWED_FIELDS), updated_by: user.id });
    const after = await repository.findById(id);
    
    await auditService.log({
      user,
      action: 'UPDATE',
      module: 'students',
      recordCode: existing.code,
      before,
      after,
      req: null
    });
    
    return after;
  },

  async updateStatus(id, status, options, user) {
    const existing = await repository.findById(id);
    assertBranchAccess(existing, user, 'Student not found');
    if (existing.status === status) throw new AppError('Student already has this status', 409);
    
    const { reason, observation } = options || {};
    const before = { ...existing };
    await repository.updateStatus(id, status, user.id);
    const after = await repository.findById(id);

    // Section 8 of the master plan requires every status change to keep
    // Previous Status / New Status / Date / User / Reason / Observation.
    // The table already existed in the migrations but nothing wrote to it.
    await statusHistoryRepository.create({
      student_id: id,
      from_status: before.status,
      to_status: status,
      reason: reason || null,
      observation: observation || null,
      changed_by: user.id,
    });
    
    await auditService.log({
      user,
      action: 'UPDATE_STATUS',
      module: 'students',
      recordCode: existing.code,
      before,
      after,
      reason: reason || null,
      req: null
    });
    
    return after;
  },

  async uploadPhoto(id, file, user) {
    const existing = await repository.findById(id);
    assertBranchAccess(existing, user, 'Student not found');

    const subDir = file.destination.includes('images') ? 'images' : 'others';
    const photoUrl = `/uploads/${subDir}/${file.filename}`;

    await repository.update(id, { photo_url: photoUrl, updated_by: user.id });
    const after = await repository.findById(id);

    await auditService.log({
      user,
      action: 'UPDATE_PHOTO',
      module: 'students',
      recordCode: existing.code,
      before: { photo_url: existing.photo_url },
      after: { photo_url: photoUrl },
      req: null
    });

    return after;
  },

  // NOTA DE SEGURIDAD: antes las fotos se servían desde la carpeta pública
  // /uploads sin autenticación (fotos de menores de edad accesibles con solo
  // la URL). Ahora se sirven aquí, detrás de authorize('students.view').
  async getPhoto(id, user) {
    const existing = await repository.findById(id);
    assertBranchAccess(existing, user, 'Student not found');
    if (!existing.photo_url) throw new AppError('Student has no photo', 404);

    const relativePath = existing.photo_url.replace(/^\/uploads\//, '');
    const filePath = path.join(uploadsRoot, relativePath);
    if (!fs.existsSync(filePath)) throw new AppError('Photo file not found on server', 404);

    return {
      stream: fs.createReadStream(filePath),
      filename: path.basename(filePath),
      mimeType: mime.lookup(filePath) || 'application/octet-stream',
    };
  },

  async softDelete(id, user) {
    const existing = await repository.findById(id);
    assertBranchAccess(existing, user, 'Student not found');
    
    await repository.softDelete(id, user.id);
    
    await auditService.log({
      user,
      action: 'DELETE',
      module: 'students',
      recordCode: existing.code,
      before: existing,
      req: null
    });
    
    return true;
  }
};

module.exports = StudentsService;