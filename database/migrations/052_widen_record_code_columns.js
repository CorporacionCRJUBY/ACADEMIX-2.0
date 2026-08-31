// FILE: database/migrations/052_widen_record_code_columns.js
//
// Bug descubierto durante la verificación en vivo de esta auditoría (no
// documentado en versiones anteriores del informe):
//
// `audit_logs.record_code` y `activity_logs.record_code` se crearon como
// VARCHAR(20) (migraciones 044 y 045), pensados para códigos generados
// como "STU-2026-000001" (16 caracteres). Pero el módulo `auth` registra
// el LOGIN usando el **email del usuario** como `record_code`
// (ver services/audit.service.js / audit/auditService.js). Los emails de
// seed originales (`admin@academix.com`, `admin2@academix.com`) miden
// exactamente 20 caracteres y por eso el bug pasó inadvertido: cualquier
// email más largo revienta el INSERT con `ER_DATA_TOO_LONG`, tumbando el
// login completo (el audit log se escribe de forma síncrona en el mismo
// flujo de la petición).
//
// Prueba real que expuso el bug: agregar la cuenta docente
// `maria.gonzalez@academix.com` (28 caracteres) en el seed y hacer login
// contra una base de datos real:
//   POST /api/auth/login {"email":"maria.gonzalez@academix.com", ...}
//   → 500 ER_DATA_TOO_LONG: "Data too long for column 'record_code'"
//
// `users.email` es VARCHAR(100), así que se usa el mismo tamaño aquí para
// que cualquier email válido de usuario quepa como record_code.
exports.up = async function (knex) {
  const hasAuditLogs = await knex.schema.hasTable('audit_logs');
  if (hasAuditLogs) {
    await knex.schema.alterTable('audit_logs', (table) => {
      table.string('record_code', 100).alter();
    });
  }

  const hasActivityLogs = await knex.schema.hasTable('activity_logs');
  if (hasActivityLogs) {
    await knex.schema.alterTable('activity_logs', (table) => {
      table.string('record_code', 100).alter();
    });
  }
};

exports.down = async function (knex) {
  // No reducir la columna si ya existe algún valor real que no cabría en
  // VARCHAR(20) — esto pasaría, por ejemplo, en cuanto exista un solo
  // registro de auditoría de un LOGIN con un email largo (como el propio
  // caso que motivó esta migración). Forzar el shrink ahí truncaría datos
  // reales de auditoría, así que en ese caso el rollback se salta el
  // ALTER de forma segura en vez de fallar a mitad de camino o borrar
  // información.
  const hasAuditLogs = await knex.schema.hasTable('audit_logs');
  if (hasAuditLogs) {
    const [{ maxLen }] = await knex('audit_logs')
      .select(knex.raw('MAX(CHAR_LENGTH(record_code)) as maxLen'));
    if (!maxLen || maxLen <= 20) {
      await knex.schema.alterTable('audit_logs', (table) => {
        table.string('record_code', 20).alter();
      });
    }
  }

  const hasActivityLogs = await knex.schema.hasTable('activity_logs');
  if (hasActivityLogs) {
    const [{ maxLen }] = await knex('activity_logs')
      .select(knex.raw('MAX(CHAR_LENGTH(record_code)) as maxLen'));
    if (!maxLen || maxLen <= 20) {
      await knex.schema.alterTable('activity_logs', (table) => {
        table.string('record_code', 20).alter();
      });
    }
  }
};
