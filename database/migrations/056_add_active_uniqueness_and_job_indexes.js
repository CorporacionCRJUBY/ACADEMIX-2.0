// FILE: database/migrations/056_add_active_uniqueness_and_job_indexes.js
// FIX (auditoria DB 2026-08-31): varias tablas permiten duplicados activos
// porque nunca hubo restricción de unicidad y el soft-delete (deleted_at)
// impide usar un UNIQUE simple (chocaría con filas borradas y MySQL/MariaDB
// no tiene índices parciales).
//
// Estrategia: columna generada VIRTUAL `active_guard` que vale 1 cuando la
// fila está activa (deleted_at IS NULL) y NULL cuando está borrada. Como los
// índices UNIQUE de MySQL/MariaDB admiten múltiples NULL pero no valores
// repetidos, UNIQUE(columnas_de_negocio..., active_guard) garantiza unicidad
// SOLO entre filas activas: las soft-deleted nunca estorban.
//
// Antes de crear cada restricción se limpian duplicados activos existentes:
// se conserva el registro más reciente (MAX id) y los demás se soft-deleted.
//
// Además agrega índices que usan los jobs programados:
//   - grade_records(status, edit_deadline)      -> gradeLockJob (cada 15 min)
//   - grade_change_requests(grade_record_id, status)
exports.up = async function (knex) {
  const columnExists = (table, column) => knex.schema.hasColumn(table, column);

  const indexExists = async (table, indexName) => {
    const rows = await knex('information_schema.STATISTICS')
      .where({ TABLE_SCHEMA: knex.raw('DATABASE()'), TABLE_NAME: table, INDEX_NAME: indexName })
      .select('INDEX_NAME');
    return rows.length > 0;
  };

  // Soft-delete de duplicados activos conservando el de mayor id.
  const dedupeActive = async (table, businessCols) => {
    const cols = businessCols.join(', ');
    await knex.schema.raw(
      `UPDATE \`${table}\` t
       JOIN (
         SELECT ${cols}, MAX(id) AS keep_id
         FROM \`${table}\`
         WHERE deleted_at IS NULL
         GROUP BY ${cols}
         HAVING COUNT(*) > 1
       ) d ON ${businessCols.map((c) => `d.\`${c}\` = t.\`${c}\``).join(' AND ')} AND t.id <> d.keep_id
       SET t.deleted_at = NOW()
       WHERE t.deleted_at IS NULL`
    );
  };

  const ensureActiveUnique = async (table, businessCols, indexName) => {
    const hasGuard = await columnExists(table, 'active_guard');
    if (!hasGuard) {
      await dedupeActive(table, businessCols);
      await knex.schema.raw(
        `ALTER TABLE \`${table}\` ADD COLUMN active_guard TINYINT GENERATED ALWAYS AS (IF(deleted_at IS NULL, 1, NULL)) VIRTUAL`
      );
    }
    if (!(await indexExists(table, indexName))) {
      const cols = businessCols.map((c) => `\`${c}\``).join(', ');
      await knex.schema.raw(
        `CREATE UNIQUE INDEX \`${indexName}\` ON \`${table}\` (${cols}, \`active_guard\`)`
      );
    }
  };

  // Unicidad entre filas activas
  await ensureActiveUnique('academic_history', ['student_id', 'academic_period_id', 'subject_id'], 'uq_academic_history_active');
  await ensureActiveUnique('medical_records', ['student_id'], 'uq_medical_records_active');
  await ensureActiveUnique('graduation_records', ['student_id', 'academic_year_id'], 'uq_graduation_records_active');
  await ensureActiveUnique('gransif_records', ['student_id', 'academic_year_id'], 'uq_gransif_records_active');

  // Índices de rendimiento para jobs/consultas frecuentes
  if (!(await indexExists('grade_records', 'idx_grade_records_status_deadline'))) {
    await knex.schema.alterTable('grade_records', (table) => {
      table.index(['status', 'edit_deadline'], 'idx_grade_records_status_deadline');
    });
  }
  if (!(await indexExists('grade_change_requests', 'idx_grade_change_requests_record_status'))) {
    await knex.schema.alterTable('grade_change_requests', (table) => {
      table.index(['grade_record_id', 'status'], 'idx_grade_change_requests_record_status');
    });
  }
};

exports.down = async function (knex) {
  const indexExists = async (table, indexName) => {
    const rows = await knex('information_schema.STATISTICS')
      .where({ TABLE_SCHEMA: knex.raw('DATABASE()'), TABLE_NAME: table, INDEX_NAME: indexName })
      .select('INDEX_NAME');
    return rows.length > 0;
  };

  const dropIfExists = async (table, indexName) => {
    if (await indexExists(table, indexName)) {
      await knex.schema.raw(`DROP INDEX \`${indexName}\` ON \`${table}\``);
    }
  };

  await dropIfExists('grade_change_requests', 'idx_grade_change_requests_record_status');
  await dropIfExists('grade_records', 'idx_grade_records_status_deadline');

  const dropGuard = async (table, indexName) => {
    await dropIfExists(table, indexName);
    if (await knex.schema.hasColumn(table, 'active_guard')) {
      await knex.schema.raw(`ALTER TABLE \`${table}\` DROP COLUMN active_guard`);
    }
  };

  await dropGuard('gransif_records', 'uq_gransif_records_active');
  await dropGuard('graduation_records', 'uq_graduation_records_active');
  await dropGuard('medical_records', 'uq_medical_records_active');
  await dropGuard('academic_history', 'uq_academic_history_active');
};
