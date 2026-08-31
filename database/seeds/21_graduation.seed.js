// FILE: database/seeds/21_graduation.seed.js
exports.seed = function(knex) {
  return knex('graduation_records').del()
    .then(() => {
      return knex('graduation_records').insert([
        {
          code: 'GRD-2026-000001',
          student_id: 3,
          academic_year_id: 1,
          graduation_date: '2027-06-30',
          status: 'PENDING',
          requirements_met: false,
          validation_notes: 'Pendiente de completar créditos comunitarios',
          certificate_number: null,
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        },
        {
          code: 'GRD-2026-000002',
          student_id: 1,
          academic_year_id: 1,
          graduation_date: '2027-06-30',
          status: 'VALIDATED',
          requirements_met: true,
          validation_notes: 'Todos los requisitos académicos cumplidos',
          certificate_number: null,
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        }
      ]);
    });
};
