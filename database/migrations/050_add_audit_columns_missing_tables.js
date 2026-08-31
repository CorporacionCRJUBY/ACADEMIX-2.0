// FILE: database/migrations/050_add_audit_columns_missing_tables.js
// FIX: los servicios de permissions, grade_change_requests, reports y
// transcripts escriben created_by/updated_by al crear/actualizar, pero esas
// columnas nunca existieron en las migraciones originales (004, 021, 037,
// 039). Esto rompía con ER_BAD_FIELD_ERROR en tiempo real al:
//   - crear un permiso nuevo
//   - crear/actualizar una solicitud de cambio de calificación
//   - crear/actualizar un reporte (grades/attendance/academic-history/
//     report-cards/progress-reports, todas comparten la tabla `reports`)
//   - crear/actualizar un transcript
// Se agrega de forma condicional (hasColumn) para poder correr sin
// problema tanto en bases nuevas como en bases que ya tenían el bug.
exports.up = async function(knex) {
  const tables = ['permissions', 'grade_change_requests', 'reports', 'transcripts'];

  for (const tableName of tables) {
    const hasCreatedBy = await knex.schema.hasColumn(tableName, 'created_by');
    if (!hasCreatedBy) {
      await knex.schema.alterTable(tableName, (table) => {
        table.integer('created_by').unsigned().nullable();
        table.foreign('created_by').references('id').inTable('users');
      });
    }

    const hasUpdatedBy = await knex.schema.hasColumn(tableName, 'updated_by');
    if (!hasUpdatedBy) {
      await knex.schema.alterTable(tableName, (table) => {
        table.integer('updated_by').unsigned().nullable();
        table.foreign('updated_by').references('id').inTable('users');
      });
    }
  }
};

exports.down = async function(knex) {
  const tables = ['permissions', 'grade_change_requests', 'reports', 'transcripts'];

  for (const tableName of tables) {
    const hasCreatedBy = await knex.schema.hasColumn(tableName, 'created_by');
    const hasUpdatedBy = await knex.schema.hasColumn(tableName, 'updated_by');

    await knex.schema.alterTable(tableName, (table) => {
      if (hasCreatedBy) {
        table.dropForeign('created_by');
        table.dropColumn('created_by');
      }
      if (hasUpdatedBy) {
        table.dropForeign('updated_by');
        table.dropColumn('updated_by');
      }
    });
  }
};
