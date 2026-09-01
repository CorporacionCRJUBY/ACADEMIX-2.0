// FILE: database/migrations/059_attendance_tardy_grade_type_teacher_comments.js
// Alineación con el Plan Maestro y las plantillas oficiales RP 26-27:
//  1. La plantilla oficial tiene fila "Tardy to School", pero el enum de
//     asistencia solo contemplaba P/O/E/U — se añade 'T' (tardy).
//  2. La plantilla imprime Progress Report Y Report Card por trimestre
//     (Q1 PR | Q1 RC | Q2 PR | Q2 RC | Final), pero grade_records guardaba
//     una sola nota por período sin distinguir el tipo — se añade
//     grade_type ENUM('PR','RC') y se amplía la restricción única.
//  3. Comentarios del maestro por estudiante/materia/período y tipo (PARTE 4
//     del plan) — tabla teacher_comments.
exports.up = async function (knex) {
  // 1. Tardy en attendance_records
  const attCol = await knex('information_schema.COLUMNS')
    .where({
      TABLE_SCHEMA: knex.raw('DATABASE()'),
      TABLE_NAME: 'attendance_records',
      COLUMN_NAME: 'status'
    })
    .first();
  if (attCol && !/'T'/.test(attCol.COLUMN_TYPE)) {
    await knex.schema.raw(
      "ALTER TABLE attendance_records MODIFY COLUMN status ENUM('P','O','E','U','T') NOT NULL"
    );
  }

  // Tardy en attendance_history (from/to)
  const histFrom = await knex('information_schema.COLUMNS')
    .where({
      TABLE_SCHEMA: knex.raw('DATABASE()'),
      TABLE_NAME: 'attendance_history',
      COLUMN_NAME: 'from_status'
    })
    .first();
  if (histFrom && !/'T'/.test(histFrom.COLUMN_TYPE)) {
    await knex.schema.raw(
      "ALTER TABLE attendance_history MODIFY COLUMN from_status ENUM('P','O','E','U','T')"
    );
    await knex.schema.raw(
      "ALTER TABLE attendance_history MODIFY COLUMN to_status ENUM('P','O','E','U','T') NOT NULL"
    );
  }

  // 2. grade_records.grade_type
  const hasGradeType = await knex.schema.hasColumn('grade_records', 'grade_type');
  if (!hasGradeType) {
    await knex.schema.raw(
      "ALTER TABLE grade_records ADD COLUMN grade_type ENUM('PR','RC') NOT NULL DEFAULT 'RC' AFTER grade_value"
    );
    // La nota única debe distinguir PR de RC para el mismo estudiante/
    // materia/asignación/período.
    await knex.schema.raw('ALTER TABLE grade_records DROP INDEX grade_records_unique_entry');
    await knex.schema.raw(
      'ALTER TABLE grade_records ADD UNIQUE INDEX grade_records_unique_entry (student_id, subject_id, assignment_id, academic_period_id, grade_type)'
    );
  }

  // 3. teacher_comments
  const hasTable = await knex.schema.hasTable('teacher_comments');
  if (!hasTable) {
    await knex.schema.createTable('teacher_comments', (table) => {
      table.increments('id').primary();
      table.string('code', 20).notNullable().unique();
      table.integer('student_id').unsigned().notNullable();
      table.integer('subject_id').unsigned().notNullable();
      table.integer('academic_period_id').unsigned().notNullable();
      table.enum('comment_type', ['PR', 'RC']).notNullable().defaultTo('RC');
      table.text('comment').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.timestamp('deleted_at').nullable();
      table.integer('deleted_by').unsigned().nullable();
      table.integer('created_by').unsigned().nullable();
      table.integer('updated_by').unsigned().nullable();
      table.foreign('student_id').references('id').inTable('students');
      table.foreign('subject_id').references('id').inTable('subjects');
      table.foreign('academic_period_id').references('id').inTable('academic_periods');
      table.unique(['student_id', 'subject_id', 'academic_period_id', 'comment_type'], 'teacher_comments_unique_entry');
    });
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('teacher_comments');

  const hasGradeType = await knex.schema.hasColumn('grade_records', 'grade_type');
  if (hasGradeType) {
    await knex('grade_records').where('grade_type', 'PR').del();
    await knex.schema.raw('ALTER TABLE grade_records DROP INDEX grade_records_unique_entry');
    await knex.schema.raw(
      'ALTER TABLE grade_records ADD UNIQUE INDEX grade_records_unique_entry (student_id, subject_id, assignment_id, academic_period_id)'
    );
    await knex.schema.raw('ALTER TABLE grade_records DROP COLUMN grade_type');
  }

  await knex('attendance_records').where('status', 'T').del();
  await knex.schema.raw(
    "ALTER TABLE attendance_records MODIFY COLUMN status ENUM('P','O','E','U') NOT NULL"
  );
  await knex('attendance_history').whereIn('from_status', ['T']).del();
  await knex('attendance_history').whereIn('to_status', ['T']).del();
  await knex.schema.raw(
    "ALTER TABLE attendance_history MODIFY COLUMN from_status ENUM('P','O','E','U')"
  );
  await knex.schema.raw(
    "ALTER TABLE attendance_history MODIFY COLUMN to_status ENUM('P','O','E','U') NOT NULL"
  );
};
