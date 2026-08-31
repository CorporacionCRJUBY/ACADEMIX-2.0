// FILE: database/seeds/14_credits.seed.js
exports.seed = function(knex) {
  return knex('credits').del()
    .then(() => {
      return knex('credits').insert([
        {
          code: 'CRD-2026-000001',
          student_id: 1,
          academic_period_id: 1,
          credit_type: 'ACADEMIC',
          credits_earned: 6.0,
          credits_required: 6.0,
          status: 'APPROVED',
          notes: 'Créditos académicos del primer trimestre',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        },
        {
          code: 'CRD-2026-000002',
          student_id: 1,
          academic_period_id: 1,
          credit_type: 'COMMUNITY',
          credits_earned: 2.0,
          credits_required: 2.0,
          status: 'APPROVED',
          notes: 'Horas de servicio comunitario',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        },
        {
          code: 'CRD-2026-000003',
          student_id: 2,
          academic_period_id: 1,
          credit_type: 'ACADEMIC',
          credits_earned: 5.5,
          credits_required: 6.0,
          status: 'PENDING',
          notes: 'Pendiente de aprobación final',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        }
      ]);
    });
};
