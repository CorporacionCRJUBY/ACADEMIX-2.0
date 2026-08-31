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
  revoke({ jti, userId, tokenType, expiresAt }) {
    return db(TABLE)
      .insert({
        jti,
        user_id: userId || null,
        token_type: tokenType,
        expires_at: expiresAt,
      })
      // Idempotente: si el mismo jti llega dos veces (doble click en
      // "cerrar sesión", reintento de red) no debe romper con un 500 por
      // violar el unique().
      .onConflict('jti')
      .ignore();
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
