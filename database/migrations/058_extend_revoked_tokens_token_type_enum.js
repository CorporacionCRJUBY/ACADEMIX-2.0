// FILE: database/migrations/058_extend_revoked_tokens_token_type_enum.js
// FIX (segunda pasada de auditoría, ALTO #1): auth.service.js#verifyTwoFactor
// revoca el challenge 2FA con tokenType '2fa_challenge', pero la migración
// 053 definió ENUM('access','refresh'). Hasta ahora solo "funcionaba" porque
// el INSERT IGNORE del onConflict().ignore() degrada el error de enum inválido
// a warning (guardando ''); si se quita el ignore, se cambia de motor o de
// sql_mode, todo login con 2FA pasaría a fallar con 500. Se amplía el enum
// para que el valor sea legítimo.
exports.up = async function (knex) {
  const col = await knex('information_schema.COLUMNS')
    .where({
      TABLE_SCHEMA: knex.raw('DATABASE()'),
      TABLE_NAME: 'revoked_tokens',
      COLUMN_NAME: 'token_type'
    })
    .first();
  if (col && /2fa_challenge/i.test(col.COLUMN_TYPE)) return;

  await knex.schema.raw(
    "ALTER TABLE revoked_tokens MODIFY COLUMN token_type ENUM('access','refresh','2fa_challenge') NOT NULL"
  );
};

exports.down = async function (knex) {
  // Para poder volver al enum original hay que eliminar primero las filas
  // que usan el valor nuevo.
  await knex('revoked_tokens').where('token_type', '2fa_challenge').del();
  await knex.schema.raw(
    "ALTER TABLE revoked_tokens MODIFY COLUMN token_type ENUM('access','refresh') NOT NULL"
  );
};
