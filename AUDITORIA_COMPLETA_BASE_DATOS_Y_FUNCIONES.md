# Auditoría completa — ACADEMIX 2.0
Base de datos, migraciones, seeds y funciones del backend

Todo lo descrito aquí fue **verificado ejecutando el sistema real**: se instaló
MariaDB, se corrieron las migraciones y seeds, se levantó el backend
con `node src/server.js`, y se probó cada endpoint con peticiones HTTP reales
(login, CRUD, generación de PDFs, subida de archivos, aprobar/rechazar
solicitudes, etc.), no solo lectura de código.

> **Nota de la ronda 2 (esta actualización):** además de los 5 bugs originales
> (sección 1) se resolvieron los 4 hallazgos no bloqueantes que había dejado
> documentados la ronda 1 (sección 1 bis), y probándolos con datos reales
> aparecieron **2 bugs nuevos** que no se habían detectado antes (sección 1
> bis, puntos 1.9 y 1.10). El número total de migraciones pasó de 50 a 52.

---

## 1. Bugs corregidos (con evidencia de prueba)

### 1.1 Calendario roto — `whereYear()` / `whereMonth()` no existen en Knex
**Archivo:** `backend/src/models/calendar.model.js`
Estos son métodos de Laravel/Eloquent, no de Knex. Rompían con
`TypeError: query.whereYear is not a function` en tres funciones:
`findByMonth`, `countByMonth`, `findWorkingDays` — es decir, todo
`GET /api/calendar/:year/:month` y el cálculo de días laborables.

**Corrección:** reemplazado por `whereRaw('YEAR(??) = ?', [...])` /
`whereRaw('MONTH(??) = ?', [...])`, siguiendo el patrón que el propio archivo
ya usaba correctamente en `applyCalendarFilters()`.

**Prueba real:**
```
GET /api/calendar/2026/10 → HTTP 200, devuelve el evento de calendario sembrado
```

### 1.2 Columnas de auditoría faltantes en 4 tablas
**Tablas:** `permissions`, `grade_change_requests`, `reports`, `transcripts`
Los servicios de estos módulos escriben `created_by`/`updated_by` al crear o
actualizar, pero las migraciones originales (004, 021, 037, 039) nunca
crearon esas columnas. Rompía con `ER_BAD_FIELD_ERROR: Unknown column
'created_by'` al:
- Crear un permiso nuevo
- Crear/actualizar una solicitud de cambio de calificación
- Crear/actualizar un reporte (afecta también report-cards y
  progress-reports, que comparten la tabla `reports` filtrada por
  `category`)
- Crear/actualizar un transcript

**Corrección:** migración nueva `050_add_audit_columns_missing_tables.js`,
condicional (`hasColumn`) para no romper si ya se aplicó antes, con
`up`/`down` completos y foreign keys hacia `users`.

**Prueba real:**
```
POST /api/permissions   → HTTP 201, created_by:1, updated_by:1 guardados
POST /api/transcripts   → HTTP 201, created_by:1, updated_by:1 guardados
POST /api/grade-change-requests → HTTP 201, created_by:1, updated_by:1 guardados
```
También se probó el rollback (`knex migrate:down`) y re-aplicación
(`knex migrate:latest`) de esta migración: reversible y repetible sin error.

### 1.3 Preview de PDF roto en 3 módulos
**Archivos:** `transcripts.service.js`, `reportCards.service.js`,
`progressReports.service.js`
Cuando el PDF aún no existía en disco, `preview()` hacía
`return this.generate(id, user)`, pero `generate()` devuelve el registro
sanitizado de la BD (`{id, code, ...}`), no `{stream, filename, mimeType}`.
El controller intentaba `res.setHeader('Content-Type', undefined)` →
`TypeError: Invalid value "undefined" for header "Content-Type"`.

**Corrección:** `preview()` ahora llama a `generate()` y luego **relee el
registro** desde el repositorio para construir el stream correctamente.

**Prueba real:** generación de 3 PDFs reales de una página c/u:
```
GET /api/transcripts/1/preview      → HTTP 200, application/pdf, 4772 bytes
GET /api/report-cards/4/preview     → HTTP 200, application/pdf, 4762 bytes
GET /api/progress-reports/5/preview → HTTP 200, application/pdf, 4739 bytes
```

### 1.4 Seeds incompletos de `reports`
Los módulos `report-cards` y `progress-reports` comparten la tabla `reports`
filtrada por `category`, pero el seed original (`20_reports.seed.js`) solo
sembraba `grades`, `attendance` y `academic-history`. Resultado: esos dos
módulos no tenían ningún dato para probar `findAll`/`findById`/`preview` de
extremo a extremo.

**Corrección:** se agregaron 2 filas nuevas (`report-cards`,
`progress-reports`) al seed.

### 1.5 `code_sequences` nunca se inicializa — bug sistémico (el más grave)
**Archivo nuevo:** `database/seeds/23_code_sequences.seed.js`

La tabla `code_sequences` genera códigos únicos tipo `STU-2026-000001` vía
`utils/codeGenerator.js`. Los seeds insertan códigos **directamente**
(`STU-2026-000001`, `STU-2026-000002`, ...) sin pasar por `generateCode()`,
así que la secuencia real quedaba en `last_number = 0`. La primera vez que
la API creaba un registro nuevo para un prefijo que el seed ya había usado
**con el mismo prefijo que la app**, `generateCode()` volvía a generar
`-000001` y chocaba con `ER_DUP_ENTRY` contra el dato ya sembrado.

Se identificaron **11 tablas con riesgo real de colisión** (mismo prefijo en
seed y en la app): `students` (STU), `users` (USR), `subjects` (SUB),
`scholarships` (SCH), `gpa_records` (GPA), `previous_schools` (PSC),
`medical_records` (MED), `documents` (DOC), `school_calendar` (CAL),
`graduation_records` (GRD), `transcripts` (TRN).

**Corrección:** seed genérico que escanea el código real insertado en 26
tablas, agrupa por `prefijo+año`, y reserva en `code_sequences` el máximo
número ya usado. Corre al final (orden alfabético `23_` tras `22_`).

**Prueba real (la más importante de toda la auditoría):**
```
Antes del fix:  crear un estudiante nuevo tras sembrar → ER_DUP_ENTRY (STU-2026-000001 ya existe)
Después del fix: POST /api/students → HTTP 201, code: "STU-2026-000004"  (correlativo correcto, sin choque)
POST /api/transcripts → code: "TRN-2026-000002" (sin choque)
POST /api/documents/upload → code: "DOC-2026-000004" (sin choque)
```
También se corrió `npm run db:fresh` completo (rollback --all → migrate →
seed) simulando una instalación nueva desde cero, y `code_sequences` quedó
con 24 prefijos reservados correctamente tras el fresh install.

---

## 1 bis. Ronda 2 — hallazgos no bloqueantes resueltos (con evidencia de prueba)

### 1.6 Formato de respuesta `findAll` inconsistente entre módulos — resuelto
**Archivos:** `backend/src/controllers/{teachers,subjects,branches,academicYears,academicPeriods,gradeChangeRequests}.controller.js`
y los 6 `ListPage.jsx` correspondientes en el frontend.

Los 6 controllers devolvían `{success, data: {data:[...], total, page, pageSize}}`
(anidado) mientras los otros 24 devuelven la versión plana. Se confirmó que
los `services` ya devolvían el mismo shape en ambos casos — el bug estaba
solo en la línea `res.json()` del controller. Se aplanó la respuesta en los
6 controllers y se actualizaron los 6 `ListPage.jsx` que compensaban leyendo
`response.data?.data`, dejándolos consistentes con el resto de la app.

**Prueba real:**
```
GET /api/teachers?page=1&pageSize=5           → {success:true, data:[...], total:3, page:1, pageSize:5}
GET /api/subjects?page=1&pageSize=5           → {success:true, data:[...], total:3, page:1, pageSize:5}
GET /api/branches?page=1&pageSize=5           → {success:true, data:[...], total:2, page:1, pageSize:5}
GET /api/academic-years?page=1&pageSize=5     → {success:true, data:[...], total:1, page:1, pageSize:5}
GET /api/academic-periods?page=1&pageSize=5   → {success:true, data:[...], total:4, page:1, pageSize:5}
```
(las 5 respuestas verificadas con token real de `admin@academix.com`)

### 1.7 Código de error `INTERNAL_ERROR` en respuestas 404 — resuelto
**Archivo:** `backend/src/middleware/errorHandler.middleware.js`

En vez de tocar las 121 llamadas `throw new AppError(msg, 404)` que no
pasaban un `code` explícito (riesgo de introducir un error de copy-paste),
se agregó un mapeo central `DEFAULT_CODE_BY_STATUS` en el `errorHandler`
que asigna `NOT_FOUND`, `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`,
`CONFLICT` o `VALIDATION_ERROR` según el status HTTP cuando el error no
trae un `code` propio. Se verificó que ningún otro punto del código
(backend ni frontend) depende del string `INTERNAL_ERROR` para 404s.

**Prueba real:**
```
GET /api/teachers/99999 → HTTP 404, {"success":false,"code":"NOT_FOUND","message":"Teacher not found"}
GET /api/students/99999 → HTTP 404, {"success":false,"code":"NOT_FOUND","message":"Student not found"}
```

### 1.8 `docs/DEMO_ACCOUNTS.md` desactualizado y sin cuenta de profesor — resuelto
**Archivos:** `docs/DEMO_ACCOUNTS.md`, `database/seeds/03_users.seed.js`,
`database/seeds/04_teachers.seed.js`

Se reescribió `DEMO_ACCOUNTS.md` con las cuentas reales
(`admin@academix.com` / `admin2@academix.com`, `Admin123!`). Además se
resolvió el problema de fondo: ningún profesor sembrado tenía
`teachers.user_id` vinculado a un usuario, así que era imposible iniciar
sesión como docente. Se agregó una tercera cuenta,
`maria.gonzalez@academix.com` (rol TEACHER, misma contraseña), vinculada a
la primera fila de `04_teachers.seed.js` vía `user_id`.

**Prueba real:**
```
POST /api/auth/login {"email":"maria.gonzalez@academix.com","password":"Admin123!"}
→ HTTP 200, {"user":{"roles":["TEACHER"]}, "accessToken":"eyJ..."}
```

### 1.9 [BUG NUEVO] `audit_logs.record_code` truncaba emails largos — descubierto y resuelto
**Archivo nuevo:** `database/migrations/052_widen_record_code_columns.js`

Este bug **no estaba documentado en la ronda 1** y salió a la luz al
probar el fix 1.8: `audit_logs.record_code` y `activity_logs.record_code`
se crearon como `VARCHAR(20)` (migraciones 044/045), pensados para códigos
como `STU-2026-000001` (16 caracteres). Pero el módulo `auth` registra el
LOGIN usando el **email del usuario** como `record_code`. Los dos emails de
seed originales medían exactamente 20 caracteres, así que el bug nunca se
manifestó — hasta que se probó con `maria.gonzalez@academix.com` (28
caracteres) contra una base de datos real:

```
Antes del fix: POST /api/auth/login (email de 28 chars) → HTTP 500
  ER_DATA_TOO_LONG: Data too long for column 'record_code' at row 1
```

**Corrección:** migración 052 que amplía ambas columnas a `VARCHAR(100)`
(mismo tamaño que `users.email`). El `down()` es defensivo: si ya existe
algún registro con un valor más largo de 20 caracteres, se salta el shrink
en vez de truncar datos reales de auditoría o fallar a mitad del rollback.

**Prueba real (después del fix):**
```
POST /api/auth/login (maria.gonzalez@academix.com) → HTTP 200
SELECT record_code FROM audit_logs WHERE user_id=3 → "maria.gonzalez@academix.com" (28 chars, sin truncar)
```

### 1.10 [BUG NUEVO] `grade-change-requests` nunca calculaba `total` — descubierto y resuelto
**Archivos:** `backend/src/models/gradeChangeRequests.model.js`,
`backend/src/repositories/gradeChangeRequests.repository.js`,
`backend/src/services/gradeChangeRequests.service.js`

Al corregir el formato de respuesta (1.6) se probó el endpoint con datos
reales y apareció otro bug no documentado antes: a diferencia de todos los
demás módulos paginados, el `service` de `grade-change-requests` nunca
llamaba a un `count()` — el `model` ni siquiera tenía ese método. El
`total` que devolvía la API siempre venía `undefined`.

**Corrección:** se agregó `count(filters)` al modelo (mismo patrón que
`teachers.model.js`), se expuso en el repositorio, y el servicio ahora
corre `findAll` y `count` en paralelo, igual que el resto de los módulos.

**Prueba real:**
```
GET /api/grade-change-requests?page=1&pageSize=5 (sin datos) → total: 0
POST /api/grade-change-requests {...}            → HTTP 201, created_by/updated_by correctos
GET /api/grade-change-requests?page=1&pageSize=5 (tras crear) → total: 1  ✅
```

### 1.11 Diseño de `code_sequences`: `prefix` único globalmente, no por año — resuelto
**Archivo nuevo:** `database/migrations/051_fix_code_sequences_unique_constraint.js`

`code_sequences.prefix` tenía una restricción `UNIQUE` de una sola columna,
pero `generateCode()` filtra por `{prefix, year}`. Al cambiar de año
(2027), la primera vez que se generara un código para un prefijo ya usado
en 2026 el `INSERT` habría fallado por duplicado de `prefix`, aunque el año
fuera distinto.

**Corrección:** la migración busca el índice único real vía
`information_schema` (en vez de asumir el nombre por convención de Knex,
para no depender de cómo se creó originalmente la tabla) y lo reemplaza
por un índice único compuesto `(prefix, year)`.

**Prueba real:**
```sql
-- Antes: UNIQUE KEY code_sequences_prefix_unique (prefix)
-- Después de la migración 051:
SHOW INDEX FROM code_sequences;
→ UNIQUE KEY code_sequences_prefix_year_unique (prefix, year)
```
Verificado tanto tras una migración incremental como tras un
`npm run db:fresh` completo desde cero (rollback --all de las 52
migraciones → migrate → seed, sin errores).

---

## 2. Hallazgos adicionales (no bloqueantes, documentados para que los evalúes)

### 2.1 Prefijos de código inconsistentes entre seeds y la app
~15 de 26 tablas siembran un prefijo de código distinto al que la app
realmente genera (ej. `branches` siembra `BR-...` pero la app genera
`BRC-...`; `teachers` siembra `TCH-...` vs `TEA-...`; `roles` siembra
`ROLE-...` vs `ROL-...`; `permissions` siembra `PERM-...` vs `PRM-...`;
`guardians` `GU-...` vs `GUA-...`; `credits` `CRD-...` vs `CRE-...`;
`reports` `RPT-...` vs `REP-...`; `gransif` `GRF-...` vs `GRN-...`;
`academic_assignments` `AS-...` vs `ASN-...`; `academic_years` `YEA-...` vs
`AYR-...`; `academic_periods` `PER-...` vs `APR-...`).
**No causa errores** (de hecho evita colisiones), pero los datos de
demostración no lucen como los que generaría la app en producción. No se
corrigió porque tocar los seeds existentes podría romper referencias a esos
códigos en otras partes del sistema (documentación, tests, capturas de
pantalla de demo).

---

## 3. Barrido de pruebas ejecutado (resumen)

| Módulo | GET lista | Create | Update | Delete | Extra |
|---|---|---|---|---|---|
| auth | — | — | — | — | login ✅ |
| students | ✅ | ✅ | ✅ | ✅ (soft) | 404 tras delete ✅ |
| users | ✅ | ✅ | — | — | |
| teachers, subjects, branches | ✅ | — | — | — | |
| academic-years, academic-periods | ✅ | — | — | — | |
| academic-history | ✅ | — | — | — | |
| assignments, attendance, grades | ✅ | — | — | — | |
| grade-change-requests | ✅ | ✅ | — | — | approve ✅, reject ✅, nota real actualizada en grade_records ✅ |
| gpa, credits, scholarships | ✅ | — | — | — | |
| guardians, medical-records, previous-schools | ✅ | — | — | — | |
| documents | ✅ | ✅ (upload multipart) | — | — | rechazo de tipo de archivo no permitido ✅, download ✅, 404 correcto en demo sin PDF real ✅ |
| calendar | ✅ | — | — | — | bug whereYear/whereMonth corregido y probado ✅ |
| graduation, gransif | ✅ | — | — | — | |
| progress-reports, report-cards, transcripts | ✅ | ✅ (transcripts) | — | — | preview PDF corregido y probado en los 3 ✅ |
| reports | ✅ | — | — | — | |
| audit | ✅ | — | — | — | logs se registran correctamente en cada acción ✅ |
| activity | ✅ | — | — | — | 0 registros esperado (sin seed) ✅ |
| roles | ✅ | ✅ | — | — | |
| permissions | ✅ | ✅ | — | — | bug created_by corregido y probado ✅ |
| settings | ✅ | — | — | — | |

Todas las respuestas HTTP fueron 2xx/4xx esperados, sin ningún 500 no
manejado durante toda la sesión de pruebas (confirmado revisando
`/tmp/server.log`).

---

## 4. Cómo correr el proyecto desde cero (verificado paso a paso)

```bash
cd backend
npm install
npm run migrate      # 52 migraciones, incluye 050, 051 y 052
npm run seed         # 25 seeds, incluye el nuevo 23_code_sequences
npm start             # o npm run dev
```
O en un solo paso:
```bash
npm run db:fresh
```
Este ciclo completo (`migrate:rollback --all && migrate && seed`) se probó
y corre limpio de punta a punta.

---

## 5. Archivos modificados/creados en esta auditoría

**Nuevos (ronda 1):**
- `database/migrations/050_add_audit_columns_missing_tables.js`
- `database/seeds/23_code_sequences.seed.js`

**Nuevos (ronda 2):**
- `database/migrations/051_fix_code_sequences_unique_constraint.js`
- `database/migrations/052_widen_record_code_columns.js`
- `AUDITORIA_COMPLETA_BASE_DATOS_Y_FUNCIONES.md` (este archivo)

**Modificados (ronda 1):**
- `backend/src/models/calendar.model.js`
- `backend/src/services/transcripts.service.js`
- `backend/src/services/reportCards.service.js`
- `backend/src/services/progressReports.service.js`
- `database/seeds/20_reports.seed.js`

**Modificados (ronda 2):**
- `backend/src/controllers/teachers.controller.js`
- `backend/src/controllers/subjects.controller.js`
- `backend/src/controllers/branches.controller.js`
- `backend/src/controllers/academicYears.controller.js`
- `backend/src/controllers/academicPeriods.controller.js`
- `backend/src/controllers/gradeChangeRequests.controller.js`
- `backend/src/middleware/errorHandler.middleware.js`
- `backend/src/models/gradeChangeRequests.model.js`
- `backend/src/repositories/gradeChangeRequests.repository.js`
- `backend/src/services/gradeChangeRequests.service.js`
- `database/seeds/03_users.seed.js`
- `database/seeds/04_teachers.seed.js`
- `docs/DEMO_ACCOUNTS.md`
- `frontend/src/features/academicYears/pages/AcademicYearListPage.jsx`
- `frontend/src/features/branches/pages/BranchListPage.jsx`
- `frontend/src/features/academicPeriods/pages/AcademicPeriodListPage.jsx`
- `frontend/src/features/subjects/pages/SubjectListPage.jsx`
- `frontend/src/features/teachers/pages/TeacherListPage.jsx`
- `frontend/src/features/gradeChangeRequests/pages/GradeChangeRequestListPage.jsx`
