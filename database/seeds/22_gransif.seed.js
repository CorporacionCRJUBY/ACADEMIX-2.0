// FILE: database/seeds/22_gransif.seed.js
exports.seed = function(knex) {
  return knex('gransif_records').del()
    .then(() => {
      return knex('gransif_records').insert([
        {
          code: 'GRF-2026-000001',
          student_id: 1,
          academic_year_id: 1,
          assessment_date: '2026-09-10',
          score: 87.50,
          status: 'COMPLETED',
          notes: 'Evaluación diagnóstica inicial',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        },
        {
          code: 'GRF-2026-000002',
          student_id: 2,
          academic_year_id: 1,
          assessment_date: '2026-09-10',
          score: 74.20,
          status: 'COMPLETED',
          notes: 'Evaluación diagnóstica inicial',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        },
        {
          code: 'GRF-2026-000003',
          student_id: 3,
          academic_year_id: 1,
          assessment_date: '2026-12-01',
          score: null,
          status: 'PENDING',
          notes: 'Evaluación programada',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        }
      ]);
    });
};
