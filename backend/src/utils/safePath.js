// FILE: backend/src/utils/safePath.js
// SEGURIDAD (auditoria 2026-08-31, críticos C1-C3): contención de rutas para
// cualquier operación que abra archivos a partir de datos persistidos o
// enviados por el cliente. Previene path traversal (../, rutas absolutas
// fuera de uploads/, etc.) resolviendo la ruta y exigiendo que quede dentro
// del directorio raíz permitido.
const path = require('path');
const AppError = require('./AppError');

/**
 * Resuelve `candidate` dentro de `root` y garantiza que el resultado no
 * escape de `root`. Acepta rutas absolutas, relativas y con prefijo
 * "/uploads/" (formato legacy de URLs). Lanza AppError 400 con mensaje
 * genérico si la ruta escapa del directorio permitido (no revela por qué).
 */
function resolveWithinRoot(root, candidate) {
  if (!candidate || typeof candidate !== 'string') {
    throw new AppError('Invalid file reference', 400);
  }
  const resolvedRoot = path.resolve(root);
  const normalized = candidate.replace(/^\/uploads\//, '');
  const resolved = path.resolve(resolvedRoot, normalized);
  if (resolved !== resolvedRoot && !resolved.startsWith(resolvedRoot + path.sep)) {
    throw new AppError('Invalid file reference', 400);
  }
  return resolved;
}

module.exports = { resolveWithinRoot };
