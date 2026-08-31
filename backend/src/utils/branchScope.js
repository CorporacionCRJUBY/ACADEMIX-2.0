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

/**
 * SEGURIDAD (auditoria 2026-08-31, medio M1): valida el branch_id de un
 * payload de CREACIÓN contra las sedes del usuario. Antes los POST no
 * comprobaban nada y un usuario de la sede A podía crear registros en la
 * sede B. Si el payload no trae branch_id, se rellena con la primera sede
 * del usuario (nunca queda sin sede un registro creado por un usuario con
 * sedes asignadas). SUPER_ADMIN puede crear en cualquier sede.
 */
function assertBranchForCreate(payload, user) {
  const userBranchIds = getUserBranchIds(user);
  if (userBranchIds === null) return payload; // SUPER_ADMIN

  const requested = payload.branch_id !== undefined && payload.branch_id !== null
    ? Number(payload.branch_id)
    : null;

  if (userBranchIds.length === 0) {
    throw new AppError('User has no assigned branches', 403);
  }

  if (requested === null) {
    payload.branch_id = userBranchIds[0];
    return payload;
  }

  if (!userBranchIds.includes(requested)) {
    throw new AppError('Cannot create records in a branch you do not belong to', 403);
  }

  return payload;
}

/**
 * SEGURIDAD (auditoria 2026-08-31, medio M1b): valida el branch_id de un
 * payload de ACTUALIZACIÓN. Solo actúa si el cliente intenta cambiar la sede;
 * si el branch_id pedido no pertenece a las sedes del usuario, lanza 403.
 * No rellena nada: en un UPDATE la ausencia del campo significa "no cambiar".
 */
function assertBranchChangeAllowed(payload, user) {
  if (payload.branch_id === undefined || payload.branch_id === null) return payload;

  const userBranchIds = getUserBranchIds(user);
  if (userBranchIds === null) return payload; // SUPER_ADMIN

  if (!userBranchIds.includes(Number(payload.branch_id))) {
    throw new AppError('Cannot assign this record to a branch you do not belong to', 403);
  }

  return payload;
}

module.exports = { getUserBranchIds, scopeFiltersToUserBranches, assertBranchAccess, assertBranchForCreate, assertBranchChangeAllowed };
