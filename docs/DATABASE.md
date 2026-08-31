# ACADEMIX 2.0 — Database Schema Reference

## Architecture & Conventions
- **Engine:** MySQL 8.0 / MariaDB
- **Query Builder:** Knex.js with Connection Pooling
- **Soft Deletes:** `deleted_at` (TIMESTAMP NULL) and `deleted_by` (INT NULL)
- **Primary Keys:** AUTO_INCREMENT integer IDs
- **Sequential Codes:** Atomic sequential generation via `code_sequences` table

## Core Entities & Tables (48 Migrations)

### 1. Security & Identity
- `users`: Core account table with password hashes (bcrypt) and branch association.
- `roles`: Role definitions (`SUPER_ADMIN`, `ADMIN`, `TEACHER`).
- `permissions`: Granular action permissions (`module.action`).
- `role_permissions`: Many-to-many relationship between roles and permissions.
- `code_sequences`: Atomic counters for each prefix and year.

### 2. Academic Core
- `students`: Student profile with `middle_name`, `second_last_name`, `identification_number`, `photo_url`, `branch_id`, and `status`.
- `student_status_history`: Audit trail for status changes (`ACTIVE`, `GRADUATED`, `WITHDRAWN`, etc.).
- `teachers`: Teacher profiles with code `TEA-YYYY-NNNNNN`.
- `guardians`: Family & guardian profiles with code `GUA-YYYY-NNNNNN`.
- `student_guardians`: Many-to-many link with primary and authorized pickup flags.
- `subjects`: Academic subject catalogue with credit values and hours.
- `academic_years`: Annual cycles (e.g. 2026-2027).
- `academic_periods`: Quarters (Q1, Q2, Q3, Q4) with start/end dates.
- `academic_assignments`: Link between teacher, subject, grade, section, branch, and year.

### 3. Attendance & Grades
- `attendance_records`: Daily records with ENUM `('P', 'O', 'E', 'U')`.
- `attendance_history`: Audit log for attendance edits.
- `grade_records`: Grade entries with `edit_deadline` (24h) and composite unique key `(student_id, subject_id, assignment_id, academic_period_id)`.
- `grade_history`: Full versioning of every grade value alteration.
- `grade_change_requests`: Formal change requests (`REQ-YYYY-NNNNNN`) with approval flow.

### 4. Transcripts & Graduation
- `academic_history`: Permanent historical records across grades and years.
- `credits` & `credit_history`: Credit accumulation and tracking.
- `gpa_records` & `gpa_history`: Term and Cumulative GPA records.
- `previous_schools`: Transfer credits from external institutions.
- `transcripts` & `transcript_versions`: Official High School Transcripts (`TRN-YYYY-NNNNNN`).
- `graduation_records` & `gransif_records`: Final candidate validations.
