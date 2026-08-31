// FILE: database/seeds/04_teachers.seed.js
exports.seed = function(knex) {
  return knex('teachers').del()
    .then(() => {
      return knex('teachers').insert([
        {
          code: 'TCH-2026-000001',
          user_id: 3, // vinculado a maria.gonzalez@academix.com (03_users.seed.js)
          first_name: 'María',
          last_name: 'González',
          email: 'maria.gonzalez@academix.com',
          phone: '+1-555-1001',
          specialization: 'Matemáticas',
          hire_date: '2024-08-01',
          branch_id: 1,
          status: 'ACTIVE',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        },
        {
          code: 'TCH-2026-000002',
          user_id: null,
          first_name: 'Carlos',
          last_name: 'Rodríguez',
          email: 'carlos.rodriguez@academix.com',
          phone: '+1-555-1002',
          specialization: 'Ciencias',
          hire_date: '2024-08-01',
          branch_id: 1,
          status: 'ACTIVE',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        },
        {
          code: 'TCH-2026-000003',
          user_id: null,
          first_name: 'Ana',
          last_name: 'Martínez',
          email: 'ana.martinez@academix.com',
          phone: '+1-555-1003',
          specialization: 'Lenguaje',
          hire_date: '2024-08-01',
          branch_id: 1,
          status: 'ACTIVE',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        }
      ]);
    });
};