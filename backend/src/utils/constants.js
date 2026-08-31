// FILE: backend/src/utils/constants.js
module.exports = {
  // Roles del sistema
  ROLES: {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    TEACHER: 'TEACHER',
  },

  // Estados de estudiantes
  STUDENT_STATUS: {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    GRADUATED: 'GRADUATED',
    WITHDRAWN: 'WITHDRAWN',
    TRANSFERRED: 'TRANSFERRED',
    SUSPENDED: 'SUSPENDED',
  },

  // Estados de calificaciones
  GRADE_STATUS: {
    DRAFT: 'DRAFT',
    PUBLISHED: 'PUBLISHED',
    LOCKED: 'LOCKED',
    UNLOCKED: 'UNLOCKED',
  },

  // Estados de asistencia
  ATTENDANCE_STATUS: {
    PRESENT: 'P',
    ONLINE: 'O',
    EXCUSED: 'E',
    UNEXCUSED: 'U',
  },

  // Estados de períodos académicos
  PERIOD_STATUS: {
    OPEN: 'OPEN',
    CLOSED: 'CLOSED',
    LOCKED: 'LOCKED',
  },

  // Estados de reportes
  REPORT_STATUS: {
    DRAFT: 'DRAFT',
    OFFICIAL: 'OFFICIAL',
    ARCHIVED: 'ARCHIVED',
    REPRINTED: 'REPRINTED',
  },

  // Estados de becas
  SCHOLARSHIP_STATUS: {
    REQUESTED: 'REQUESTED',
    UNDER_REVIEW: 'UNDER_REVIEW',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    ACTIVE: 'ACTIVE',
    SUSPENDED: 'SUSPENDED',
    EXPIRED: 'EXPIRED',
    CANCELLED: 'CANCELLED',
  },

  // Tipos de créditos
  CREDIT_TYPES: {
    ACADEMIC: 'ACADEMIC',
    SOCIAL: 'SOCIAL',
    COMMUNITY: 'COMMUNITY',
    ELECTIVE: 'ELECTIVE',
  },

  // Estados de solicitudes de cambio de nota
  GRADE_CHANGE_STATUS: {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
  },

  // Tipos de documentos
  DOCUMENT_TYPES: {
    ID: 'IDENTIFICATION',
    TRANSCRIPT: 'TRANSCRIPT',
    CERTIFICATE: 'CERTIFICATE',
    MEDICAL: 'MEDICAL',
    CONSENT: 'CONSENT',
    OTHER: 'OTHER',
  },

  // Categorías de reportes
  REPORT_CATEGORIES: {
    ATTENDANCE: 'attendance',
    GRADES: 'grades',
    PROGRESS_REPORTS: 'progress-reports',
    REPORT_CARDS: 'report-cards',
    ACADEMIC_HISTORY: 'academic-history',
    TRANSCRIPTS: 'transcripts',
    SCHOLARSHIPS: 'scholarships',
    GRADUATION: 'graduation',
  },

  // Tipos de eventos de calendario
  EVENT_TYPES: {
    HOLIDAY: 'HOLIDAY',
    EXAM: 'EXAM',
    EVENT: 'EVENT',
    MEETING: 'MEETING',
    DEADLINE: 'DEADLINE',
    OTHER: 'OTHER',
  },

  // Idiomas soportados
  LANGUAGES: {
    EN: 'en',
    ES: 'es',
  },

  // Permisos predefinidos (módulo.acción)
  PERMISSIONS: {
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
  },
};