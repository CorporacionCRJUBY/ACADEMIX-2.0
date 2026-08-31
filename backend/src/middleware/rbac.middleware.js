// FILE: backend/src/middleware/rbac.middleware.js
/**
 * Middleware RBAC - verifica permisos granulares
 * @param {string} requiredPermission - Permiso requerido (formato "modulo.accion")
 * @returns {Function} Middleware de Express
 */
const authorize = (requiredPermission) => {
  return (req, res, next) => {
    // Verificar que el usuario esté autenticado (por auth.middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'User not authenticated'
      });
    }

    // SUPER_ADMIN siempre pasa
    if (req.user.roles && req.user.roles.includes('SUPER_ADMIN')) {
      return next();
    }

    // Verificar permisos
    const userPermissions = req.user.permissions || [];

    // Soporte para permisos wildcard (ej. "students.*" o "*")
    const hasPermission = userPermissions.some(perm => {
      if (perm === '*') return true;
      if (perm.endsWith('.*')) {
        const module = perm.replace('.*', '');
        return requiredPermission.startsWith(module + '.');
      }
      return perm === requiredPermission;
    });

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: `Permission denied: ${requiredPermission}`
      });
    }

    next();
  };
};

module.exports = { authorize };