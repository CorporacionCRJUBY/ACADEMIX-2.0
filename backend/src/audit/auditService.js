// FILE: backend/src/audit/auditService.js
const auditRepo = require('./auditRepository');

/**
 * Registra una acción en el log de auditoría
 * @param {Object} params
 * @param {Object} params.user - Usuario que realiza la acción (debe tener id)
 * @param {string} params.action - Acción (CREATE, UPDATE, DELETE, LOGIN, etc.)
 * @param {string} params.module - Módulo afectado
 * @param {string} [params.recordCode] - Código del registro afectado
 * @param {Object} [params.before] - Estado anterior (objeto, se serializará a JSON)
 * @param {Object} [params.after] - Estado posterior (objeto, se serializará a JSON)
 * @param {string} [params.reason] - Motivo del cambio
 * @param {Object} [params.req] - Objeto request de Express (para IP y User-Agent)
 * @returns {Promise<number>} ID del registro creado
 */
const log = async ({ user, action, module, recordCode, before, after, reason, req }) => {
  // Serializar objetos a JSON
  const beforeJson = before ? JSON.stringify(before) : null;
  const afterJson = after ? JSON.stringify(after) : null;

  // Extraer IP y User-Agent del request si está presente
  let ip = null;
  let userAgent = null;
  if (req) {
    ip = req.ip || req.connection?.remoteAddress || null;
    userAgent = req.headers?.['user-agent'] || null;
  }

  return auditRepo.insert({
    user_id: user.id,
    action,
    module,
    record_code: recordCode,
    before: beforeJson,
    after: afterJson,
    reason: reason || null,
    ip,
    user_agent: userAgent,
  });
};

/**
 * Obtiene el historial de cambios de un registro específico
 * @param {string} recordCode - Código único del registro
 * @returns {Promise<Array>} Eventos de auditoría ordenados cronológicamente
 */
const getHistory = async (recordCode) => {
  return auditRepo.findByRecordCode(recordCode);
};

/**
 * Obtiene el feed de actividad reciente de un usuario
 * @param {number} userId - ID del usuario
 * @param {number} [limit=20] - Cantidad máxima de registros
 * @returns {Promise<Array>} Últimas acciones del usuario
 */
const getActivityFeed = async (userId, limit = 20) => {
  const { data } = await auditRepo.findAll({
    user_id: userId,
    page: 1,
    pageSize: limit,
  });
  return data;
};

module.exports = {
  log,
  getHistory,
  getActivityFeed,
};