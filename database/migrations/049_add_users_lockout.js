// FILE: database/migrations/049_add_users_lockout.js
// login_attempts ya existía y se incrementaba en cada login fallido
// (usersRepository.incrementLoginAttempts), pero nunca bloqueaba nada — no
// había ninguna columna ni lógica que usara ese contador. Esta migración
// agrega locked_until: cuando se alcanza el máximo de intentos fallidos,
// auth.service.js la fija 15 minutos en el futuro y rechaza el login
// mientras dure el bloqueo (ver users.model.js#registerFailedLogin).
exports.up = async function (knex) {
  const hasLockedUntil = await knex.schema.hasColumn('users', 'locked_until');
  if (!hasLockedUntil) {
    await knex.schema.alterTable('users', (table) => {
      table.timestamp('locked_until').nullable();
    });
  }
};

exports.down = async function (knex) {
  const hasLockedUntil = await knex.schema.hasColumn('users', 'locked_until');
  if (hasLockedUntil) {
    await knex.schema.alterTable('users', (table) => {
      table.dropColumn('locked_until');
    });
  }
};
