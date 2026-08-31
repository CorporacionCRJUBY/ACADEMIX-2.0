// FILE: backend/src/repositories/revokedTokens.repository.js
const RevokedTokensModel = require('../models/revokedTokens.model');

const RevokedTokensRepository = {
  revoke: (data) => RevokedTokensModel.revoke(data),
  isRevoked: (jti) => RevokedTokensModel.isRevoked(jti),
  purgeExpired: () => RevokedTokensModel.purgeExpired(),
};

module.exports = RevokedTokensRepository;
