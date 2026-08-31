# ACADEMIX 2.0 — Corrección de Errores (Resumen)

## Contexto
El proyecto ACADEMIX 2.0 (backend Node.js/Express + frontend React/Vite, con MySQL/Knex) presentaba errores en tiempo de ejecución registrados en `backend/logs/error.log`. Los dos errores recurrentes eran:

1. `Table 'academix_v2.assignments' doesn't exist`
2. `Table 'academix_v2.report_center' doesn't exist`

Tras analizar la base de datos (`database/schema/schema.sql` y las migraciones Knex) se determinó que varios modelos referenciaban tablas que no existen o usaban nombres distintos a los definidos en el esquema. También se encontraron imports faltantes y un archivo de traducción con un espacio en el nombre.

## Fuente de verdad
El archivo `database/schema/schema.sql` (47 tablas) se utilizó como referencia única para validar todos los nombres de tabla usados en el código.

---

## Correcciones realizadas

### 1. Tablas inexistentes (nombres incorrectos en modelos)

| Archivo | Error | Corrección |
|---|---|---|
| `backend/src/models/reports.model.js` | `const TABLE = 'report_center'` (tabla inexistente) | `const TABLE = 'reports'` |
| `backend/src/models/assignments.model.js` | `const TABLE = 'assignments'` (tabla inexistente) | `const TABLE = 'academic_assignments'` |
| `backend/src/models/progressReports.model.js` | Usaba tabla inexistente `progress_reports` con campos `approved_by`/`approved_at` | Reescrito para usar `reports` con `category = 'progress-reports'` |
| `backend/src/models/reportCards.model.js` | Usaba tabla inexistente `report_cards` | Reescrito para usar `reports` con `category = 'report-cards'` |
| `backend/src/models/calendar.model.js` | `const TABLE = 'calendar_events'` (tabla inexistente) | `const TABLE = 'school_calendar'` |

### 2. Campos incorrectos (assignments: grade_id/section_id → grade/section)
La tabla `academic_assignments` usa columnas VARCHAR `grade` y `section`, no claves foráneas a tablas `grades`/`sections` (esas tablas no existen).

| Archivo | Corrección |
|---|---|
| `backend/src/models/assignments.model.js` | `grade_id`/`section_id` → `grade`/`section`; filtros `findAll` y `findBySection` actualizados |
| `backend/src/validators/assignments.validator.js` | Validadores `isInt()` para `grade_id`/`section_id` → `isString()` para `grade`/`section` |
| `backend/src/controllers/assignments.controller.js` | Desestructuración `gradeId`/`sectionId` → `grade`/`section` |
| `backend/src/services/assignments.service.js` | Paso de parámetros `gradeId`/`sectionId` → `grade`/`section` |
| `backend/src/routes/assignments.routes.js` | `:sectionId` → `:section` |

### 3. JOINs a tablas inexistentes (teachers.model.js)
`backend/src/models/teachers.model.js` — el método `getAssignments` hacía JOIN a tablas inexistentes `grades` y `sections`. Se corrigió para hacer JOIN a `subjects` y `academic_years` (tablas reales) y seleccionar las columnas VARCHAR `grade`/`section` de `academic_assignments`.

### 4. Imports faltantes (`fs`/`path`)
| Archivo | Corrección |
|---|---|
| `backend/src/services/progressReports.service.js` | Añadido `const fs = require('fs')` y `const path = require('path')` |
| `backend/src/services/reportCards.service.js` | Añadido `const fs = require('fs')` y `const path = require('path')` |
| `backend/src/services/transcripts.service.js` | Añadido `const fs = require('fs')` |

### 5. Frontend i18n — archivo con espacio en el nombre
| Archivo | Corrección |
|---|---|
| `frontend/src/i18n/en/common .json` | Renombrado a `frontend/src/i18n/en/common.json` |
| `frontend/src/i18n/index.js` | Import corregido: `'./en/common .json'` → `'./en/common.json'` |

---

## Verificación realizada

- **Sintaxis backend:** 220 archivos JS verificados con `node --check` → **0 errores**.
- **Sintaxis frontend:** 147 archivos JS/JSX validados con `@babel/parser` (plugin JSX) → **0 errores**.
- **Imports frontend:** 147 archivos verificados (resolución de imports relativos y paquetes npm) → **0 imports rotos**.
- **JSON i18n:** Todos los archivos de traducción validados con `jq` → **válidos**.
- **Cross-check de tablas:** Los 34 nombres de tabla referenciados en el backend (`db('...')` y `TABLE = '...'`) se compararon con las 47 tablas de `schema.sql` → **0 discrepancias**.
- **Bootstrap/jobs:** `app.js`, `server.js`, `jobs/index.js`, `gradeLockJob.js`, `reportArchiveJob.js` revisados → correctos (tablas `grade_records`, `report_versions`, `transcript_versions` existen en el esquema).

---

## Cómo usar el proyecto corregido

1. Descomprimir `ACADEMIX_2.0_corrected.zip`.
2. El zip **no incluye `node_modules`** (se excluyeron para reducir el tamaño). Reinstalar dependencias:
   - Raíz: `npm install`
   - Backend: `cd backend && npm install`
   - Frontend: `cd frontend && npm install`
3. Configurar la base de datos MySQL con las variables en `backend/.env` y ejecutar las migraciones:
   - `cd backend && npx knex migrate:latest`
   - `npx knex seed:run` (opcional)
4. Iniciar el backend: `cd backend && npm run dev`
5. Iniciar el frontend: `cd frontend && npm run dev`
