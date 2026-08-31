// FILE: backend/src/config/env.js
const dotenv = require('dotenv');
const path = require('path');

// Cargar .env desde la raíz del proyecto
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Validar variables críticas en producción
const isProd = process.env.NODE_ENV === 'production';
// FIX (auditoria hallazgo alto #3): JWT_REFRESH_SECRET faltaba en esta
// lista, así que en producción podía caer silenciosamente al valor por
// defecto 'dev-refresh-secret-change-me' (visible en este mismo archivo,
// en el repo público) y permitir forjar refresh tokens válidos.
const requiredProd = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DB_NAME'];
const missingProd = requiredProd.filter(key => !process.env[key]);

if (isProd && missingProd.length > 0) {
  throw new Error(
    `❌ Faltan variables de entorno en producción: ${missingProd.join(', ')}`
  );
}

const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),

  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '3306', 10),
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'academix_v2',

  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',

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
};

module.exports = config;