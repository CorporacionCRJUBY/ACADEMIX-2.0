// FILE: database/seeds/02_roles_permissions.seed.js
//
// FIX (auditoria hallazgos #1 y #2):
//  - El catálogo de `permissions` ahora cubre los 30 módulos reales que las
//    rutas exigen vía authorize('modulo.accion') (antes solo cubría 9).
//  - ADMIN y TEACHER reciben filas reales en `role_permissions` (antes 0 y 0).
//    Antes, solo SUPER_ADMIN tenía permisos y las otras dos cuentas demo
//    (admin2@academix.com, maria.gonzalez@academix.com) podían iniciar
//    sesión pero no podían usar ningún endpoint protegido.
exports.seed = function(knex) {
  return knex('role_permissions').del()
    .then(() => knex('permissions').del())
    .then(() => knex('roles').del())
    .then(() => {
      // Insertar roles
      return knex('roles').insert([
        {
          code: 'ROLE-2026-000001',
          name: 'SUPER_ADMIN',
          description: 'Super Administrador - acceso total al sistema',
          status: 'ACTIVE',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        },
        {
          code: 'ROLE-2026-000002',
          name: 'ADMIN',
          description: 'Administrador - gestión académica y administrativa',
          status: 'ACTIVE',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        },
        {
          code: 'ROLE-2026-000003',
          name: 'TEACHER',
          description: 'Docente - gestión de clases y calificaciones',
          status: 'ACTIVE',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        }
      ]);
    })
    .then(() => {
      // Insertar permisos: un módulo.accion por cada authorize() usado en
      // src/routes/*.js. Mantener esta lista sincronizada con las rutas.
      const modules = {
        'academic-history':      ['view', 'create', 'edit', 'delete'],
        'academic-periods':      ['view', 'create', 'edit', 'delete'],
        'academic-years':        ['view', 'create', 'edit', 'delete'],
        'activity':              ['view'],
        'assignments':           ['view', 'create', 'edit', 'delete'],
        'attendance':            ['view', 'create', 'edit', 'delete'],
        'audit':                 ['view'],
        'branches':              ['view', 'create', 'edit', 'delete'],
        'calendar':              ['view', 'create', 'edit', 'delete'],
        'credits':               ['view', 'create', 'edit', 'delete'],
        'documents':             ['view', 'create', 'edit', 'delete'],
        'gpa':                   ['view', 'create', 'edit', 'delete'],
        'grade-change-requests': ['view', 'create', 'edit', 'delete', 'approve', 'reject'],
        'grades':                ['view', 'create', 'edit', 'delete', 'request_change'],
        'graduation':            ['view', 'create', 'edit', 'delete', 'validate'],
        'gransif':               ['view', 'create', 'edit', 'delete'],
        'guardians':             ['view', 'create', 'edit', 'delete'],
        'medical-records':       ['view', 'create', 'edit', 'delete'],
        'permissions':           ['view', 'create', 'edit', 'delete'],
        'previous-schools':      ['view', 'create', 'edit', 'delete'],
        'progress-reports':      ['view', 'create', 'edit', 'delete', 'generate'],
        'report-cards':          ['view', 'create', 'edit', 'delete', 'generate'],
        'reports':               ['view'],
        'roles':                 ['view', 'create', 'edit', 'delete'],
        'scholarships':          ['view', 'create', 'edit', 'delete'],
        'settings':              ['view', 'edit'],
        'students':              ['view', 'create', 'edit', 'delete'],
        'subjects':              ['view', 'create', 'edit', 'delete'],
        'teachers':              ['view', 'create', 'edit', 'delete'],
        'transcripts':           ['view', 'create', 'edit', 'delete', 'generate'],
        'users':                 ['view', 'create', 'edit', 'delete']
      };

      const descriptions = {
        view: 'Ver', create: 'Crear', edit: 'Editar', delete: 'Eliminar',
        generate: 'Generar', approve: 'Aprobar', reject: 'Rechazar',
        validate: 'Validar', request_change: 'Solicitar cambio de'
      };

      let counter = 1;
      const permissions = [];
      Object.keys(modules).forEach(module => {
        modules[module].forEach(action => {
          permissions.push({
            code: `PERM-2026-${String(counter).padStart(6, '0')}`,
            module,
            action,
            description: `${descriptions[action] || action} ${module}`
          });
          counter += 1;
        });
      });

      return knex('permissions').insert(permissions);
    })
    .then(() => {
      return knex('roles').select('id', 'name');
    })
    .then((roles) => {
      const superAdminRole = roles.find(r => r.name === 'SUPER_ADMIN');
      const adminRole = roles.find(r => r.name === 'ADMIN');
      const teacherRole = roles.find(r => r.name === 'TEACHER');

      // ADMIN: todo el sistema excepto administración de roles/permisos
      // (delegado a SUPER_ADMIN) y baja de usuarios (para evitar que un
      // ADMIN se elimine a sí mismo o a otros administradores).
      const adminExcluded = new Set([
        'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
        'permissions.view', 'permissions.create', 'permissions.edit', 'permissions.delete',
        'users.delete'
      ]);

      // TEACHER: lo que un docente necesita para pasar asistencia, cargar
      // notas y consultar la información de sus estudiantes/cursos.
      const teacherAllowed = new Set([
        'students.view', 'students.edit',
        'grades.view', 'grades.create', 'grades.edit', 'grades.request_change',
        'attendance.view', 'attendance.create', 'attendance.edit',
        'guardians.view',
        'medical-records.view',
        'assignments.view',
        'subjects.view',
        'academic-years.view', 'academic-periods.view',
        'calendar.view',
        'documents.view',
        'progress-reports.view', 'progress-reports.create',
        'report-cards.view',
        'transcripts.view',
        'grade-change-requests.view', 'grade-change-requests.create'
      ]);

      return knex('permissions').select('id', 'module', 'action')
        .then(perms => {
          const rows = [];
          const now = knex.fn.now();

          perms.forEach(p => {
            const key = `${p.module}.${p.action}`;

            // SUPER_ADMIN: todos los permisos.
            rows.push({
              role_id: superAdminRole.id,
              permission_id: p.id,
              created_at: now,
              updated_at: now
            });

            // ADMIN: todos menos los excluidos.
            if (!adminExcluded.has(key)) {
              rows.push({
                role_id: adminRole.id,
                permission_id: p.id,
                created_at: now,
                updated_at: now
              });
            }

            // TEACHER: solo el subconjunto permitido.
            if (teacherAllowed.has(key)) {
              rows.push({
                role_id: teacherRole.id,
                permission_id: p.id,
                created_at: now,
                updated_at: now
              });
            }
          });

          return knex('role_permissions').insert(rows);
        });
    });
};
