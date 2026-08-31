-- ACADEMIX 2.0 - Esquema completo de base de datos
-- MySQL/MariaDB

-- =====================================================
-- TABLAS DE SISTEMA Y SEGURIDAD
-- =====================================================
-- 001_code_sequences
CREATE TABLE code_sequences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  prefix VARCHAR(10) NOT NULL UNIQUE,
  last_number INT DEFAULT 0,
  year INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 002_branches
CREATE TABLE branches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  address VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(100),
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  deleted_by INT NULL,
  created_by INT NULL,
  updated_by INT NULL
);

-- 003_roles
CREATE TABLE roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  deleted_by INT NULL,
  created_by INT NULL,
  updated_by INT NULL
);

-- 004_permissions
CREATE TABLE permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL UNIQUE,
  module VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  deleted_by INT NULL,
  UNIQUE KEY uk_module_action (module, action)
);

-- 005_role_permissions
CREATE TABLE role_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE KEY uk_role_permission (role_id, permission_id)
);

-- 006_users
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role_id INT NULL,
  branch_id INT NULL,
  status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE',
  last_login TIMESTAMP NULL,
  login_attempts INT DEFAULT 0,
  locked_until TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  deleted_by INT NULL,
  created_by INT NULL,
  updated_by INT NULL,
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- 007_user_roles
CREATE TABLE user_roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_role (user_id, role_id)
);

-- =====================================================
-- TABLAS ACADÉMICAS
-- =====================================================

-- 008_students
CREATE TABLE students (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL UNIQUE,
  user_id INT NULL,
  first_name VARCHAR(50) NOT NULL,
  middle_name VARCHAR(50) NULL,
  last_name VARCHAR(50) NOT NULL,
  second_last_name VARCHAR(50) NULL,
  identification_type VARCHAR(20) NULL,
  identification_number VARCHAR(50) NULL,
  photo_url VARCHAR(255) NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20),
  address VARCHAR(255),
  date_of_birth DATE NOT NULL,
  gender ENUM('M', 'F', 'OTHER'),
  grade VARCHAR(20) NOT NULL,
  section VARCHAR(20),
  branch_id INT NOT NULL,
  academic_year_id INT NOT NULL,
  enrollment_date DATE DEFAULT (CURRENT_DATE),
  graduation_year INT,
  status ENUM('ACTIVE', 'INACTIVE', 'GRADUATED', 'WITHDRAWN', 'TRANSFERRED', 'SUSPENDED') DEFAULT 'ACTIVE',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  deleted_by INT NULL,
  created_by INT NULL,
  updated_by INT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- 009_student_status_history
CREATE TABLE student_status_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  from_status ENUM('ACTIVE', 'INACTIVE', 'GRADUATED', 'WITHDRAWN', 'TRANSFERRED', 'SUSPENDED'),
  to_status ENUM('ACTIVE', 'INACTIVE', 'GRADUATED', 'WITHDRAWN', 'TRANSFERRED', 'SUSPENDED') NOT NULL,
  reason TEXT,
  observation TEXT,
  changed_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id)
);

-- 010_teachers
CREATE TABLE teachers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL UNIQUE,
  user_id INT NULL,
  first_name VARCHAR(50) NOT NULL,
  middle_name VARCHAR(50) NULL,
  last_name VARCHAR(50) NOT NULL,
  identification_number VARCHAR(50) NULL,
  photo_url VARCHAR(255) NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20),
  specialization VARCHAR(100),
  hire_date DATE NOT NULL,
  branch_id INT NOT NULL,
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  deleted_by INT NULL,
  created_by INT NULL,
  updated_by INT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- 011_guardians
CREATE TABLE guardians (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL UNIQUE,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  relationship VARCHAR(50) NOT NULL,
  identification VARCHAR(50) NULL,
  phone VARCHAR(20),
  secondary_phone VARCHAR(20) NULL,
  email VARCHAR(100),
  address VARCHAR(255),
  is_emergency_contact BOOLEAN DEFAULT FALSE,
  is_primary BOOLEAN DEFAULT FALSE,
  authorized_pickup BOOLEAN DEFAULT FALSE,
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  deleted_by INT NULL,
  created_by INT NULL,
  updated_by INT NULL
);

-- 012_student_guardians
CREATE TABLE student_guardians (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  guardian_id INT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  is_emergency_contact BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (guardian_id) REFERENCES guardians(id) ON DELETE CASCADE,
  UNIQUE KEY uk_student_guardian (student_id, guardian_id)
);

-- 013_subjects
CREATE TABLE subjects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  grade VARCHAR(20),
  branch_id INT NOT NULL,
  credits DECIMAL(5,2) DEFAULT 0,
  hours_per_week INT DEFAULT 0,
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  deleted_by INT NULL,
  created_by INT NULL,
  updated_by INT NULL,
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- 014_academic_years
CREATE TABLE academic_years (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  deleted_by INT NULL,
  created_by INT NULL,
  updated_by INT NULL
);

-- 015_academic_periods
CREATE TABLE academic_periods (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL UNIQUE,
  academic_year_id INT NOT NULL,
  name VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('OPEN', 'CLOSED', 'LOCKED') DEFAULT 'OPEN',
  is_active BOOLEAN DEFAULT FALSE,
  grading_config JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  deleted_by INT NULL,
  created_by INT NULL,
  updated_by INT NULL,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE
);

-- 016_academic_assignments
CREATE TABLE academic_assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL UNIQUE,
  teacher_id INT NOT NULL,
  subject_id INT NOT NULL,
  grade VARCHAR(20) NOT NULL,
  section VARCHAR(20),
  branch_id INT NOT NULL,
  academic_year_id INT NOT NULL,
  schedule VARCHAR(255),
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  deleted_by INT NULL,
  created_by INT NULL,
  updated_by INT NULL,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);

-- =====================================================
-- TABLAS DE ASISTENCIA Y CALIFICACIONES
-- =====================================================

-- 017_attendance_records
CREATE TABLE attendance_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL UNIQUE,
  assignment_id INT NOT NULL,
  student_id INT NOT NULL,
  date DATE NOT NULL,
  status ENUM('P', 'O', 'E', 'U') NOT NULL,
  check_in_time TIME NULL,
  check_out_time TIME NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  deleted_by INT NULL,
  created_by INT NULL,
  updated_by INT NULL,
  FOREIGN KEY (assignment_id) REFERENCES academic_assignments(id),
  FOREIGN KEY (student_id) REFERENCES students(id),
  UNIQUE KEY uk_assignment_student_date (assignment_id, student_id, date)
);

-- 018_attendance_history
CREATE TABLE attendance_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  attendance_record_id INT NOT NULL,
  from_status ENUM('P', 'O', 'E', 'U'),
  to_status ENUM('P', 'O', 'E', 'U') NOT NULL,
  reason TEXT,
  changed_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attendance_record_id) REFERENCES attendance_records(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id)
);

-- 019_grade_records
CREATE TABLE grade_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL UNIQUE,
  student_id INT NOT NULL,
  subject_id INT NOT NULL,
  assignment_id INT NOT NULL,
  academic_period_id INT NOT NULL,
  grade_value DECIMAL(5,2) NOT NULL,
  grade_letter VARCHAR(2),
  weight DECIMAL(3,2) DEFAULT 1.0,
  status ENUM('DRAFT', 'PUBLISHED', 'LOCKED', 'UNLOCKED') DEFAULT 'DRAFT',
  edit_deadline TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  deleted_by INT NULL,
  created_by INT NULL,
  updated_by INT NULL,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  FOREIGN KEY (assignment_id) REFERENCES academic_assignments(id),
  FOREIGN KEY (academic_period_id) REFERENCES academic_periods(id),
  UNIQUE KEY uk_student_subject_assignment (student_id, subject_id, assignment_id, academic_period_id)
);

-- 020_grade_history
CREATE TABLE grade_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  grade_record_id INT NOT NULL,
  from_grade DECIMAL(5,2),
  to_grade DECIMAL(5,2) NOT NULL,
  from_letter VARCHAR(2),
  to_letter VARCHAR(2),
  reason TEXT,
  changed_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (grade_record_id) REFERENCES grade_records(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id)
);

-- 021_grade_change_requests
CREATE TABLE grade_change_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL UNIQUE,
  grade_record_id INT NOT NULL,
  student_id INT NOT NULL,
  requested_by INT NOT NULL,
  current_grade DECIMAL(5,2) NOT NULL,
  requested_grade DECIMAL(5,2) NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
  reviewed_by INT NULL,
  reviewed_at TIMESTAMP NULL,
  review_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  deleted_by INT NULL,
  FOREIGN KEY (grade_record_id) REFERENCES grade_records(id),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (requested_by) REFERENCES users(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- =====================================================
-- TABLAS DE HISTORIAL ACADÉMICO
-- =====================================================

-- 022_academic_history
CREATE TABLE academic_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL UNIQUE,
  student_id INT NOT NULL,
  academic_period_id INT NOT NULL,
  academic_year_id INT NOT NULL,
  subject_id INT NOT NULL,
  grade_value DECIMAL(5,2),
  grade_letter VARCHAR(2),
  status ENUM('DRAFT', 'PUBLISHED', 'LOCKED') DEFAULT 'PUBLISHED',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  deleted_by INT NULL,
  created_by INT NULL,
  updated_by INT NULL,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (academic_period_id) REFERENCES academic_periods(id),
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

-- 023_credits
CREATE TABLE credits (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL UNIQUE,
  student_id INT NOT NULL,
  academic_period_id INT NOT NULL,
  credit_type ENUM('ACADEMIC', 'SOCIAL', 'COMMUNITY', 'ELECTIVE') NOT NULL,
  credits_earned DECIMAL(5,2) DEFAULT 0,
  credits_required DECIMAL(5,2) DEFAULT 0,
  status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  deleted_by INT NULL,
  created_by INT NULL,
  updated_by INT NULL,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (academic_period_id) REFERENCES academic_periods(id),
  UNIQUE KEY uk_student_period_type (student_id, academic_period_id, credit_type)
);

-- 024_credit_history
CREATE TABLE credit_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  credit_id INT NOT NULL,
  from_credits DECIMAL(5,2),
  to_credits DECIMAL(5,2) NOT NULL,
  reason TEXT,
  changed_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (credit_id) REFERENCES credits(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id)
);

-- 025_gpa_records
CREATE TABLE gpa_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL UNIQUE,
  student_id INT NOT NULL,
  academic_period_id INT NOT NULL,
  academic_year_id INT NOT NULL,
  gpa_value DECIMAL(5,3) NOT NULL,
  cumulative_gpa DECIMAL(5,3) DEFAULT 0,
  credit_hours DECIMAL(5,2) DEFAULT 0,
  status ENUM('PENDING', 'APPROVED') DEFAULT 'PENDING',
  calculation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  deleted_by INT NULL,
  created_by INT NULL,
  updated_by INT NULL,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (academic_period_id) REFERENCES academic_periods(id),
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
  UNIQUE KEY uk_student_period (student_id, academic_period_id)
);

-- 026_gpa_history
CREATE TABLE gpa_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  gpa_record_id INT NOT NULL,
  from_gpa DECIMAL(5,3),
  to_gpa DECIMAL(5,3) NOT NULL,
  reason TEXT,
  changed_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gpa_record_id) REFERENCES gpa_records(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id)
);

-- =====================================================
-- TABLAS DE BECAS Y DOCUMENTOS
-- =====================================================

-- 027_previous_schools
CREATE TABLE previous_schools (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL UNIQUE,
  student_id INT NOT NULL,
  school_name VARCHAR(100) NOT NULL,
  address VARCHAR(255),
  phone VARCHAR(20),
  grade_level VARCHAR(50),
  year_attended VARCHAR(20),
  transcript_received BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  deleted_by INT NULL,
  created_by INT NULL,
  updated_by INT NULL,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 028_scholarships
CREATE TABLE scholarships (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL UNIQUE,
  student_id INT NOT NULL,
  scholarship_type VARCHAR(50) NOT NULL,
  percentage DECIMAL(5,2),
  amount DECIMAL(10,2),
  academic_year_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'CANCELLED') DEFAULT 'REQUESTED',
  approval_date DATE NULL,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  deleted_by INT NULL,
  created_by INT NULL,
  updated_by INT NULL,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);

-- 029_scholarship_history
CREATE TABLE scholarship_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  scholarship_id INT NOT NULL,
  from_status ENUM('REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'CANCELLED'),
  to_status ENUM('REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'CANCELLED') NOT NULL,
  reason TEXT,
  changed_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (scholarship_id) REFERENCES scholarships(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id)
);

-- 030_scholarship_documents
CREATE TABLE scholarship_documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  scholarship_id INT NOT NULL,
  document_id INT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (scholarship_id) REFERENCES scholarships(id) ON DELETE CASCADE,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  UNIQUE KEY uk_scholarship_document (scholarship_id, document_id)
);

-- 031_documents
CREATE TABLE documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL UNIQUE,
  student_id INT NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  title VARCHAR(100) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  file_name VARCHAR(100) NOT NULL,
  file_size INT,
  mime_type VARCHAR(50),
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  upload_date DATE DEFAULT (CURRENT_DATE),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  deleted_by INT NULL,
  created_by INT NULL,
  updated_by INT NULL,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 032_document_folders
CREATE TABLE document_folders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  description VARCHAR(255),
  parent_id INT NULL,
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES document_folders(id) ON DELETE CASCADE
);

-- 033_document_types
CREATE TABLE document_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL,
  description VARCHAR(255),
  icon VARCHAR(50),
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLAS DE SALUD Y CALENDARIO
-- =====================================================

-- 034_medical_records
CREATE TABLE medical_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL UNIQUE,
  student_id INT NOT NULL,
  medical_condition TEXT,
  allergies TEXT,
  medications TEXT,
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(20),
  health_insurance VARCHAR(100),
  insurance_number VARCHAR(50),
  notes TEXT,
  last_checkup_date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  deleted_by INT NULL,
  created_by INT NULL,
  updated_by INT NULL,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 035_medical_documents
CREATE TABLE medical_documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  medical_record_id INT NOT NULL,
  document_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (medical_record_id) REFERENCES medical_records(id) ON DELETE CASCADE,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  UNIQUE KEY uk_medical_document (medical_record_id, document_id)
);

-- 036_school_calendar
CREATE TABLE school_calendar (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL UNIQUE,
  branch_id INT NULL,
  academic_year_id INT NULL,
  date DATE NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  event_type ENUM('HOLIDAY', 'EXAM', 'EVENT', 'MEETING', 'DEADLINE', 'OTHER') NOT NULL,
  is_holiday BOOLEAN DEFAULT FALSE,
  is_working_day BOOLEAN DEFAULT TRUE,
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  deleted_by INT NULL,
  created_by INT NULL,
  updated_by INT NULL,
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);

-- =====================================================
-- TABLAS DE REPORTES Y TRANSCRIPCIONES
-- =====================================================

-- 037_reports
CREATE TABLE reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL UNIQUE,
  category ENUM('attendance', 'grades', 'progress-reports', 'report-cards', 'academic-history', 'transcripts', 'scholarships', 'graduation') NOT NULL,
  student_id INT NOT NULL,
  academic_period_id INT NULL,
  academic_year_id INT NULL,
  report_date DATE DEFAULT (CURRENT_DATE),
  status ENUM('DRAFT', 'OFFICIAL', 'ARCHIVED', 'REPRINTED') DEFAULT 'DRAFT',
  version_number INT DEFAULT 1,
  pdf_path VARCHAR(255),
  pdf_url VARCHAR(255),
  generated_by INT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  deleted_by INT NULL,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (academic_period_id) REFERENCES academic_periods(id),
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
  FOREIGN KEY (generated_by) REFERENCES users(id)
);

-- 038_report_versions
CREATE TABLE report_versions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  report_id INT NOT NULL,
  version_number INT NOT NULL,
  status ENUM('DRAFT', 'OFFICIAL', 'ARCHIVED', 'REPRINTED') DEFAULT 'DRAFT',
  pdf_path VARCHAR(255),
  pdf_url VARCHAR(255),
  generated_by INT NULL,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  version_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  FOREIGN KEY (generated_by) REFERENCES users(id),
  UNIQUE KEY uk_report_version (report_id, version_number)
);

-- 039_transcripts
CREATE TABLE transcripts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL UNIQUE,
  student_id INT NOT NULL,
  academic_period_id INT NULL,
  academic_year_id INT NULL,
  transcript_type ENUM('OFFICIAL', 'UNOFFICIAL') NOT NULL,
  status ENUM('DRAFT', 'OFFICIAL', 'ARCHIVED', 'REPRINTED') DEFAULT 'DRAFT',
  version_number INT DEFAULT 1,
  pdf_path VARCHAR(255),
  pdf_url VARCHAR(255),
  generated_by INT NULL,
  approved_by INT NULL,
  approved_at TIMESTAMP NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  deleted_by INT NULL,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (academic_period_id) REFERENCES academic_periods(id),
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
  FOREIGN KEY (generated_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- 040_transcript_courses
CREATE TABLE transcript_courses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  transcript_id INT NOT NULL,
  subject_id INT NOT NULL,
  grade_value DECIMAL(5,2),
  grade_letter VARCHAR(2),
  credits DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (transcript_id) REFERENCES transcripts(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

-- 041_transcript_versions
CREATE TABLE transcript_versions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  transcript_id INT NOT NULL,
  version_number INT NOT NULL,
  status ENUM('DRAFT', 'OFFICIAL', 'ARCHIVED', 'REPRINTED') DEFAULT 'DRAFT',
  pdf_path VARCHAR(255),
  pdf_url VARCHAR(255),
  generated_by INT NULL,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  version_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (transcript_id) REFERENCES transcripts(id) ON DELETE CASCADE,
  FOREIGN KEY (generated_by) REFERENCES users(id),
  UNIQUE KEY uk_transcript_version (transcript_id, version_number)
);

-- =====================================================
-- TABLAS DE GRADUACIÓN Y GRANSIF
-- =====================================================

-- 042_graduation_records
CREATE TABLE graduation_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL UNIQUE,
  student_id INT NOT NULL,
  academic_year_id INT NOT NULL,
  graduation_date DATE NOT NULL,
  status ENUM('PENDING', 'VALIDATED', 'COMPLETED') DEFAULT 'PENDING',
  requirements_met BOOLEAN DEFAULT FALSE,
  validation_notes TEXT,
  certificate_number VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  deleted_by INT NULL,
  created_by INT NULL,
  updated_by INT NULL,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);

-- 043_gransif_records
CREATE TABLE gransif_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL UNIQUE,
  student_id INT NOT NULL,
  academic_year_id INT NOT NULL,
  assessment_date DATE NOT NULL,
  score DECIMAL(5,2),
  status ENUM('PENDING', 'ACTIVE', 'COMPLETED') DEFAULT 'PENDING',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  deleted_by INT NULL,
  created_by INT NULL,
  updated_by INT NULL,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);

-- =====================================================
-- TABLAS DE LOGS Y CONFIGURACIÓN
-- =====================================================

-- 044_activity_logs
CREATE TABLE activity_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  module VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  record_code VARCHAR(20),
  details JSON,
  ip VARCHAR(45),
  user_agent VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_activity_user (user_id),
  INDEX idx_activity_module (module),
  INDEX idx_activity_created (created_at)
);

-- 045_audit_logs
CREATE TABLE audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  action VARCHAR(50) NOT NULL,
  module VARCHAR(50) NOT NULL,
  record_code VARCHAR(20),
  `before` JSON,
  `after` JSON,
  reason TEXT,
  ip VARCHAR(45),
  user_agent VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_module (module),
  INDEX idx_audit_record (record_code),
  INDEX idx_audit_created (created_at)
);

-- 046_system_settings
CREATE TABLE system_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NULL,
  setting_key VARCHAR(50) NOT NULL,
  setting_value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_setting (user_id, setting_key)
);

-- 047_translations
CREATE TABLE translations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  locale VARCHAR(5) NOT NULL,
  `key` VARCHAR(100) NOT NULL,
  value TEXT NOT NULL,
  namespace VARCHAR(50) DEFAULT 'global',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_translation (locale, `key`, namespace)
);

-- =====================================================
-- ÍNDICES ADICIONALES PARA RENDIMIENTO
-- =====================================================

-- Índices para students
CREATE INDEX idx_students_branch ON students(branch_id);
CREATE INDEX idx_students_academic_year ON students(academic_year_id);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_grade ON students(grade);

-- Índices para grade_records
CREATE INDEX idx_grades_student ON grade_records(student_id);
CREATE INDEX idx_grades_subject ON grade_records(subject_id);
CREATE INDEX idx_grades_period ON grade_records(academic_period_id);
CREATE INDEX idx_grades_status ON grade_records(status);

-- Índices para attendance_records
CREATE INDEX idx_attendance_assignment ON attendance_records(assignment_id);
CREATE INDEX idx_attendance_student ON attendance_records(student_id);
CREATE INDEX idx_attendance_date ON attendance_records(date);

-- Índices para academic_assignments
CREATE INDEX idx_assignments_teacher ON academic_assignments(teacher_id);
CREATE INDEX idx_assignments_subject ON academic_assignments(subject_id);
CREATE INDEX idx_assignments_branch ON academic_assignments(branch_id);
CREATE INDEX idx_assignments_academic_year ON academic_assignments(academic_year_id);