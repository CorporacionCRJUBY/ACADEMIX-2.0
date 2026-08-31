// FILE: database/migrations/051_fix_code_sequences_unique_constraint.js
//
// Hallazgo de la auditoría (sección 2.5 de
// AUDITORIA_COMPLETA_BASE_DATOS_Y_FUNCIONES.md):
//
// `code_sequences.prefix` era UNIQUE por sí solo (ver migración 001), pero
// `utils/codeGenerator.js#generateCode()` busca/inserta filtrando por
// `{ prefix, year }`. Eso significa que al cambiar de año (ej. 2027), la
// primera vez que se genere un código para un prefijo ya usado en 2026, el
// INSERT de la nueva fila (mismo prefix, año distinto) fallaría con
// ER_DUP_ENTRY contra la fila de 2026, aunque conceptualmente son
// secuencias distintas.
//
// Esta migración reemplaza la restricción única de una sola columna por
// una restricción compuesta (prefix, year), que es lo que el código
// realmente necesita.
/**
 * Busca el nombre real del índice UNIQUE de una sola columna en MySQL/MariaDB
 * vía information_schema, en vez de asumir el nombre por convención de Knex
 * (`<tabla>_<columna>_unique`). Esto evita que la migración falle si el
 * índice fue creado con otro nombre (por ejemplo, por un dump/restore de
 * schema.sql en lugar de haber corrido la migración 001 original).
 */
async function findUniqueIndexName(knex, tableName, columnName) {
  const rows = await knex('information_schema.statistics')
    .select('INDEX_NAME')
    .where({
      TABLE_SCHEMA: knex.client.database(),
      TABLE_NAME: tableName,
      COLUMN_NAME: columnName,
      NON_UNIQUE: 0,
    })
    .whereNot('INDEX_NAME', 'PRIMARY')
    .groupBy('INDEX_NAME')
    .havingRaw('COUNT(*) = 1'); // solo índices de una sola columna

  return rows.length ? rows[0].INDEX_NAME : null;
}

exports.up = async function (knex) {
  const exists = await knex.schema.hasTable('code_sequences');
  if (!exists) return;

  const indexName = await findUniqueIndexName(knex, 'code_sequences', 'prefix');

  if (indexName) {
    await knex.schema.raw(`ALTER TABLE \`code_sequences\` DROP INDEX \`${indexName}\``);
  }

  await knex.schema.alterTable('code_sequences', (table) => {
    table.unique(['prefix', 'year'], { indexName: 'code_sequences_prefix_year_unique' });
  });
};

exports.down = async function (knex) {
  const exists = await knex.schema.hasTable('code_sequences');
  if (!exists) return;

  await knex.schema.alterTable('code_sequences', (table) => {
    table.dropUnique(['prefix', 'year'], 'code_sequences_prefix_year_unique');
  });

  await knex.schema.alterTable('code_sequences', (table) => {
    table.unique(['prefix'], { indexName: 'code_sequences_prefix_unique' });
  });
};
