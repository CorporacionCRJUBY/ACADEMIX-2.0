// FILE: database/seeds/17_medical_records.seed.js
exports.seed = function(knex) {
  return knex('medical_records').del()
    .then(() => {
      return knex('medical_records').insert([
        {
          code: 'MED-2026-000001',
          student_id: 1,
          medical_condition: '',
          allergies: '',
          medications: '',
          emergency_contact_name: 'María Rodríguez',
          emergency_contact_phone: '+1-555-0301',
          health_insurance: 'Seguro Nacional de Salud',
          insurance_number: 'INS-000001',
          notes: '',
          last_checkup_date: '2026-01-15',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        },
        {
          code: 'MED-2026-000002',
          student_id: 2,
          medical_condition: 'Asma leve',
          allergies: 'Polen, polvo',
          medications: 'Inhalador de rescate (según necesidad)',
          emergency_contact_name: 'Carlos Jiménez',
          emergency_contact_phone: '+1-555-0302',
          health_insurance: 'Seguro Nacional de Salud',
          insurance_number: 'INS-000002',
          notes: 'Evitar actividad física intensa en días de alta contaminación',
          last_checkup_date: '2025-11-20',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        }
      ]);
    });
};
