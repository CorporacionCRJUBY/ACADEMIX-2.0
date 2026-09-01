// FILE: backend/src/config/knexfile.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  development: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'ADMIN',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'academix_v2',
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: '../../../database/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: '../../../database/seeds',
    },
  },
  production: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: '../../../database/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: '../../../database/seeds',
    },
  },
};