// FILE: database/seeds/03_users.seed.js
// Nota: este archivo vive fuera de backend/, por lo que no puede resolver
// paquetes npm como 'bcryptjs' (node_modules solo existe dentro de backend/).
// Como la contraseña del seed es fija ('Admin123!'), se usa su hash bcrypt
// pre-calculado para no depender de esa dependencia externa.
const hashedPassword = '$2b$10$i9ydPQ85Agt2LpJrWrz69ugmFoD5KT52Cq.nEy1aJzatw0x0HdnoC'; // Admin123!
exports.seed = function(knex) {
  // SEGURIDAD (alto A4): estas cuentas son de DEMO con contraseña conocida.
  // Nunca deben sembrarse en producción salvo opt-in explícito.
  if (process.env.NODE_ENV === 'production' && process.env.SEED_ALLOW_IN_PRODUCTION !== 'true') {
    return Promise.reject(new Error(
      'Seed de usuarios demo bloqueado en producción. ' +
      'Si realmente lo necesita, defina SEED_ALLOW_IN_PRODUCTION=true.'
    ));
  }
  return knex('user_roles').del()
    .then(() => knex('users').del())
    .then(() => {
      return knex('users').insert([
        {
          code: 'USR-2026-000001',
          email: 'admin@academix.com',
          password: hashedPassword,
          full_name: 'Super Administrador',
          phone: '+1-555-0001',
          role_id: 1,
          branch_id: 1,
          status: 'ACTIVE',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        },
        {
          code: 'USR-2026-000002',
          email: 'admin2@academix.com',
          password: hashedPassword,
          full_name: 'Administrador General',
          phone: '+1-555-0002',
          role_id: 2,
          branch_id: 1,
          status: 'ACTIVE',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        },
        {
          // Cuenta de docente con login real. Se vincula a la fila de
          // `teachers` "María González" (ver 04_teachers.seed.js) a través
          // de `teachers.user_id`, ya que antes ningún profesor sembrado
          // tenía usuario asociado y era imposible probar el rol TEACHER.
          code: 'USR-2026-000003',
          email: 'maria.gonzalez@academix.com',
          password: hashedPassword,
          full_name: 'María González',
          phone: '+1-555-1001',
          role_id: 3,
          branch_id: 1,
          status: 'ACTIVE',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        }
      ]);
    })
    .then(() => {
      return knex('user_roles').insert([
        { user_id: 1, role_id: 1, created_at: knex.fn.now(), updated_at: knex.fn.now() },
        { user_id: 2, role_id: 2, created_at: knex.fn.now(), updated_at: knex.fn.now() },
        { user_id: 3, role_id: 3, created_at: knex.fn.now(), updated_at: knex.fn.now() }
      ]);
    });
};