// FILE: backend/src/middleware/auth.middleware.js
const jwt = require('../config/jwt');
const revokedTokensRepository = require('../repositories/revokedTokens.repository');
const { ACCESS_TOKEN_COOKIE } = require('../utils/cookies');

/**
 * Middleware de autenticación - valida el JWT de acceso.
 *
 * FIX (auditoria hallazgo medio #2 - JWT en localStorage): el token ya no
 * vive en localStorage ni se manda a mano en el header Authorization desde
 * el frontend web; ahora viaja en una cookie httpOnly (ver utils/cookies.js
 * y frontend/src/api/axiosClient.js). Se mantiene el header `Authorization:
 * Bearer <token>` como *fallback*, únicamente para clientes que no son el
 * navegador (apps móviles, integraciones server-to-server, Postman/CI) y
 * que por lo tanto no pueden depender de cookies.
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next
 */
const authenticate = async (req, res, next) => {
  try {
    let token = req.cookies?.[ACCESS_TOKEN_COOKIE];

    if (!token) {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res.status(401).json({
          success: false,
          code: 'NO_TOKEN',
          message: 'Authentication token missing'
        });
      }

      // Esperado: "Bearer <token>"
      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({
          success: false,
          code: 'INVALID_TOKEN',
          message: 'Invalid token format. Expected: Bearer <token>'
        });
      }

      token = parts[1];
    }

    // Verificar y decodificar token
    const decoded = jwt.verify(token);

    // FIX (auditoria hallazgo alto #5 - el logout no invalida tokens): si
    // este access token fue revocado explícitamente (logout), rechazarlo
    // aunque su firma y expiración sigan siendo válidas.
    if (await revokedTokensRepository.isRevoked(decoded.jti)) {
      return res.status(401).json({
        success: false,
        code: 'TOKEN_REVOKED',
        message: 'Token has been revoked'
      });
    }

    // Adjuntar usuario decodificado a req.user
    req.user = {
      id: decoded.id,
      email: decoded.email,
      roles: decoded.roles || [],
      permissions: decoded.permissions || [],
      branches: decoded.branches || [],
      branch_id: decoded.branch_id || null,
      full_name: decoded.full_name || '',
      ...decoded, // Mantener cualquier otro campo extra
      // Guardar jti/exp explícitamente (no solo vía el spread de arriba) para
      // que authService.logout() sepa qué revocar sin tener que releer el
      // header Authorization.
      jti: decoded.jti,
      exp: decoded.exp
    };

    next();
  } catch (error) {
    // Errores específicos de JWT
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        code: 'INVALID_TOKEN',
        message: 'Invalid or malformed token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        code: 'TOKEN_EXPIRED',
        message: 'Token expired'
      });
    }

    // Error inesperado
    console.error('[Auth] Error inesperado:', error.message);
    return res.status(500).json({
      success: false,
      code: 'AUTH_ERROR',
      message: 'Authentication error'
    });
  }
};

module.exports = { authenticate };