// FILE: database/seeds/01_branches.seed.js
exports.seed = function(knex) {
  return knex('branches').del()
    .then(() => {
      return knex('branches').insert([
        {
          code: 'BR-2026-000001',
          name: 'Sede Principal',
          address: 'Av. Principal 123, Ciudad',
          phone: '+1-555-0100',
          email: 'principal@academix.com',
          status: 'ACTIVE',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        },
        {
          code: 'BR-2026-000002',
          name: 'Sede Norte',
          address: 'Calle Norte 456, Ciudad',
          phone: '+1-555-0101',
          email: 'norte@academix.com',
          status: 'ACTIVE',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        }
      ]);
    });
};