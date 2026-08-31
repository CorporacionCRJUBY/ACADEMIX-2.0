// FILE: backend/src/utils/branchScope.js
//
// FIX (auditoria hallazgo #3 - aislamiento por sede roto):
//
// El middleware branchAccess.middleware.js solo validaba un branch_id si
// venía explícito en params/query/body de la petición. Como la mayoría de
// las rutas reales (GET /students, GET /students/:id, PUT /students/:id)
// nunca mandan un branch_id -el :id de la URL es el del estudiante, no el
// de la sede- el middleware dejaba pasar todo sin comprobar a qué sede
// pertenece el registro. Los listados tampoco filtraban por sede salvo que
// el cliente decidiera mandar ?branchId=, algo que nunca es obligatorio.
//
// Este helper centraliza la regla real: el filtro/validación se hace
// siempre contra req.user.branches, nunca contra lo que decida mandar el
// cliente, y siempre se aplica también en los listados.
const AppError = require('./AppError');

/**
 * Devuelve el listado de sedes del usuario, o null si el usuario no tiene
 * restricción de sede (SUPER_ADMIN).
 */
function getUserBranchIds(user) {
  if (!user) return [];
  if (user.roles && user.roles.includes('SUPER_ADMIN')) return null;
  return (user.branches || []).map(Number);
}

/**
 * Agrega la restricción de sede a un objeto de filtros para un listado.
 * Si el usuario pidió un branchId explícito, se intersecta con sus sedes
 * reales (nunca se confía en el valor del cliente por sí solo).
 */
function scopeFiltersToUserBranches(filters, user) {
  const userBranchIds = getUserBranchIds(user);
  if (userBranchIds === null) return filters; // SUPER_ADMIN: sin restricción

  if (userBranchIds.length === 0) {
    // Usuario sin sedes asignadas: no debe ver nada.
    return { ...filters, branchIds: [-1] };
  }

  if (filters.branchId) {
    const requested = Number(filters.branchId);
    const allowed = userBranchIds.includes(requested) ? [requested] : [-1];
    return { ...filters, branchId: undefined, branchIds: allowed };
  }

  return { ...filters, branchIds: userBranchIds };
}

/**
 * Verifica que un registro ya cargado desde la base (que tiene branch_id)
 * pertenezca a una de las sedes del usuario. Lanza 403/404 si no.
 */
function assertBranchAccess(record, user, notFoundMessage = 'Resource not found') {
  if (!record) throw new AppError(notFoundMessage, 404);

  const userBranchIds = getUserBranchIds(user);
  if (userBranchIds === null) return record; // SUPER_ADMIN

  if (record.branch_id == null || !userBranchIds.includes(Number(record.branch_id))) {
    // 404 en vez de 403 para no confirmarle a un usuario sin acceso que el
    // recurso existe en otra sede.
    throw new AppError(notFoundMessage, 404);
  }

  return record;
}

module.exports = { getUserBranchIds, scopeFiltersToUserBranches, assertBranchAccess };
