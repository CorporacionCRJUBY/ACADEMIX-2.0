// FILE: backend/src/utils/passwordPolicy.js
// FIX (auditoria hallazgo medio #1 - política de contraseñas débil):
// antes solo se exigía `isLength({ min: 8 })`, sin ningún requisito de
// complejidad verificado en backend, así que contraseñas como "aaaaaaaa"
// o "12345678" pasaban la validación. Se centraliza aquí la regla real
// (longitud + variedad de clases de caracteres) para que
// validators/auth.validator.js (registro) y validators/users.validator.js
// (alta de usuario y cambio de contraseña) validen exactamente lo mismo,
// en vez de repetir/duplicar reglas que podrían divergir con el tiempo.

const MIN_LENGTH = 10;

// Exige al menos: una minúscula, una mayúscula, un dígito y un símbolo.
// Con las 4 clases de caracteres obligatorias, subimos el mínimo de 8 a 10
// caracteres: 8 sigue siendo corto frente a ataques de fuerza bruta/offline
// contra un hash de contraseña filtrado.
const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).+$/;

const STRONG_PASSWORD_MESSAGE =
  `Password must be at least ${MIN_LENGTH} characters long and include ` +
  'at least one uppercase letter, one lowercase letter, one number and one symbol';

/**
 * @param {unknown} value
 * @returns {boolean}
 */
const isStrongPassword = (value) => {
  if (typeof value !== 'string') return false;
  if (value.length < MIN_LENGTH) return false;
  return STRONG_PASSWORD_REGEX.test(value);
};

module.exports = {
  MIN_LENGTH,
  STRONG_PASSWORD_MESSAGE,
  isStrongPassword,
};
