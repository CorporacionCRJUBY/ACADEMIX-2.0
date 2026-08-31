// FILE: database/seeds/23_code_sequences.seed.js
//
// FIX: la tabla `code_sequences` (usada por utils/codeGenerator.js para
// generar códigos únicos tipo STU-2026-000001) nunca se inicializaba con
// los datos de los seeds. Los seeds insertan códigos directamente
// (STU-2026-000001, STU-2026-000002, ...) sin pasar por generateCode(),
// así que la secuencia real quedaba en cero. La primera vez que alguien
// crea un registro nuevo por la API para un prefijo que YA fue usado por
// el seed con el mismo prefijo (p. ej. estudiantes, usuarios, materias,
// becas, GPA, escuelas anteriores, expedientes médicos, documentos,
// calendario, graduación, transcripts), generateCode() vuelve a generar
// -000001 y choca con ER_DUP_ENTRY contra la fila ya sembrada.
//
// Este seed corre AL FINAL (después de todos los demás, orden alfabético
// "23_" > "22_") y es genérico: escanea el código real insertado en cada
// tabla, agrupa por prefijo+año, y reserva en code_sequences el máximo
// número ya usado. Así funciona sin importar si el prefijo del seed
// coincide o no con el prefijo que usa la app (si no coincide, como pasa
// hoy con branches/teachers/roles/permissions/etc., simplemente no se
// reserva nada para ese prefijo y la app arranca limpio desde 1, que es
// correcto).
const TABLES_WITH_CODE = [
  'branches', 'roles', 'permissions', 'users', 'academic_years', 'students',
  'documents', 'teachers', 'guardians', 'subjects', 'academic_periods',
  'academic_assignments', 'attendance_records', 'grade_records',
  'grade_change_requests', 'academic_history', 'credits', 'gpa_records',
  'previous_schools', 'scholarships', 'document_types', 'medical_records',
  'school_calendar', 'reports', 'transcripts', 'graduation_records',
  'gransif_records',
];

const CODE_RE = /^([A-Z]{2,4})-(\d{4})-(\d{1,6})$/;

exports.seed = async function(knex) {
  // prefix -> { year, maxNumber }
  const maxByPrefix = new Map();

  for (const table of TABLES_WITH_CODE) {
    const hasTable = await knex.schema.hasTable(table);
    if (!hasTable) continue;
    const hasCodeCol = await knex.schema.hasColumn(table, 'code');
    if (!hasCodeCol) continue;

    const rows = await knex(table).select('code').whereNotNull('code');
    for (const { code } of rows) {
      if (!code) continue;
      const match = CODE_RE.exec(code);
      if (!match) continue; // formatos no estándar (p.ej. attendance/grades/academic_history) se ignoran a propósito
      const [, prefix, yearStr, numberStr] = match;
      const year = parseInt(yearStr, 10);
      const number = parseInt(numberStr, 10);

      const key = `${prefix}-${year}`;
      const current = maxByPrefix.get(key);
      if (!current || number > current.maxNumber) {
        maxByPrefix.set(key, { prefix, year, maxNumber: number });
      }
    }
  }

  for (const { prefix, year, maxNumber } of maxByPrefix.values()) {
    const existing = await knex('code_sequences').where({ prefix }).first();
    if (existing) {
      if (existing.last_number < maxNumber) {
        await knex('code_sequences')
          .where({ id: existing.id })
          .update({ last_number: maxNumber, year, updated_at: knex.fn.now() });
      }
    } else {
      await knex('code_sequences').insert({
        prefix,
        last_number: maxNumber,
        year,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      });
    }
  }
};
