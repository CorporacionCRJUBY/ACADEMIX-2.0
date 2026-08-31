// FILE: database/seeds/18_documents.seed.js
// NOTE: these rows describe demo document metadata only. The referenced
// `file_path` values do not point to real files on disk (no binary content
// is seeded), so "download" for these demo rows will 404 until a real file
// is uploaded through the Documents module for the same student.
exports.seed = function(knex) {
  return knex('documents').del()
    .then(() => {
      return knex('documents').insert([
        {
          code: 'DOC-2026-000001',
          student_id: 1,
          document_type: 'IDENTIFICATION',
          title: 'Cédula de identidad',
          file_path: 'uploads/documents/demo/doc-000001.pdf',
          file_name: 'cedula_identidad.pdf',
          file_size: 245678,
          mime_type: 'application/pdf',
          status: 'ACTIVE',
          upload_date: '2026-02-01',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        },
        {
          code: 'DOC-2026-000002',
          student_id: 1,
          document_type: 'CERTIFICATE',
          title: 'Certificado de nacimiento',
          file_path: 'uploads/documents/demo/doc-000002.pdf',
          file_name: 'certificado_nacimiento.pdf',
          file_size: 189234,
          mime_type: 'application/pdf',
          status: 'ACTIVE',
          upload_date: '2026-02-01',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        },
        {
          code: 'DOC-2026-000003',
          student_id: 2,
          document_type: 'TRANSCRIPT',
          title: 'Historial académico anterior',
          file_path: 'uploads/documents/demo/doc-000003.pdf',
          file_name: 'historial_academico.pdf',
          file_size: 312450,
          mime_type: 'application/pdf',
          status: 'ACTIVE',
          upload_date: '2026-02-05',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        }
      ]);
    });
};
