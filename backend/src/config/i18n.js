// FILE: backend/src/config/i18n.js
const config = require('./env');
const db = require('./database');

// Idioma por defecto del sistema
const DEFAULT_LANGUAGE = config.DEFAULT_LANGUAGE || 'en';
const SUPPORTED_LANGUAGES = ['en', 'es'];

/**
 * Obtiene el idioma activo para un usuario
 * @param {number|null} userId - ID del usuario (null para usuario anónimo/no autenticado)
 * @returns {Promise<string>} Código de idioma ('en' o 'es')
 */
const getLanguage = async (userId) => {
  // Si no hay usuario autenticado, devolver default
  if (!userId) return DEFAULT_LANGUAGE;

  try {
    // Buscar configuración del usuario en system_settings (tabla genérica)
    // Asumimos que la tabla system_settings tiene (user_id, setting_key, setting_value)
    const setting = await db('system_settings')
      .where({
        user_id: userId,
        setting_key: 'language',
      })
      .first();

    if (setting && SUPPORTED_LANGUAGES.includes(setting.setting_value)) {
      return setting.setting_value;
    }

    // Si el usuario no tiene configurado idioma, usar default del sistema
    // (posiblemente también configurable en system_settings con user_id = null)
    const globalSetting = await db('system_settings')
      .where({
        user_id: null,
        setting_key: 'default_language',
      })
      .first();

    if (globalSetting && SUPPORTED_LANGUAGES.includes(globalSetting.setting_value)) {
      return globalSetting.setting_value;
    }

    return DEFAULT_LANGUAGE;
  } catch (error) {
    // En caso de error de base de datos, devolver default
    console.error('[i18n] Error obteniendo idioma:', error.message);
    return DEFAULT_LANGUAGE;
  }
};

/**
 * Obtiene el idioma desde el objeto req.user (asumiendo que está inyectado por auth middleware)
 * @param {Object} req - Objeto request de Express
 * @returns {Promise<string>} Código de idioma
 */
const getLanguageFromRequest = async (req) => {
  const userId = req.user?.id || null;
  return getLanguage(userId);
};

module.exports = {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  getLanguage,
  getLanguageFromRequest,
};