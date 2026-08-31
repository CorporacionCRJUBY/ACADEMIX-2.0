// FILE: backend/src/jobs/auditRetentionJob.js
const db = require('../config/database');
const config = require('../config/env');

// FIX (auditoria DB 2026-08-31): audit_logs y activity_logs crecen sin
// límite (no tienen borrado en ninguna parte del sistema). Este job aplica la
// política de retención (AUDIT_RETENTION_DAYS, por defecto 730 = 2 años)
// eliminando en lotes para no bloquear las tablas.

const BATCH_SIZE = 5000;

const purgeOlderThan = async (tableName, cutoff) => {
  let total = 0;
  // Bucle por lotes: DELETE con LIMIT evita transacciones largas y locks
  // masivos en tablas que pueden tener cientos de miles de filas.
  for (;;) {
    const deleted = await db(tableName)
      .where('created_at', '<', cutoff)
      .limit(BATCH_SIZE)
      .del();
    total += deleted;
    if (deleted < BATCH_SIZE) break;
  }
  return total;
};

/**
 * Elimina registros de auditoría/actividad más antiguos que la retención.
 * @returns {Promise<{ auditLogs: number, activityLogs: number }>}
 */
const purgeExpiredLogs = async () => {
  try {
    const retentionDays = Number.isFinite(config.AUDIT_RETENTION_DAYS) && config.AUDIT_RETENTION_DAYS > 0
      ? config.AUDIT_RETENTION_DAYS
      : 730;
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    const auditLogs = await purgeOlderThan('audit_logs', cutoff);
    const activityLogs = await purgeOlderThan('activity_logs', cutoff);

    console.log(
      `[AuditRetentionJob] Retención ${retentionDays} días — eliminados: ${auditLogs} audit_logs, ${activityLogs} activity_logs`
    );
    return { auditLogs, activityLogs };
  } catch (error) {
    console.error('[AuditRetentionJob] Error:', error.message);
    throw error;
  }
};

module.exports = { purgeExpiredLogs };
