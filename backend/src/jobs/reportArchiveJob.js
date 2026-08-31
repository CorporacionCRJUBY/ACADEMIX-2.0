// FILE: backend/src/jobs/reportArchiveJob.js
const db = require('../config/database');
const auditService = require('../audit/auditService');

/**
 * Archiva versiones antiguas de reportes/transcripciones cuando existe una versión Official más nueva
 * @returns {Promise<{ archivedReports: number, archivedTranscripts: number }>}
 */
const archiveOldVersions = async () => {
  try {
    let archivedReports = 0;
    let archivedTranscripts = 0;

    // 1. Procesar report_versions
    // Obtener todos los pares (student_id, academic_period_id, report_type) con al menos una versión Official
    const reportGroups = await db('report_versions')
      .where('status', 'OFFICIAL')
      .groupBy('student_id', 'academic_period_id', 'report_type')
      .select('student_id', 'academic_period_id', 'report_type');

    for (const group of reportGroups) {
      // Obtener la versión Official más reciente para este grupo
      const latestOfficial = await db('report_versions')
        .where({
          student_id: group.student_id,
          academic_period_id: group.academic_period_id,
          report_type: group.report_type,
          status: 'OFFICIAL',
        })
        .orderBy('created_at', 'desc')
        .first();

      if (!latestOfficial) continue;

      // Obtener todas las versiones anteriores (no Official, no ARCHIVED) del mismo grupo
      const olderVersions = await db('report_versions')
        .where({
          student_id: group.student_id,
          academic_period_id: group.academic_period_id,
          report_type: group.report_type,
        })
        .where('id', '!=', latestOfficial.id)
        .where('status', '!=', 'ARCHIVED')
        .select('id', 'code', 'status', 'version_number');

      if (olderVersions.length === 0) continue;

      // Archivar versiones anteriores
      const ids = olderVersions.map(v => v.id);
      await db.transaction(async (trx) => {
        await trx('report_versions')
          .whereIn('id', ids)
          .update({
            status: 'ARCHIVED',
            updated_at: trx.fn.now(),
          });

        // Registrar auditoría
        for (const version of olderVersions) {
          await auditService.log({
            user: { id: 0 }, // Sistema
            action: 'REPORT_ARCHIVE',
            module: 'reports',
            recordCode: version.code,
            before: { status: version.status },
            after: { status: 'ARCHIVED' },
            reason: `Archivado automático: existe nueva versión Official ${latestOfficial.version_number}`,
          });
        }
      });

      archivedReports += olderVersions.length;
    }

    // 2. Procesar transcript_versions (similar)
    const transcriptGroups = await db('transcript_versions')
      .where('status', 'OFFICIAL')
      .groupBy('student_id', 'academic_period_id')
      .select('student_id', 'academic_period_id');

    for (const group of transcriptGroups) {
      // Obtener la versión Official más reciente
      const latestOfficial = await db('transcript_versions')
        .where({
          student_id: group.student_id,
          academic_period_id: group.academic_period_id,
          status: 'OFFICIAL',
        })
        .orderBy('created_at', 'desc')
        .first();

      if (!latestOfficial) continue;

      // Obtener versiones anteriores no archivadas
      const olderVersions = await db('transcript_versions')
        .where({
          student_id: group.student_id,
          academic_period_id: group.academic_period_id,
        })
        .where('id', '!=', latestOfficial.id)
        .where('status', '!=', 'ARCHIVED')
        .select('id', 'code', 'status', 'version_number');

      if (olderVersions.length === 0) continue;

      const ids = olderVersions.map(v => v.id);
      await db.transaction(async (trx) => {
        await trx('transcript_versions')
          .whereIn('id', ids)
          .update({
            status: 'ARCHIVED',
            updated_at: trx.fn.now(),
          });

        for (const version of olderVersions) {
          await auditService.log({
            user: { id: 0 },
            action: 'TRANSCRIPT_ARCHIVE',
            module: 'transcripts',
            recordCode: version.code,
            before: { status: version.status },
            after: { status: 'ARCHIVED' },
            reason: `Archivado automático: existe nueva versión Official ${latestOfficial.version_number}`,
          });
        }
      });

      archivedTranscripts += olderVersions.length;
    }

    console.log(`[ReportArchiveJob] Archivados: ${archivedReports} reports, ${archivedTranscripts} transcripts`);
    return { archivedReports, archivedTranscripts };
  } catch (error) {
    console.error('[ReportArchiveJob] Error:', error.message);
    throw error;
  }
};

module.exports = { archiveOldVersions };