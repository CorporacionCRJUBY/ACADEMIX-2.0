// FILE: backend/src/config/env.js
const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');

// Cargar .env desde la raíz del proyecto
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// SEGURIDAD (auditoria 2026-08-31, alto A2): los valores por defecto de los
// secretos están publicados en este repo — nunca deben usarse en un proceso
// real. En producción su ausencia es error fatal de arranque; en desarrollo
// se autogeneran secretos aleatorios efímeros (las sesiones no sobreviven
// reinicios, aceptable en dev) en vez de caer a los defaults públicos.
const isProd = process.env.NODE_ENV === 'production';
const requiredProd = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'ENCRYPTION_KEY', 'DB_NAME'];
const missingProd = requiredProd.filter(key => !process.env[key]);

if (isProd && missingProd.length > 0) {
  throw new Error(
    `❌ Faltan variables de entorno en producción: ${missingProd.join(', ')}`
  );
}

const PUBLIC_DEFAULTS = ['dev-secret-change-me', 'dev-refresh-secret-change-me'];
if (isProd && (PUBLIC_DEFAULTS.includes(process.env.JWT_SECRET) || PUBLIC_DEFAULTS.includes(process.env.JWT_REFRESH_SECRET))) {
  throw new Error('❌ Los secretos JWT de producción no pueden ser los valores de ejemplo del repositorio');
}

function devSecret(name) {
  console.warn(`[env] ${name} no definido — usando secreto aleatorio efímero (solo desarrollo; las sesiones no sobreviven reinicios)`);
  return crypto.randomBytes(48).toString('hex');
}

const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),

  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '3306', 10),
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'academix_v2',

  JWT_SECRET: process.env.JWT_SECRET || devSecret('JWT_SECRET'),
  // SEGURIDAD (medio M5): access token de vida corta (15 min). Los permisos
  // viajan embebidos en el access token, así que con 7d un cambio de roles
  // tardaba una semana en aplicarse. La renovación la cubre el refresh token.
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || devSecret('JWT_REFRESH_SECRET'),

  // SEGURIDAD (hardening 2026-08-31): clave maestra para cifrar en reposo
  // datos sensibles (secretos TOTP del 2FA). Obligatoria en producción.
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || devSecret('ENCRYPTION_KEY'),

  // Retención de activity_logs/audit_logs en días (job de limpieza diario).
  AUDIT_RETENTION_DAYS: parseInt(process.env.AUDIT_RETENTION_DAYS || '730', 10),

  UPLOAD_MAX_SIZE_MB: parseInt(process.env.UPLOAD_MAX_SIZE_MB || '10', 10),
  DEFAULT_LANGUAGE: process.env.DEFAULT_LANGUAGE || 'en',

  // FIX (auditoria hallazgo bajo #1 - límite de body JSON muy alto): 50mb
  // no tiene relación con lo que cualquier endpoint JSON de la API
  // necesita recibir (formularios, filtros, payloads de negocio — nada de
  // eso se acerca a unos pocos KB). Los archivos (fotos, PDFs, documentos)
  // nunca pasaron por aquí: viajan como multipart/form-data a través de
  // multer, que ya tiene su propio límite independiente
  // (UPLOAD_MAX_SIZE_MB, ver middleware/upload.middleware.js). Dejar el
  // parser JSON en 50mb solo ampliaba la superficie de ataque para DoS por
  // payloads grandes (CPU/memoria parseando JSON gigante) sin ningún
  // beneficio funcional. 2mb es holgado para cualquier body JSON legítimo
  // de esta API y sigue siendo configurable por si algún despliegue
  // concreto lo necesitara mayor.
  JSON_BODY_LIMIT: process.env.JSON_BODY_LIMIT || '2mb',

  // SEGURIDAD (despliegue detrás de reverse proxy): Express necesita
  // `trust proxy` para leer la IP real del cliente (X-Forwarded-For) en los
  // rate limiters y para honoring cookies Secure tras TLS-terminación.
  // Sin configurar = false (servidor expuesto directo): nadie puede
  // falsificar su IP de rate limiting con headers X-Forwarded-For.
  // Valores: 'true', un número de saltos ('1'), o lista/subnet ('loopback').
  TRUST_PROXY: (() => {
    const raw = process.env.TRUST_PROXY;
    if (raw === undefined || raw === '' || raw === 'false') return false;
    if (raw === 'true') return true;
    const hops = parseInt(raw, 10);
    return Number.isFinite(hops) && hops >= 1 ? hops : raw;
  })(),
};

module.exports = config;