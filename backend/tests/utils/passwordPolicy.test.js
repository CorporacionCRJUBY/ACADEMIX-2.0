// FILE: backend/tests/utils/passwordPolicy.test.js
const { isStrongPassword, MIN_LENGTH, STRONG_PASSWORD_MESSAGE } = require('../../src/utils/passwordPolicy');

describe('isStrongPassword()', () => {
  it('accepts a compliant strong password', () => {
    expect(isStrongPassword('Colegio#2026Seguro')).toBe(true);
  });

  it('requires at least MIN_LENGTH characters', () => {
    expect(MIN_LENGTH).toBeGreaterThanOrEqual(10);
    // 9 caracteres cumpliendo todas las clases -> rechazada por longitud.
    expect(isStrongPassword('Aa1!Aa1!A')).toBe(false);
  });

  it('requires an uppercase letter', () => {
    expect(isStrongPassword('colegio#2026seguro')).toBe(false);
  });

  it('requires a lowercase letter', () => {
    expect(isStrongPassword('COLEGIO#2026SEGURO')).toBe(false);
  });

  it('requires a digit', () => {
    expect(isStrongPassword('Colegio#SeguroXX')).toBe(false);
  });

  it('requires a symbol (and a whitespace does not count as one)', () => {
    expect(isStrongPassword('Colegio 2026 Seguro')).toBe(false);
    expect(isStrongPassword('Colegio#2026')).toBe(true);
  });

  it('rejects non-string input instead of throwing', () => {
    expect(isStrongPassword(undefined)).toBe(false);
    expect(isStrongPassword(null)).toBe(false);
    expect(isStrongPassword(12345678901)).toBe(false);
    expect(isStrongPassword({})).toBe(false);
  });

  it('exposes a user-facing message mentioning every rule', () => {
    expect(STRONG_PASSWORD_MESSAGE).toMatch(/uppercase/);
    expect(STRONG_PASSWORD_MESSAGE).toMatch(/lowercase/);
    expect(STRONG_PASSWORD_MESSAGE).toMatch(/number/);
    expect(STRONG_PASSWORD_MESSAGE).toMatch(/symbol/);
  });
});
