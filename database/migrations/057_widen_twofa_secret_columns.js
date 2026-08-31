// FILE: database/migrations/057_widen_twofa_secret_columns.js
// SEGURIDAD (hardening 2026-08-31): los secretos TOTP ahora se guardan
// cifrados con AES-256-GCM (backend/src/utils/cryptoBox.js). El formato
// enc:v1:<iv>:<authTag>:<ciphertext> ocupa ~130 caracteres para un secreto
// base32 de 32, y las columnas quedaron en VARCHAR(64) en la migración 054.
exports.up = async function (knex) {
  const hasColumn = await knex.schema.hasColumn('users', 'twofa_secret');
  if (!hasColumn) return;

  await knex.schema.raw('ALTER TABLE users MODIFY COLUMN twofa_secret VARCHAR(255) NULL');
  await knex.schema.raw('ALTER TABLE users MODIFY COLUMN twofa_pending_secret VARCHAR(255) NULL');
};

exports.down = async function (knex) {
  const hasColumn = await knex.schema.hasColumn('users', 'twofa_secret');
  if (!hasColumn) return;

  // Best-effort: solo tiene sentido si los secretos ya volvieron a texto
  // plano (32 chars base32); con valores cifrados el MODIFY truncaría.
  await knex.schema.raw('ALTER TABLE users MODIFY COLUMN twofa_secret VARCHAR(64) NULL');
  await knex.schema.raw('ALTER TABLE users MODIFY COLUMN twofa_pending_secret VARCHAR(64) NULL');
};
