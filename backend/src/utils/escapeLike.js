// FILE: backend/src/utils/escapeLike.js
//
// FIX (auditoria hallazgo bajo B3): los términos de búsqueda se interpolan
// en cláusulas LIKE (`%${search}%`). Aunque knex parametriza el valor (no
// hay inyección SQL), los comodines LIKE que traiga el usuario (`%` y `_`,
// y el propio carácter de escape `\`) quedan activos: `%` convierte la
// búsqueda en "cualquier cosa" y `_` fuerza coincidencias de un carácter,
// lo que permite ensanchar resultados a voluntad y, p. ej., enumerar
// códigos con patrones tipo "CAL-2026-_". Escapar estos caracteres hace
// que la búsqueda sea literal.

function escapeLike(value) {
  return String(value).replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

module.exports = { escapeLike };
