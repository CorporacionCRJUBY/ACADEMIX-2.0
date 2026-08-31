// FILE: database/migrations/055_add_password_changed_at_and_nullable_audit_user.js
// FIX (auditoria DB 2026-08-31):
// 1. users.password_changed_at no existía aunque auth.service la asume al
//    forzar cambio de contraseña y al invalidar sesiones tras un cambio.
// 2. audit_logs.user_id era NOT NULL con FK a users, pero los jobs del
//    sistema (gradeLockJob, reportArchiveJob) registran auditoría sin un
//    usuario real y tenían que inventar ids (user.id = 0/1), violando la FK
//    o atribuyendo acciones del sistema a usuarios reales. Ahora user_id es
//    nullable: NULL = acción del sistema.
exports.up = async function (knex) {
  const hasPasswordChangedAt = await knex.schema.hasColumn('users', 'password_changed_at');
  if (!hasPasswordChangedAt) {
    await knex.schema.alterTable('users', (table) => {
      table.timestamp('password_changed_at').nullable();
    });
  }

  const [col] = await knex('information_schema.COLUMNS')
    .where({ TABLE_SCHEMA: knex.raw('DATABASE()'), TABLE_NAME: 'audit_logs', COLUMN_NAME: 'user_id' })
    .select('IS_NULLABLE');

  if (col && col.IS_NULLABLE === 'NO') {
    // MODIFY preserva la FK existente; solo cambia la nulabilidad.
    await knex.schema.raw('ALTER TABLE audit_logs MODIFY COLUMN user_id INT UNSIGNED NULL');
  }
};

exports.down = async function (knex) {
  const hasPasswordChangedAt = await knex.schema.hasColumn('users', 'password_changed_at');
  if (hasPasswordChangedAt) {
    await knex.schema.alterTable('users', (table) => {
      table.dropColumn('password_changed_at');
    });
  }

  // Revertir a NOT NULL: las filas de sistema (user_id NULL) no tienen
  // usuario atribuible, se eliminan para poder restaurar la restricción.
  await knex('audit_logs').whereNull('user_id').del();
  await knex.schema.raw('ALTER TABLE audit_logs MODIFY COLUMN user_id INT UNSIGNED NOT NULL');
};
