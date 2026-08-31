// FILE: database/migrations/053_create_revoked_tokens.js
// FIX (auditoria hallazgo alto #5 - el logout no invalida tokens):
// los JWT son stateless por diseño, así que la única forma de revocarlos
// "de verdad" antes de su expiración natural es llevar una lista de
// exclusión server-side. Esta tabla guarda el `jti` (id único que ahora
// lleva cada token, ver config/jwt.js) de todo access/refresh token que
// se invalide explícitamente (logout, o un futuro "cerrar sesión en todos
// los dispositivos"). `expires_at` = el `exp` original del token, para que
// un job de limpieza pueda purgar filas de tokens que igual ya vencieron.
exports.up = function (knex) {
  return knex.schema.createTable('revoked_tokens', (table) => {
    table.increments('id').primary();
    table.string('jti', 36).notNullable().unique();
    table.integer('user_id').unsigned().nullable();
    table.enum('token_type', ['access', 'refresh']).notNullable();
    table.timestamp('expires_at').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.index('expires_at');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('revoked_tokens');
};
