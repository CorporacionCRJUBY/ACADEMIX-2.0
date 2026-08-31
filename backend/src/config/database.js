// FILE: backend/src/config/database.js
const knex = require('knex');
const config = require('./env');

const poolConfig = {
  min: 2,
  max: 10,
  // Tiempo de inactividad antes de liberar conexión (ms)
  idleTimeoutMillis: 30000,
};

const db = knex({
  client: 'mysql2',
  connection: {
    host: config.DB_HOST,
    port: config.DB_PORT,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,
    // Manejo de zonas horarias
    timezone: 'Z',
    // Formato de fechas
    dateStrings: true,
  },
  pool: poolConfig,
  // Log de queries en desarrollo (opcional)
  log: config.NODE_ENV === 'development'
    ? { warn: (msg) => console.warn('[DB WARN]', msg), error: (msg) => console.error('[DB ERR]', msg) }
    : null,
});

module.exports = db;