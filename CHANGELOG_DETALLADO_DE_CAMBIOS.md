# ACADEMIX 2.0 — Registro Detallado de Cambios y Mejoras Implementadas

**Fecha de Consolidación:** Agosto 2026  
**Versión:** 2.0.0 (Master Release)  
**Institución:** New Direction Academy (Academic Year 2026–2027)  
**Stack:** React 18 + Vite + Node.js + Express + Knex.js + MySQL/MariaDB + pdfmake  

---

## 1. Base de Datos y Migraciones (Knex / MySQL)

1. **Corrección de Clave Única en Calificaciones (`grade_records`):**
   - **Archivo:** `database/migrations/019_create_grade_records.js` y `database/schema/schema.sql`.
   - **Problema previo:** La clave única era `(student_id, subject_id, assignment_id)`, lo que provocaba un error de clave duplicada (`ER_DUP_ENTRY`) al intentar registrar notas para Q2, Q3 o Q4.
   - **Solución:** Se actualizó la clave única a:
     ```sql
     UNIQUE KEY uk_student_subject_assignment (student_id, subject_id, assignment_id, academic_period_id)
     ```

2. **Estandarización de Estados de Asistencia (Regla 20):**
   - **Archivos:** `database/migrations/017_create_attendance_records.js`, `018_create_attendance_history.js` y `schema.sql`.
   - **Problema previo:** Usaba los estados obsoletos `('PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'EARLY_DEPARTURE')`.
   - **Solución:** Se cambiaron a los 4 estados oficiales del formato de New Direction Academy:
     ```sql
     status ENUM('P', 'O', 'E', 'U') NOT NULL
     ```
     *(P = Present, O = Online, E = Excused, U = Unexcused)*.

3. **Campos Completos en la Entidad Estudiantes (`students`):**
   - **Archivos:** `database/migrations/008_create_students.js` y `schema.sql`.
   - **Campos agregados:** `middle_name` (VARCHAR 50), `second_last_name` (VARCHAR 50), `identification_type` (VARCHAR 20), `identification_number` (VARCHAR 50) y `photo_url` (VARCHAR 255).

4. **Campos Completos en Docentes (`teachers`):**
   - **Archivos:** `database/migrations/010_create_teachers.js` y `schema.sql`.
   - **Campos agregados:** `middle_name` (VARCHAR 50), `identification_number` (VARCHAR 50) y `photo_url` (VARCHAR 255).

5. **Campos Completos en Tutores / Encargados (`guardians`):**
   - **Archivos:** `database/migrations/011_create_guardians.js` y `schema.sql`.
   - **Campos agregados:** Separación en `first_name` y `last_name`, `identification` (VARCHAR 50), `secondary_phone` (VARCHAR 20), `authorized_pickup` (BOOLEAN) y `status` (ENUM 'ACTIVE', 'INACTIVE').

6. **Nueva Migración Incremental (`048_alter_existing_tables.js`):**
   - Creada para aplicar automáticamente todas las modificaciones de columnas en bases de datos que ya habían sido migradas previamente.

---

## 2. Generador Atómico de Códigos Únicos (Regla 2)

- **Archivo:** `backend/src/utils/codeGenerator.js`.
- **Problema previo:** No utilizaba la tabla `code_sequences` y recurría a números pseudoaleatorios con `Math.random()`.
- **Solución:** Reescrito con transacciones atómicas y bloqueo `FOR UPDATE` sobre `code_sequences` para garantizar correlatividad estricta sin colisiones:
  - Estudiantes: `STU-2026-000001`
  - Docentes: `TEA-2026-000001`
  - Encargados: `GUA-2026-000001`
  - Documentos: `DOC-2026-000001`
  - Asistencias: `ATT-2026-000001`
  - Calificaciones: `GRA-2026-000001`
  - Asignaciones: `ASN-2026-000001`
  - Solicitudes de Cambio: `REQ-2026-000001`
  - Reportes: `REP-2026-000001`
  - Transcripts: `TRN-2026-000001`
  - Becas: `SCH-2026-000001`
  - Auditoría: `AUD-2026-000001`
- **Corrección en Servicios:** Se actualizaron los 20 servicios del backend para invocar sus prefijos estandarizados.

---

## 3. Motor de Asistencias y Grilla Mensual Landscape 1..31

1. **Validadores Backend:**
   - `backend/src/validators/attendance.validator.js` actualizado para aceptar únicamente `['P', 'O', 'E', 'U']`.
2. **Modelo y Servicio de Asistencia:**
   - `backend/src/models/attendance.model.js` y `backend/src/services/attendance.service.js`.
   - Implementación de `getMonthlyGrid`:
     - Cálculo de días reales del mes calendario (28, 29, 30 o 31 días).
     - Mapeo automático del día de la semana (`Su, M, Tu, W, Th, F, Sa`).
     - Detección de fines de semana y exclusión de feriados escolares desde `school_calendar`.
     - Cálculo automático por alumno de: `Total Present = P + O`, `Total Absent = E + U` y `Attendance Rate %`.
3. **Rutas y Controladores:**
   - `GET /api/attendance/monthly/:assignmentId/:year/:month`
   - `GET /api/attendance/student/:studentId/:year/:month`
   - `POST /api/attendance/daily` (bulk upsert diario).
4. **Frontend Grilla Mensual:**
   - Creado `frontend/src/features/attendance/pages/MonthlyAttendancePage.jsx` con matriz interactiva, leyenda de estados por colores y edición en vivo.

---

## 4. Calificaciones, Regla de 24 Horas y Flujo de Aprobación

1. **Control de Ventana Temporal (Regla 4):**
   - `backend/src/services/grades.service.js` calcula automáticamente `edit_deadline = created_at + 24 Hours`.
   - Si se intenta editar después de 24 horas, el sistema bloquea el registro (`status = 'LOCKED'`) y devuelve el error estándar:
     ```json
     {
       "success": false,
       "code": "GRADE_EDIT_WINDOW_EXPIRED",
       "message": "The 24-hour grade modification window has expired. Please submit a Grade Change Request."
     }
     ```
2. **Job de Bloqueo Automático:**
   - `backend/src/jobs/gradeLockJob.js` configurado para bloquear calificaciones expiradas en segundo plano y registrar la auditoría correspondiente.
3. **Flujo de Solicitud de Cambio de Nota (`Grade Change Requests`):**
   - `backend/src/services/gradeChangeRequests.service.js`: En el método `approve`, se ejecuta una transacción atómica que:
     1. Marca la solicitud como `APPROVED`.
     2. Actualiza `grade_records.grade_value` al valor solicitado y desbloquea el registro (`status = 'UNLOCKED'`).
     3. Inserta el registro histórico en `grade_history` (nota anterior, nueva nota, motivo y usuario autorizador).
     4. Registra el evento en `audit_logs`.
4. **Endpoint Docente:**
   - `POST /api/grades/:id/request-change` añadido en `backend/src/routes/grades.routes.js`.

---

## 5. Motor de Generación PDF y Plantillas Oficiales

1. **Instalación de `pdfmake`:**
   - Instalado en `backend/package.json` para compilación directa en servidor.
2. **Servicio PDF Centralizado (`backend/src/services/pdf.service.js`):**
   - **Plantilla 1: `RP 26-27` (Progress Report & Report Card):**
     - Encabezado oficial: *NEW DIRECTION ACADEMY, 2026 - 2027, 3501 W Vine Street Suite 225, Kissimmee FL, "A SCHOOL WHERE EVERYONE IS SOMEONE"*.
     - Filas dinámicas de materias con notas Q1, Q2, Q3, Q4 y Final.
     - Bloque de asistencia integrado (*Days Present, Days Absence, Tardy to School*).
     - Comentarios y líneas de firma para padres y directores.
   - **Plantilla 2: `NEW HIGH SCHOOL TRANSCRIPT 26-27` (Official Transcript):**
     - Información completa del estudiante.
     - Historial académico multi-anual agrupado por año escolar y nivel de grado.
     - Resumen de créditos acumulados y GPA acumulativo (Escala 4.00).
     - Registro de escuelas previas (`previous_schools`) y créditos transferidos.
     - Resumen de diploma y bloque de certificación con sello oficial.
   - **Plantilla 3: `Monthly Class Attendance`:**
     - Formato horizontal (Landscape) con matriz 1..31 días, columnas de resumen O/U/E/P y tasa de asistencia.
3. **Conexión de Servicios:**
   - `progressReports.service.js`, `reportCards.service.js` y `transcripts.service.js` conectados al motor PDF real con datos dinámicos de base de datos.

---

## 6. Frontend: Expediente del Estudiante y Navegación Jerárquica

1. **Expediente del Estudiante (`StudentRecordPage.jsx`):**
   - Creado en `frontend/src/features/students/pages/StudentRecordPage.jsx`.
   - **8 Pestañas Interactivas:**
     1. *Overview:* Resumen con KPIs, datos clave y accesos directos de generación.
     2. *Academic & Grades:* Tabla de calificaciones del ciclo con letras y estados.
     3. *Attendance:* Registro de asistencias con estados visuales `P/O/E/U`.
     4. *Guardians:* Lista de tutores con teléfonos de contacto y autorización de retiro.
     5. *Documents:* Expediente de archivos digitales del estudiante.
     6. *Medical Record:* Información médica, seguro, alergias y contactos de emergencia.
     7. *Scholarships:* Becas asignadas con porcentajes y estados.
     8. *Academic History:* Historial consolidado de años anteriores.
2. **Barra Lateral Jerárquica (`MainLayout.jsx`):**
   - Reestructurado con menús desplegables (Acordeones MUI) organizados conforme a la Sección 5 del Plan Maestro:
     - *Dashboard*
     - *Students* (List, Guardians, Documents, Medical Records, Academic History, Previous Schools)
     - *Teachers* (List, My Assignments, Subjects)
     - *Attendance* (Daily Attendance, Monthly Grid)
     - *Grades* (Gradebook, Academic Periods, Grade Change Requests, Credits, GPA)
     - *Scholarships*
     - *Report Center* (All Reports, Progress Reports, Report Cards RP 26-27, Official Transcripts)
     - *Graduation* (Graduation Center, GRANSIF)
     - *Branches & School Calendar*
     - *Administration* (Users, Roles, Permissions, Academic Years, Audit Logs, Activity Feed, System Settings)
3. **Actualización de Enrutador (`App.jsx`):**
   - Registradas las rutas `/attendance/monthly/:assignmentId` y `/students/:id/record`.

---

## 7. Documentación Técnica Oficial (`docs/`)

Se redactaron y completaron los 12 manuales y especificaciones del sistema:
1. `docs/API.md` — Especificación de todos los endpoints REST, payloads y códigos de error.
2. `docs/ARCHITECTURE.md` — Diagrama de arquitectura del sistema en capas.
3. `docs/DATABASE.md` — Diccionario de datos y relaciones de las 48 migraciones.
4. `docs/INSTALLATION.md` — Guía paso a paso de instalación, configuración `.env` y ejecución.
5. `docs/PERMISSIONS.md` — Matriz de roles (`SUPER_ADMIN`, `ADMIN`, `TEACHER`) y permisos granulares.
6. `docs/REPORTS.md` — Guía de generación de reportes y versionado inmutable.
7. `docs/ATTENDANCE.md` — Reglas de asistencia, matriz landscape y estados `P/O/E/U`.
8. `docs/GRADES.md` — Regla de edición de 24 horas y flujo de solicitudes de cambio.
9. `docs/TRANSCRIPTS.md` — Estructura del High School Transcript y cálculo de GPA/Créditos.
10. `docs/USER_GUIDE.md` — Guía de usuario para docentes y administradores.
11. `docs/DEMO_ACCOUNTS.md` — Credenciales de cuentas de prueba para el ciclo 2026–2027.
12. `docs/CHANGELOG.md` — Historial de versiones y notas de lanzamiento.

---

## 8. Verificación de Integridad y Calidad

- **Verificación de Sintaxis Backend:** `node --check` ejecutado sobre la totalidad de archivos JavaScript en `backend/src/` $\rightarrow$ **0 Errores**.
- **Verificación de Rutas Frontend:** Todos los enlaces del Sidebar y vistas de subrutas conectadas a sus componentes reales sin rutas huérfanas ni formularios ficticios.
