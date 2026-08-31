// FILE: database/seeds/15_gpa.seed.js
exports.seed = function(knex) {
  return knex('gpa_records').del()
    .then(() => {
      return knex('gpa_records').insert([
        {
          code: 'GPA-2026-000001',
          student_id: 1,
          academic_period_id: 1,
          academic_year_id: 1,
          gpa_value: 3.850,
          cumulative_gpa: 3.850,
          credit_hours: 24.00,
          status: 'APPROVED',
          calculation_date: knex.fn.now(),
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        },
        {
          code: 'GPA-2026-000002',
          student_id: 2,
          academic_period_id: 1,
          academic_year_id: 1,
          gpa_value: 3.400,
          cumulative_gpa: 3.400,
          credit_hours: 24.00,
          status: 'APPROVED',
          calculation_date: knex.fn.now(),
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        },
        {
          code: 'GPA-2026-000003',
          student_id: 3,
          academic_period_id: 1,
          academic_year_id: 1,
          gpa_value: 3.950,
          cumulative_gpa: 3.950,
          credit_hours: 24.00,
          status: 'PENDING',
          calculation_date: knex.fn.now(),
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        }
      ]);
    });
};
