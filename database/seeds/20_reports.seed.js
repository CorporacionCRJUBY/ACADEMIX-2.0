// FILE: database/seeds/20_reports.seed.js
// NOTE: like the documents seed, `pdf_path`/`pdf_url` here are demo
// placeholders — no PDF binary is generated, so "download" for these rows
// will 404 until the report is regenerated through the app.
exports.seed = function(knex) {
  return knex('reports').del()
    .then(() => {
      return knex('reports').insert([
        {
          code: 'RPT-2026-000001',
          category: 'grades',
          student_id: 1,
          academic_period_id: 1,
          academic_year_id: 1,
          report_date: '2026-10-20',
          status: 'OFFICIAL',
          version_number: 1,
          pdf_path: 'uploads/pdfs/demo/rpt-000001.pdf',
          pdf_url: '/pdfs/demo/rpt-000001.pdf',
          generated_by: 1,
          notes: 'Boleta de calificaciones Q1',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        },
        {
          code: 'RPT-2026-000002',
          category: 'attendance',
          student_id: 1,
          academic_period_id: 1,
          academic_year_id: 1,
          report_date: '2026-10-20',
          status: 'OFFICIAL',
          version_number: 1,
          pdf_path: 'uploads/pdfs/demo/rpt-000002.pdf',
          pdf_url: '/pdfs/demo/rpt-000002.pdf',
          generated_by: 1,
          notes: 'Reporte de asistencia Q1',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        },
        {
          code: 'RPT-2026-000003',
          category: 'academic-history',
          student_id: 2,
          academic_period_id: null,
          academic_year_id: 1,
          report_date: '2026-10-25',
          status: 'DRAFT',
          version_number: 1,
          pdf_path: null,
          pdf_url: null,
          generated_by: 1,
          notes: 'Borrador pendiente de revisión',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        },
        {
          // FIX: report-cards y progress-reports comparten esta tabla
          // filtrada por `category`, pero no tenían ninguna fila sembrada,
          // así que esos dos módulos no se podían probar de extremo a
          // extremo (list/findById/preview) sin crear datos manualmente.
          code: 'RPT-2026-000004',
          category: 'report-cards',
          student_id: 1,
          academic_period_id: 1,
          academic_year_id: 1,
          report_date: '2026-10-20',
          status: 'OFFICIAL',
          version_number: 1,
          pdf_path: 'uploads/pdfs/demo/rpt-000004.pdf',
          pdf_url: '/pdfs/demo/rpt-000004.pdf',
          generated_by: 1,
          notes: 'Boleta de notas Q1',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        },
        {
          code: 'RPT-2026-000005',
          category: 'progress-reports',
          student_id: 2,
          academic_period_id: 1,
          academic_year_id: 1,
          report_date: '2026-10-25',
          status: 'DRAFT',
          version_number: 1,
          pdf_path: null,
          pdf_url: null,
          generated_by: 1,
          notes: 'Informe de progreso pendiente',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        }
      ]);
    });
};
