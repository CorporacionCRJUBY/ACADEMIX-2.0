# ACADEMIX 2.0 — Corrección de hallazgos de severidad media

Corrección de los 4 hallazgos 🟡 de una auditoría de seguridad. Cada punto
indica los archivos tocados y el razonamiento del fix; los comentarios
`// FIX (auditoria hallazgo medio #N ...)` en el código apuntan de vuelta a
esta lista.

## 1. Política de contraseñas débil

**Antes:** `auth.validator.js` y `users.validator.js` solo exigían
`isLength({ min: 8 })`, sin ningún requisito de complejidad — contraseñas
como `aaaaaaaa` o `12345678` pasaban la validación tanto al crear un
usuario como al cambiar su contraseña.

**Ahora:**
- `backend/src/utils/passwordPolicy.js` (nuevo): centraliza la regla real
  — mínimo 10 caracteres, con al menos una minúscula, una mayúscula, un
  número y un símbolo.
- `backend/src/validators/users.validator.js`: `create.password` y
  `changePassword.newPassword` usan `passwordPolicy.isStrongPassword`.
- `backend/src/validators/auth.validator.js`: `register.password` también
  actualizado por consistencia (esta ruta de auto-registro no está montada
  en `auth.routes.js` hoy — el alta real de usuarios es
  `POST /api/users`, ya cubierta arriba).

## 2. Tokens JWT en `localStorage`

**Antes:** `accessToken` y `refreshToken` se guardaban en `localStorage`
(`frontend/src/context/AuthContext.jsx`) y el frontend los adjuntaba a mano
en el header `Authorization`. Cualquier XSS puede leer `localStorage` con
JS y robar ambos tokens.

**Ahora:** los tokens viajan solo como cookies `httpOnly` que JavaScript no
puede leer.
- `backend/src/utils/cookies.js` (nuevo): setea/limpia las cookies
  `accessToken` (path `/`) y `refreshToken` (path `/api/auth`), con
  `httpOnly`, `secure` en producción y `sameSite: 'strict'` (defensa
  principal contra CSRF ahora que el token ya no depende de que el
  frontend lo ponga a mano en el header Authorization).
- `backend/src/app.js`: se agrega `cookie-parser`.
- `backend/src/middleware/auth.middleware.js`: lee el access token de la
  cookie; mantiene el header `Authorization: Bearer` como *fallback* solo
  para clientes no-navegador (apps móviles, integraciones server-to-server).
- `backend/src/controllers/auth.controller.js`: `login`/`refresh` ya no
  devuelven los tokens en el body JSON (solo el perfil del usuario);
  `logout`/`refresh` leen el refresh token de la cookie en vez del body.
- `backend/src/routes/auth.routes.js`: `/refresh` ya no valida
  `refreshToken` en el body (viaja por cookie).
- `frontend/src/api/axiosClient.js`: `withCredentials: true`, sin leer/
  escribir tokens en `localStorage`.
- `frontend/src/context/AuthContext.jsx`: la sesión se restaura al cargar
  la app con `GET /auth/me` (ya no se puede "ver" el token en
  `localStorage` para saber si hay sesión). Solo el perfil del usuario
  (no sensible) se sigue cacheando en `localStorage`, para pintar la UI
  sin parpadeo mientras se confirma la sesión con el backend.
- Dependencias nuevas en `backend/package.json`: `cookie-parser`, `ms`
  (esta última para que la duración de la cookie coincida exactamente con
  `JWT_EXPIRES_IN`).

## 3. Sin rate-limiting específico en el login

**Antes:** solo existía el rate limiter global (300 peticiones/15min por
IP para toda la API) — insuficiente para frenar enumeración de usuarios o
credential stuffing contra `/api/auth/login`, ya que el bloqueo por
intentos fallidos (`usersRepository.registerFailedLogin`) cuenta por
*usuario*, no por IP.

**Ahora:**
- `backend/src/middleware/authRateLimit.middleware.js` (nuevo): 10
  intentos/15min por IP, sin contar logins exitosos
  (`skipSuccessfulRequests`).
- `backend/src/routes/auth.routes.js`: aplicado a `POST /auth/login`.

## 4. Archivos subidos validados solo por extensión/MIME del cliente

**Antes:** `middleware/upload.middleware.js` aceptaba un archivo si
`file.originalname` y `file.mimetype` decían ser un tipo permitido — ambos
valores los controla el cliente por completo (se pueden falsificar
renombrando el archivo y forzando el `Content-Type` del request
multipart), sin inspeccionar el contenido real.

**Ahora:**
- `backend/src/utils/fileSignature.js` (nuevo): lee los primeros bytes del
  archivo ya escrito en disco y los compara contra la firma real de cada
  formato permitido (PDF, JPEG, PNG, `.docx`/`.xlsx` como ZIP/Office Open
  XML, `.doc`/`.xls` como OLE Compound File; `.csv` se valida como texto
  plano sin firmas de ejecutable/script). Sin dependencia externa, para
  evitar la fricción CJS/ESM de paquetes tipo `file-type` en sus versiones
  recientes.
- `backend/src/middleware/upload.middleware.js`: nuevo middleware
  `verifyFileContent`, encadenado después de multer en `single/array/
  fields/any`. Si el contenido no coincide con la extensión declarada,
  borra el/los archivo(s) recién subido(s) y responde `400
  INVALID_FILE_CONTENT` — nunca llega al controlador ni queda un archivo
  huérfano en `/uploads`.
- El filtro original por MIME/extensión (`fileFilter`) se conserva como
  primer descarte barato antes de escribir a disco, pero ya no es la
  única barrera.

**Nota:** `backend/src/config/multer.js` es una configuración de multer
más antigua y sin filtro de tipos, pero no está referenciada desde ningún
router (código muerto) — se deja fuera de este fix; si se reactiva en el
futuro debe pasar por `middleware/upload.middleware.js`, no usarse
directamente.

## Pendiente para quien despliegue esto

- Correr `npm install` en `backend/` para traer `cookie-parser` y `ms`.
- Los tokens ahora dependen de cookies: confirmar que `CORS_ORIGIN` en
  `.env` de producción apunte exactamente al dominio del frontend (ya era
  obligatorio antes de este fix) y que el sitio se sirva por HTTPS, porque
  las cookies llevan `secure: true` en producción.
