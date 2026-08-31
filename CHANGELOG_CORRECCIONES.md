# CHANGELOG — Correcciones aplicadas tras INFORME_TESTEO_COMPLETO.md

**Fecha:** 31 de agosto de 2026
**Metodología de verificación:** igual que la auditoría original — se instaló
MariaDB, se corrieron las 52 migraciones y 25 seeds contra una base limpia,
se levantó el backend real (`localhost:5000`) y se reprodujo cada hallazgo
con peticiones HTTP reales, no solo lectura de código.

---

## 🔴 Hallazgo #1 — ADMIN y TEACHER sin permisos

**Archivo:** `database/seeds/02_roles_permissions.seed.js` (reescrito)

ADMIN y TEACHER ahora reciben filas reales en `role_permissions`.

**Verificado en vivo:**
```
SELECT r.name, COUNT(rp.id) FROM roles r LEFT JOIN role_permissions rp ...
SUPER_ADMIN  120   (antes 29)
ADMIN        111   (antes 0)
TEACHER       23   (antes 0)
```
`GET /api/students` con token de `maria.gonzalez@academix.com` (TEACHER):
**200 OK** (antes 403). `GET /api/users` con `admin2@academix.com` (ADMIN):
**200 OK** (antes 403).

## 🔴 Hallazgo #2 — Catálogo de permisos incompleto (9/30 módulos)

Mismo archivo. El catálogo ahora cubre los 31 módulos reales que las rutas
exigen vía `authorize('modulo.accion')` (verificado con
`SELECT COUNT(DISTINCT module) FROM permissions` → 31, antes 9).

Se agregó `backend/tests/seeds/permissionsCatalog.test.js`: un test estático
que falla automáticamente si en el futuro se agrega una ruta con un permiso
que el seed no contempla.

## 🔴 Hallazgo #3 — Aislamiento por sede roto

**Archivos nuevos:** `backend/src/utils/branchScope.js`
**Archivos modificados:** `models/{students,teachers,users}.model.js`,
`services/{students,teachers,users}.service.js`

La validación real ahora carga el registro de la base y compara su
`branch_id` contra las sedes del usuario autenticado — nunca confía en lo
que mande el cliente. Se aplicó en listados, lecturas y mutaciones.

**Verificado en vivo (reproduciendo el escenario exacto de la auditoría):**
- Estudiante creado en Sede Norte (branch_id 2) como SUPER_ADMIN.
- Docente `maria.gonzalez` (Sede Principal, branch_id 1) → `GET /students/:id`:
  **404** (antes 200 con los datos completos).
- Mismo docente → `PUT /students/:id` con `{"phone":"999-999-9999"}` y sin
  `branch_id` en el body: **404**, el teléfono en la base **no cambió**
  (antes: 200 y el cambio se guardaba).
- `GET /students` (listado) del docente: devuelve solo estudiantes de
  branch_id 1; el estudiante de Sede Norte no aparece (antes: veía todas
  las sedes).

## 🟠 Hallazgo #4 — `report_date` NOT NULL sin default, validador opcional

**Archivos:** `services/reportCards.service.js`,
`services/progressReports.service.js` (mismo bug, misma tabla compartida
`reports` — no estaba en el informe original pero se encontró al revisar
los módulos similares que la auditoría marcó como pendientes).

Fallback `report_date: payload.report_date || new Date()` antes del insert.

**Verificado en vivo:** `POST /report-cards` y `POST /progress-reports` sin
`report_date` → **201 Created** en ambos, con `report_date` autocompletado
(antes: 500 crudo `ER_NO_DEFAULT_FOR_FIELD`).

Se revisaron también `transcripts` y `gransif` por el mismo patrón — ambos
están bien (sus columnas equivalentes son obligatorias también en el
validador, sin desajuste).

## 🟠 Hallazgo #5 — Mass assignment + fuga de stack trace (27 servicios)

**Archivo nuevo:** `backend/src/utils/pick.js`
**Archivos modificados:** los 26 servicios que hacían `...payload` directo
en el insert/update, whitelisteados contra las columnas reales de cada
modelo (excluyendo siempre `id`, `code`, `created_at`, `updated_at`,
`deleted_at`, `deleted_by`, `created_by`, `updated_by`).

Se detectó y corrigió además un problema introducido por el propio proceso
de whitelisting automático: `users.service.js` inicialmente exponía
`last_login`, `login_attempts` y `locked_until` como editables por el
cliente (son columnas reales pero de uso interno del sistema de auth) —
se excluyeron explícitamente para no permitir que un cliente desbloquee una
cuenta bloqueada por fuerza bruta.

**Verificado en vivo:** `POST /medical-records` con el campo inventado
`condition_name` (en vez de `medical_condition`) → **201 Created**, el
campo desconocido se ignora en silencio (antes: 500 crudo con stack trace
y rutas del servidor expuestas).

Tests de regresión: `backend/tests/utils/pick.test.js`.

## 🟡 Hallazgo #6 — Lint roto / sin tests

- `backend/eslint.config.js` (formato flat config de ESLint v9).
  `npm run lint` corre limpio: **0 errores**, 24 warnings preexistentes de
  variables no usadas (no bloqueantes).
- `backend/tests/` — 18 tests nuevos con Jest, todos verdes:
  - `tests/utils/pick.test.js` (5 tests) — whitelist de mass assignment.
  - `tests/utils/branchScope.test.js` (9 tests) — aislamiento por sede.
  - `tests/seeds/permissionsCatalog.test.js` (3 tests) — cobertura del
    catálogo de permisos contra las rutas reales.

---

## No modificado (fuera de alcance / revisado y descartado)

- Manejo de errores / `NODE_ENV`: revisado — el código ya es seguro por
  defecto (`stack` solo se incluye si `NODE_ENV === 'development'`
  explícitamente; si la variable no está seteada, no se expone). No se
  encontró una vulnerabilidad real aquí, contrario a la sospecha inicial
  del informe.
- Autorización a nivel de flujo de negocio en `grade-change-requests`
  (ej. si un ADMIN puede editar `status`/`reviewed_by` vía el endpoint
  genérico de update en vez de únicamente por `approve`/`reject`): existía
  antes de esta corrección (por mass assignment sin restricción) y sigue
  existiendo ahora de forma más acotada (columnas reales, no arbitrarias),
  pero rediseñar la separación de permisos de ese flujo específico excede
  el alcance de los hallazgos reportados.

## Cómo reproducir esta verificación

```bash
cd academix/backend
npm install
cp .env.example .env   # configurar credenciales de tu MariaDB local
npx knex migrate:latest --knexfile src/config/knexfile.js --env development
npx knex seed:run --knexfile src/config/knexfile.js --env development
npm test        # 18/18 tests
npm run lint     # 0 errores
npm start        # levanta el servidor en :5000 para pruebas manuales
```
