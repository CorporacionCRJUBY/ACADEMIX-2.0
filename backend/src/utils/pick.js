// FILE: backend/src/utils/pick.js
//
// FIX (auditoria hallazgo #5 - mass assignment / fuga de stack trace):
//
// La mayoría de los servicios construían el objeto a insertar/actualizar
// con `{ ...payload, ... }`, es decir, insertaban el body completo del
// request en la consulta SQL sin whitelist de campos. Dos problemas:
//   1. Un typo o campo inventado del cliente (ej. "condition_name" en vez
//      de "medical_condition") no era filtrado por express-validator (que
//      solo valida los campos que reconoce, no elimina los que no
//      reconoce) y llegaba crudo a Knex, que lo mandaba a MySQL, que
//      respondía con un 500 y stack trace completo (rutas del servidor
//      incluidas) en vez de una validación limpia.
//   2. En teoría, un campo del body que coincidiera con una columna real
//      "protegida" (created_by, deleted_at, status, code, id) podía
//      sobreescribirse porque nada lo filtraba antes del insert/update.
//
// `pick(payload, allowedFields)` construye un objeto nuevo que solo
// contiene las claves explícitamente permitidas, ignorando en silencio
// cualquier otra cosa que venga en el body.
function pick(payload, allowedFields) {
  const result = {};
  if (!payload) return result;
  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(payload, field) && payload[field] !== undefined) {
      result[field] = payload[field];
    }
  });
  return result;
}

module.exports = { pick };
