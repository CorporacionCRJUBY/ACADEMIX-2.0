// FILE: backend/src/audit/auditRepository.js
const db = require('../config/database');

/**
 * Inserta un registro de auditoría
 * @param {Object} entry - Datos de auditoría
 * @param {number} entry.user_id - ID del usuario que realizó la acción
 * @param {string} entry.action - Tipo de acción (CREATE, UPDATE, DELETE, LOGIN, etc.)
 * @param {string} entry.module - Módulo afectado (students, grades, attendance, etc.)
 * @param {string} [entry.record_code] - Código del registro afectado (ej. STU-2026-000001)
 * @param {string} [entry.before] - JSON con estado anterior
 * @param {string} [entry.after] - JSON con estado posterior
 * @param {string} [entry.reason] - Motivo del cambio (opcional)
 * @param {string} [entry.ip] - Dirección IP del usuario
 * @param {string} [entry.user_agent] - User-Agent del navegador/dispositivo
 * @returns {Promise<number>} ID del registro insertado
 */
const insert = async (entry) => {
  const [id] = await db('audit_logs').insert({
    user_id: entry.user_id,
    action: entry.action,
    module: entry.module,
    record_code: entry.record_code || null,
    before: entry.before || null,
    after: entry.after || null,
    reason: entry.reason || null,
    ip: entry.ip || null,
    user_agent: entry.user_agent || null,
    created_at: db.fn.now(),
  });
  return id;
};

/**
 * Lista registros de auditoría con paginación y filtros
 * @param {Object} filters
 * @param {number} [filters.user_id] - Filtrar por usuario
 * @param {string} [filters.module] - Filtrar por módulo
 * @param {string} [filters.action] - Filtrar por acción
 * @param {string} [filters.record_code] - Filtrar por código de registro
 * @param {string} [filters.date_from] - Fecha inicio (ISO)
 * @param {string} [filters.date_to] - Fecha fin (ISO)
 * @param {number} [filters.page=1] - Número de página
 * @param {number} [filters.pageSize=20] - Tamaño de página
 * @returns {Promise<{ data: Array, total: number }>}
 */
const findAll = async (filters = {}) => {
  const {
    user_id,
    module,
    action,
    record_code,
    date_from,
    date_to,
    page = 1,
    pageSize = 20,
  } = filters;

  const offset = (page - 1) * pageSize;

  // Construir query base
  let query = db('audit_logs');

  // Aplicar filtros
  if (user_id) query = query.where('user_id', user_id);
  if (module) query = query.where('module', module);
  if (action) query = query.where('action', action);
  if (record_code) query = query.where('record_code', record_code);
  if (date_from) query = query.where('created_at', '>=', date_from);
  if (date_to) query = query.where('created_at', '<=', date_to);

  // Obtener total de registros (sin paginación)
  const totalQuery = query.clone().clearSelect().count('id as total').first();
  const { total } = await totalQuery;

  // Obtener datos paginados
  const data = await query
    .select('*')
    .orderBy('created_at', 'desc')
    .limit(pageSize)
    .offset(offset);

  return { data, total: parseInt(total, 10) };
};

/**
 * Obtiene el historial completo de un registro específico por su código
 * @param {string} recordCode - Código único del registro
 * @returns {Promise<Array>} Lista de eventos de auditoría ordenados por fecha
 */
const findByRecordCode = async (recordCode) => {
  return db('audit_logs')
    .where('record_code', recordCode)
    .orderBy('created_at', 'asc');
};

module.exports = {
  insert,
  findAll,
  findByRecordCode,
};