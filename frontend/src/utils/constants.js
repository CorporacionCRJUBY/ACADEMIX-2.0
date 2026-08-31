// FILE: frontend/src/utils/constants.js
/**
 * Constantes globales de la aplicación
 */
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
};

export const STUDENT_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  GRADUATED: 'GRADUATED',
  WITHDRAWN: 'WITHDRAWN',
  TRANSFERRED: 'TRANSFERRED',
  SUSPENDED: 'SUSPENDED',
};

export const GRADE_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  LOCKED: 'LOCKED',
  UNLOCKED: 'UNLOCKED',
};

export const ATTENDANCE_STATUS = {
  PRESENT: 'P',
  ONLINE: 'O',
  EXCUSED: 'E',
  UNEXCUSED: 'U',
};

export const PERIOD_STATUS = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  LOCKED: 'LOCKED',
};

export const REPORT_STATUS = {
  DRAFT: 'DRAFT',
  OFFICIAL: 'OFFICIAL',
  ARCHIVED: 'ARCHIVED',
  REPRINTED: 'REPRINTED',
};

export const SCHOLARSHIP_STATUS = {
  REQUESTED: 'REQUESTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
};

export const CREDIT_TYPES = {
  ACADEMIC: 'ACADEMIC',
  SOCIAL: 'SOCIAL',
  COMMUNITY: 'COMMUNITY',
  ELECTIVE: 'ELECTIVE',
};

export const GRADE_CHANGE_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

export const DOCUMENT_TYPES = {
  IDENTIFICATION: 'IDENTIFICATION',
  TRANSCRIPT: 'TRANSCRIPT',
  CERTIFICATE: 'CERTIFICATE',
  MEDICAL: 'MEDICAL',
  CONSENT: 'CONSENT',
  OTHER: 'OTHER',
};

export const REPORT_CATEGORIES = {
  ATTENDANCE: 'attendance',
  GRADES: 'grades',
  PROGRESS_REPORTS: 'progress-reports',
  REPORT_CARDS: 'report-cards',
  ACADEMIC_HISTORY: 'academic-history',
  TRANSCRIPTS: 'transcripts',
  SCHOLARSHIPS: 'scholarships',
  GRADUATION: 'graduation',
};

export const EVENT_TYPES = {
  HOLIDAY: 'HOLIDAY',
  EXAM: 'EXAM',
  EVENT: 'EVENT',
  MEETING: 'MEETING',
  DEADLINE: 'DEADLINE',
  OTHER: 'OTHER',
};

export const TRANSCRIPT_TYPES = {
  OFFICIAL: 'OFFICIAL',
  UNOFFICIAL: 'UNOFFICIAL',
};

export const GENDER = {
  MALE: 'M',
  FEMALE: 'F',
  OTHER: 'OTHER',
};

export const LANGUAGES = {
  EN: 'en',
  ES: 'es',
};

export const PERMISSIONS = {
  // Estudiantes
  STUDENTS_VIEW: 'students.view',
  STUDENTS_CREATE: 'students.create',
  STUDENTS_EDIT: 'students.edit',
  STUDENTS_DELETE: 'students.delete',

  // Profesores
  TEACHERS_VIEW: 'teachers.view',
  TEACHERS_CREATE: 'teachers.create',
  TEACHERS_EDIT: 'teachers.edit',
  TEACHERS_DELETE: 'teachers.delete',

  // Materias
  SUBJECTS_VIEW: 'subjects.view',
  SUBJECTS_CREATE: 'subjects.create',
  SUBJECTS_EDIT: 'subjects.edit',
  SUBJECTS_DELETE: 'subjects.delete',

  // Calificaciones
  GRADES_VIEW: 'grades.view',
  GRADES_CREATE: 'grades.create',
  GRADES_EDIT: 'grades.edit',
  GRADES_DELETE: 'grades.delete',

  // Asistencia
  ATTENDANCE_VIEW: 'attendance.view',
  ATTENDANCE_CREATE: 'attendance.create',
  ATTENDANCE_EDIT: 'attendance.edit',
  ATTENDANCE_DELETE: 'attendance.delete',

  // Reportes
  REPORTS_VIEW: 'reports.view',
  REPORTS_GENERATE: 'reports.generate',

  // Usuarios
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',

  // Auditoría
  AUDIT_VIEW: 'audit.view',

  // Configuración
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_EDIT: 'settings.edit',
};

export const PAGINATION = {
  DEFAULT_PAGE: 0,
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50, 100],
};

export const UPLOAD = {
  MAX_SIZE_MB: 15,
  ALLOWED_TYPES: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
  ALLOWED_EXTENSIONS: ['.pdf', '.jpg', '.jpeg', '.png', '.docx', '.doc', '.xlsx', '.xls'],
};