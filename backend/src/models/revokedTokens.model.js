// FILE: backend/src/models/revokedTokens.model.js
// FIX (auditoria hallazgo alto #5 - el logout no invalida tokens): ver la
// migración 053_create_revoked_tokens.js para el porqué de esta tabla.
const db = require('../config/database');

const TABLE = 'revoked_tokens';

const RevokedTokens = {
  TABLE,

  // `expiresAt` debe ser el `exp` (segundos epoch) que ya trae el propio
  // token decodificado, no un valor inventado: así una fila nunca sobrevive
  // más tiempo del que el token habría sido válido de todas formas, y el
  // `whereIn` de isRevoked() se mantiene chico.
  //
  // FIX (segunda pasada de auditoría, MEDIO #5): devuelve cuántas filas se
  // insertaron realmente. El insert es atómico, así que el caller puede
  // usar `0 filas` como señal de "el jti ya estaba revocado" sin la ventana
  // de carrera del patrón anterior isRevoked() -> revoke() (dos peticiones
  // concurrentes con el mismo token pasaban ambas el check antes de que
  // ninguna insertara, rompiendo el single-use del challenge 2FA y la
  // rotación de refresh tokens).
  async revoke({ jti, userId, tokenType, expiresAt }) {
    try {
      await db(TABLE).insert({
        jti,
        user_id: userId || null,
        token_type: tokenType,
        expires_at: expiresAt,
      });
      return 1;
    } catch (error) {
      // UNIQUE(jti): si el mismo jti llega dos veces (doble click en
      // "cerrar sesión", reintento de red, o replay de un challenge 2FA /
      // refresh token ya usado) el insert atómico falla con ER_DUP_ENTRY.
      // Es la única señal confiable de "ya estaba revocado": el dialecto
      // mysql de knex resuelve los inserts a un array de insertIds, no a
      // un ResultSetHeader, así que afectRows de onConflict().ignore()
      // nunca está disponible.
      if (error && (error.errno === 1062 || error.code === 'ER_DUP_ENTRY')) {
        return 0;
      }
      throw error;
    }
  },

  async isRevoked(jti) {
    if (!jti) return false;
    const row = await db(TABLE).where({ jti }).first();
    return Boolean(row);
  },

  // Job de limpieza opcional (no se invoca automáticamente todavía): borra
  // filas de tokens que de todas formas ya expiraron, para que la tabla no
  // crezca sin límite.
  purgeExpired() {
    return db(TABLE).where('expires_at', '<', db.fn.now()).del();
  },
};

module.exports = RevokedTokens;
