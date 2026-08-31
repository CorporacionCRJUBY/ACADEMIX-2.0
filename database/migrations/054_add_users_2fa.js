// FILE: database/migrations/054_add_users_2fa.js
// FIX (auditoria hallazgo bajo #2 - falta de autenticación de dos factores):
// no existía ninguna columna para guardar un segundo factor por usuario.
// Se agregan:
//   - twofa_secret: secreto TOTP (base32) ya CONFIRMADO y en uso. Solo se
//     lee/escribe desde el backend, nunca se expone al frontend salvo una
//     vez, en claro, durante el setup inicial (ver auth.service.js).
//   - twofa_pending_secret: secreto generado durante el flujo de "activar
//     2FA" pero todavía no confirmado con un código válido. Se mantiene
//     separado de twofa_secret para no pisar/romper un 2FA ya activo si el
//     usuario abre el flujo de setup y no lo termina, y para que un setup
//     a medio terminar no habilite 2FA por accidente.
//   - twofa_enabled: si el login de este usuario requiere el segundo
//     factor. Se activa solo tras confirmar el pending_secret con un
//     código TOTP válido (ver auth.service.js#confirmTwoFactor).
//   - twofa_backup_codes: JSON con hashes bcrypt de códigos de respaldo de
//     un solo uso (nunca se guardan en claro), para cuando el usuario
//     pierde acceso a su app autenticadora.
//   - twofa_enabled_at: auditoría de cuándo se activó, y permite
//     distinguir "nunca configurado" de "desactivado alguna vez".
exports.up = async function (knex) {
  const hasColumn = await knex.schema.hasColumn('users', 'twofa_enabled');
  if (hasColumn) return;

  await knex.schema.alterTable('users', (table) => {
    table.string('twofa_secret', 64).nullable();
    table.string('twofa_pending_secret', 64).nullable();
    table.boolean('twofa_enabled').notNullable().defaultTo(false);
    table.text('twofa_backup_codes').nullable();
    table.timestamp('twofa_enabled_at').nullable();
  });
};

exports.down = async function (knex) {
  const hasColumn = await knex.schema.hasColumn('users', 'twofa_enabled');
  if (!hasColumn) return;

  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('twofa_secret');
    table.dropColumn('twofa_pending_secret');
    table.dropColumn('twofa_enabled');
    table.dropColumn('twofa_backup_codes');
    table.dropColumn('twofa_enabled_at');
  });
};
