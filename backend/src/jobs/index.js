// FILE: backend/src/jobs/index.js
const cron = require('node-cron');
const { lockExpiredGrades } = require('./gradeLockJob');
const { archiveOldVersions } = require('./reportArchiveJob');
const { purgeExpiredRevokedTokens } = require('./revokedTokensCleanupJob');
const { purgeExpiredLogs } = require('./auditRetentionJob');

/**
 * Inicia todos los jobs programados
 */
const startJobs = () => {
  console.log('[Jobs] Iniciando jobs programados...');

  // Job 1: Bloqueo de calificaciones - cada 15 minutos
  const gradeLockTask = cron.schedule('*/15 * * * *', async () => {
    console.log(`[Job:GradeLock] Ejecutando a las ${new Date().toISOString()}`);
    try {
      await lockExpiredGrades();
    } catch (error) {
      console.error('[Job:GradeLock] Error:', error.message);
    }
  });

  // Job 2: Archivado de reportes - todos los días a las 2:00 AM
  const reportArchiveTask = cron.schedule('0 2 * * *', async () => {
    console.log(`[Job:ReportArchive] Ejecutando a las ${new Date().toISOString()}`);
    try {
      await archiveOldVersions();
    } catch (error) {
      console.error('[Job:ReportArchive] Error:', error.message);
    }
  });

  // Job 3: Limpieza de tokens revocados - todos los días a las 3:00 AM
  // (después del archivado de reportes, para no competir por conexiones de
  // DB en la misma ventana).
  const revokedTokensCleanupTask = cron.schedule('0 3 * * *', async () => {
    console.log(`[Job:RevokedTokensCleanup] Ejecutando a las ${new Date().toISOString()}`);
    try {
      await purgeExpiredRevokedTokens();
    } catch (error) {
      console.error('[Job:RevokedTokensCleanup] Error:', error.message);
    }
  });

  // Job 4: Retención de logs de auditoría/actividad - todos los días a las 4:00 AM
  const auditRetentionTask = cron.schedule('0 4 * * *', async () => {
    console.log(`[Job:AuditRetention] Ejecutando a las ${new Date().toISOString()}`);
    try {
      await purgeExpiredLogs();
    } catch (error) {
      console.error('[Job:AuditRetention] Error:', error.message);
    }
  });

  // Ejecutar jobs inmediatamente al inicio (opcional)
  // Descomentar si se desea ejecutar al arrancar la app
  /*
  setTimeout(async () => {
    console.log('[Jobs] Ejecución inicial...');
    try {
      await lockExpiredGrades();
    } catch (e) {}
    try {
      await archiveOldVersions();
    } catch (e) {}
  }, 5000);
  */

  console.log('[Jobs] Jobs programados activos:');
  console.log('  - Grade Lock: cada 15 minutos');
  console.log('  - Report Archive: 2:00 AM diario');
  console.log('  - Revoked Tokens Cleanup: 3:00 AM diario');
  console.log('  - Audit Retention: 4:00 AM diario');

  // Retornar referencias a los tasks por si se necesitan detener
  return {
    gradeLockTask,
    reportArchiveTask,
    revokedTokensCleanupTask,
    auditRetentionTask,
    stopAll: () => {
      console.log('[Jobs] Deteniendo jobs...');
      gradeLockTask.stop();
      reportArchiveTask.stop();
      revokedTokensCleanupTask.stop();
      auditRetentionTask.stop();
    },
  };
};

module.exports = { startJobs };