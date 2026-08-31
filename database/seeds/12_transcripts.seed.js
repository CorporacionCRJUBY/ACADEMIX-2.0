// FILE: database/seeds/12_transcripts.seed.js
exports.seed = function(knex) {
  return knex('transcript_courses').del()
    .then(() => knex('transcripts').del())
    .then(() => {
      return knex('transcripts').insert([
        {
          code: 'TRN-2026-000001',
          student_id: 1,
          academic_period_id: 1,
          academic_year_id: 1,
          transcript_type: 'OFFICIAL',
          status: 'OFFICIAL',
          version_number: 1,
          generated_by: 1,
          approved_by: 1,
          approved_at: knex.fn.now(),
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        }
      ]);
    })
    .then(() => {
      return knex('transcript_courses').insert([
        { transcript_id: 1, subject_id: 1, grade_value: 92.5, grade_letter: 'A', credits: 4.00, created_at: knex.fn.now() },
        { transcript_id: 1, subject_id: 2, grade_value: 85.0, grade_letter: 'B', credits: 3.00, created_at: knex.fn.now() },
        { transcript_id: 1, subject_id: 3, grade_value: 78.0, grade_letter: 'C', credits: 3.00, created_at: knex.fn.now() }
      ]);
    });
};