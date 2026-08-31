// FILE: database/seeds/19_school_calendar.seed.js
exports.seed = function(knex) {
  return knex('school_calendar').del()
    .then(() => {
      return knex('school_calendar').insert([
        {
          code: 'CAL-2026-000001',
          branch_id: 1,
          academic_year_id: 1,
          date: '2026-08-03',
          title: 'Inicio de clases',
          description: 'Primer día del año académico 2026-2027',
          event_type: 'EVENT',
          is_holiday: false,
          is_working_day: true,
          status: 'ACTIVE',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        },
        {
          code: 'CAL-2026-000002',
          branch_id: null,
          academic_year_id: 1,
          date: '2026-09-15',
          title: 'Día de la Independencia',
          description: 'Feriado nacional',
          event_type: 'HOLIDAY',
          is_holiday: true,
          is_working_day: false,
          status: 'ACTIVE',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        },
        {
          code: 'CAL-2026-000003',
          branch_id: 1,
          academic_year_id: 1,
          date: '2026-10-10',
          title: 'Exámenes del primer trimestre',
          description: 'Semana de exámenes finales Q1',
          event_type: 'EXAM',
          is_holiday: false,
          is_working_day: true,
          status: 'ACTIVE',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        },
        {
          code: 'CAL-2026-000004',
          branch_id: 1,
          academic_year_id: 1,
          date: '2026-11-20',
          title: 'Reunión de padres de familia',
          description: 'Entrega de boletines del primer trimestre',
          event_type: 'MEETING',
          is_holiday: false,
          is_working_day: true,
          status: 'ACTIVE',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        }
      ]);
    });
};
