// FILE: backend/src/middleware/pagination.middleware.js
//
// FIX (auditoria hallazgo M8 - paginación sin tope): cada listado aceptaba
// un ?pageSize arbitrario del cliente (p. ej. pageSize=999999999), lo que
// permite tumbar la base de datos o la memoria del proceso con una sola
// petición. En vez de validar servicio por servicio, se normaliza aquí una
// sola vez para TODAS las rutas: page >= 1 y 1 <= pageSize <= MAX_PAGE_SIZE.

const MAX_PAGE_SIZE = 100;

function clampPagination(req, res, next) {
  if (req.query.page !== undefined) {
    const page = Number(req.query.page);
    req.query.page = Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
  }
  if (req.query.pageSize !== undefined) {
    const pageSize = Number(req.query.pageSize);
    if (!Number.isFinite(pageSize) || pageSize < 1) {
      req.query.pageSize = 20;
    } else {
      req.query.pageSize = Math.min(Math.floor(pageSize), MAX_PAGE_SIZE);
    }
  }
  next();
}

module.exports = { clampPagination, MAX_PAGE_SIZE };
