// FILE: backend/src/jobs/revokedTokensCleanupJob.js
// FIX (auditoria hallazgo alto #5 - el logout no invalida tokens): cada
// logout y cada rotación de refresh token (ver auth.service.js) inserta una
// fila en `revoked_tokens`. Sin este job la tabla crecería para siempre;
// acá se borran las filas cuyo `expires_at` ya pasó, es decir, tokens que
// de todas formas dejaron de ser válidos por su propio `exp` — ya no hace
// falta seguir "recordando" que estaban revocados.
const revokedTokensRepository = require('../repositories/revokedTokens.repository');

const purgeExpiredRevokedTokens = async () => {
  try {
    const deletedCount = await revokedTokensRepository.purgeExpired();
    console.log(`[RevokedTokensCleanupJob] ${deletedCount} revoked-token entries purged.`);
    return deletedCount;
  } catch (error) {
    console.error('[RevokedTokensCleanupJob] Error:', error.message);
    throw error;
  }
};

module.exports = { purgeExpiredRevokedTokens };
