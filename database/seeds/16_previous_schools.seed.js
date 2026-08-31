// FILE: database/seeds/16_previous_schools.seed.js
exports.seed = function(knex) {
  return knex('previous_schools').del()
    .then(() => {
      return knex('previous_schools').insert([
        {
          code: 'PSC-2026-000001',
          student_id: 1,
          school_name: 'Escuela Primaria San José',
          address: 'Calle 10, San José',
          phone: '+1-555-0200',
          grade_level: '8',
          year_attended: '2025',
          transcript_received: true,
          notes: 'Transferencia por cambio de domicilio',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        },
        {
          code: 'PSC-2026-000002',
          student_id: 2,
          school_name: 'Colegio Bilingüe del Valle',
          address: 'Av. Central 45, San José',
          phone: '+1-555-0201',
          grade_level: '9',
          year_attended: '2025',
          transcript_received: false,
          notes: 'Transcripción solicitada, pendiente de recepción',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        }
      ]);
    });
};
