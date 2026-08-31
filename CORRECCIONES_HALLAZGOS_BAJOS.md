# ACADEMIX 2.0 — Corrección de hallazgos de severidad baja

Corrección de los 3 hallazgos 🟢 de la auditoría de seguridad. Cada punto
indica los archivos tocados y el razonamiento del fix; los comentarios
`// FIX (auditoria hallazgo bajo #N ...)` en el código apuntan de vuelta a
esta lista.

## 1. Límite de tamaño de body JSON muy alto (50MB)

**Antes:** `app.js` fijaba `express.json({ limit: '50mb' })` y
`express.urlencoded({ limit: '50mb' })` para cualquier request, muy por
encima de lo que necesita cualquier endpoint JSON real de esta API
(formularios, filtros, payloads de negocio — todos del orden de unos pocos
KB). Los archivos (fotos, PDFs, documentos) nunca pasaron por este parser:
viajan como `multipart/form-data` a través de `multer`, con su propio
límite independiente (`UPLOAD_MAX_SIZE_MB`, ver
`middleware/upload.middleware.js`). El límite de 50MB solo ampliaba la
superficie de ataque para denegación de servicio por payloads JSON
grandes (CPU/memoria parseando un body gigante) sin ningún beneficio
funcional.

**Ahora:**
- `backend/src/config/env.js`: nueva variable `JSON_BODY_LIMIT` (default
  `2mb`, configurable por entorno si algún despliegue concreto necesitara
  otro valor).
- `backend/src/app.js`: `express.json()` y `express.urlencoded()` usan
  `config.JSON_BODY_LIMIT` en vez de `'50mb'` hardcodeado.
- `backend/.env.example`: documentada la nueva variable.

## 2. Falta de autenticación de dos factores (2FA)

**Antes:** no existía ningún segundo factor — cualquier cuenta,
incluidas las administrativas (`ADMIN`/`SUPER_ADMIN`), quedaba protegida
únicamente por su contraseña.

**Ahora:** TOTP (RFC 6238, el estándar de Google Authenticator, Authy,
1Password, etc.) con códigos de respaldo de un solo uso, activable por
cada usuario desde su propio perfil.

- `database/migrations/054_add_users_2fa.js` (nueva): agrega a `users`
  las columnas `twofa_secret`, `twofa_pending_secret`, `twofa_enabled`,
  `twofa_backup_codes` y `twofa_enabled_at`.
- `backend/src/utils/twoFactor.js` (nuevo): implementación de TOTP sobre
  el módulo `crypto` nativo de Node (sin dependencias externas para la
  parte criptográfica) — generación/verificación de código con
  tolerancia de ±1 paso de reloj, construcción de la URI `otpauth://`
  para el QR, y generación/hash (bcrypt)/consumo de códigos de respaldo.
  Verificada contra los vectores de prueba oficiales del RFC 6238.
- `backend/src/config/jwt.js`: los JWT ahora llevan un campo `type`
  (`access` / `refresh` / `2fa_challenge`) que `verify()`/`verifyRefresh()`
  validan explícitamente, y se agrega
  `signTwoFactorChallenge`/`verifyTwoFactorChallenge` para el token
  intermedio de 5 minutos que representa "contraseña correcta, falta el
  segundo factor" — sin esto, nada impediría que ese token intermedio se
  usara como si fuera una sesión real.
- `backend/src/models/users.model.js` y
  `backend/src/repositories/users.repository.js`: métodos para leer/
  escribir el estado de 2FA (`findTwoFactorState`,
  `setPendingTwoFactorSecret`, `enableTwoFactor`, `disableTwoFactor`,
  `replaceBackupCodes`). Los campos de 2FA se dejaron fuera de `FIELDS`
  (usado por `findAll`/`findById`) para no exponer accidentalmente
  secretos/hashes en listados o respuestas de perfil que reusen esas
  consultas.
- `backend/src/services/auth.service.js`:
  - `login()`: si `twofa_enabled` es `true`, ya no emite tokens de sesión
    tras validar la contraseña — devuelve un `challengeToken` de 5
    minutos.
  - `verifyTwoFactor()` (nuevo): canjea el `challengeToken` + un código
    (TOTP o de respaldo) por una sesión real. Los intentos fallidos de
    código cuentan contra el mismo mecanismo de bloqueo por cuenta que ya
    existía para contraseñas (`registerFailedLogin`/`locked_until`) — sin
    esto, alguien que ya conoce la contraseña de la víctima podría probar
    los 10⁶ códigos TOTP posibles sin límite.
  - `setupTwoFactor()` / `confirmTwoFactor()` (nuevos): flujo de alta en
    dos pasos — se genera un secreto "pendiente" y solo se activa de
    verdad (y se emiten los códigos de respaldo) cuando el usuario
    demuestra, con un código válido, que lo registró correctamente en su
    app autenticadora.
  - `disableTwoFactor()` / `regenerateBackupCodes()` (nuevos): ambos
    exigen la contraseña actual, no solo una sesión activa — son acciones
    que reducen o rotan la seguridad de la cuenta, y una sesión dejada
    abierta sin bloquear no debería bastar para ejecutarlas.
- `backend/src/controllers/auth.controller.js` y
  `backend/src/routes/auth.routes.js`: nuevos endpoints
  `POST /auth/2fa/verify` (mismo rate limiter que `/login`, ya que es la
  misma superficie de fuerza bruta), y `POST /auth/2fa/setup`,
  `/2fa/confirm`, `/2fa/disable`, `/2fa/backup-codes/regenerate`
  (protegidos con `authenticate`, autoservicio sobre la propia cuenta).
- `backend/src/services/auth.service.js#getCurrentUser`: `GET /auth/me`
  ahora incluye `twofa_enabled` (nunca el secreto ni los códigos) para
  que el frontend sepa qué mostrar en el perfil.
- `backend/package.json`: nueva dependencia `qrcode`, usada solo para
  renderizar el QR del setup como imagen (`data:image/png;base64,...`)
  server-side — la URI `otpauth://` en sí no depende de esta librería.
- Frontend:
  - `frontend/src/context/AuthContext.jsx`: `login()` ahora puede
    devolver `{ twoFactorRequired: true, challengeToken }` en vez de
    abrir sesión; se agregan `verifyTwoFactor`, `setupTwoFactor`,
    `confirmTwoFactor`, `disableTwoFactor` y `regenerateBackupCodes`.
  - `frontend/src/pages/Login.jsx`: segundo paso del formulario de login
    cuando el backend pide el código de 2FA.
  - `frontend/src/pages/Profile.jsx`: nueva sección "Autenticación en Dos
    Pasos" con diálogos para activar (QR + código + códigos de respaldo
    mostrados una sola vez), desactivar y regenerar códigos de respaldo
    (estos dos últimos piden la contraseña actual).
  - `frontend/src/i18n/{en,es}/auth.json`: strings del paso de
    verificación 2FA en el login.
  - `frontend/src/i18n/{en,es}/profile.json`: strings de la nueva sección
    de seguridad en el perfil.
  - `frontend/src/i18n/{en,es}/common.json`: se agregó la key `copy`
    (botón "copiar" en el diálogo de códigos de respaldo).

**Nota de migración:** correr `npm run migrate` (o el flujo de
`db:fresh`) tras desplegar para aplicar `054_add_users_2fa.js`, y
`npm install` en `backend/` para instalar `qrcode`. La activación de 2FA
queda como opt-in por usuario — no se fuerza a ninguna cuenta existente
al desplegar esto; cada quien lo activa desde su perfil cuando quiera.

## 3. Oportunidades menores de endurecimiento de cabeceras

**Antes:** `app.js` usaba Helmet con su configuración de CSP por defecto
(pensada para apps que sirven su propio HTML/JS/CSS) y
`crossOriginResourcePolicy: { policy: 'cross-origin' }`, que permite que
cualquier origen cargue las respuestas de esta API sin restricción —
relevante en particular para los endpoints que sirven archivos (fotos,
documentos, boletines, transcripts).

**Ahora:** esta API nunca sirve HTML ni renderiza nada por sí misma —
solo responde JSON y streams de archivo binarios detrás de endpoints
autenticados/RBAC, consumidos por el frontend vía fetch/XHR con CORS y
convertidos a blob URLs (nunca vía `<img src>`, `<script src>` ni iframes
de terceros; ver también el hallazgo medio #4 sobre cómo se sirven esos
archivos hoy).
- `backend/src/app.js`: Helmet ahora define explícitamente
  `contentSecurityPolicy` con `default-src 'none'` y
  `frame-ancestors 'none'` (no hay ningún recurso legítimo que este
  servidor deba cargar o en el que deba embeberse), y
  `crossOriginResourcePolicy` se endurece de `'cross-origin'` a
  `'same-site'` — un tercero que intente hotlinkear un documento/foto vía
  `<img>`/`<script>` ya no puede, aunque conozca la URL exacta.

Si en el futuro algún módulo necesita servir contenido embebible por un
origen externo legítimo (ej. un widget público), esa CSP/CORP debe
relajarse de forma explícita y documentada para ESE módulo puntual, no
globalmente.
