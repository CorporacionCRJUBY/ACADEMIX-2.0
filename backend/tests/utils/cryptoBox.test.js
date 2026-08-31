// FILE: backend/tests/utils/cryptoBox.test.js
const cryptoBox = require('../../src/utils/cryptoBox');

describe('cryptoBox (AES-256-GCM at rest)', () => {
  const secret = 'JBSWY3DPEHPK3PXP'; // base32 típico de un secreto TOTP

  it('encrypt() produces a versioned enc:v1: format', () => {
    const encrypted = cryptoBox.encrypt(secret);
    expect(encrypted).toMatch(/^enc:v1:[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/);
    expect(encrypted).not.toContain(secret);
  });

  it('round-trips: decrypt(encrypt(x)) === x', () => {
    expect(cryptoBox.decrypt(cryptoBox.encrypt(secret))).toBe(secret);
  });

  it('uses a fresh IV per encryption (same plaintext, different ciphertext)', () => {
    expect(cryptoBox.encrypt(secret)).not.toBe(cryptoBox.encrypt(secret));
  });

  it('passes legacy plaintext through decrypt unchanged (compat pre-cifrado)', () => {
    expect(cryptoBox.decrypt(secret)).toBe(secret);
    expect(cryptoBox.isEncrypted(secret)).toBe(false);
  });

  it('handles null/undefined without throwing', () => {
    expect(cryptoBox.encrypt(null)).toBeNull();
    expect(cryptoBox.encrypt(undefined)).toBeNull();
    expect(cryptoBox.decrypt(null)).toBeNull();
  });

  it('detects tampering with the ciphertext (authTag validation)', () => {
    const encrypted = cryptoBox.encrypt(secret);
    const [head, tail] = [encrypted.slice(0, encrypted.length - 2), encrypted.slice(-2)];
    // Alterar el último byte del ciphertext debe romper la autenticación GCM.
    const flipped = tail === '00' ? 'ff' : '00';
    expect(() => cryptoBox.decrypt(`${head}${flipped}`)).toThrow();
  });

  it('detects tampering with the authTag', () => {
    const encrypted = cryptoBox.encrypt(secret);
    const parts = encrypted.split(':'); // ['enc', 'v1', iv, authTag, ciphertext]
    const tag = parts[3];
    parts[3] = tag.slice(0, -2) + (tag.slice(-2) === '00' ? 'ff' : '00');
    expect(() => cryptoBox.decrypt(parts.join(':'))).toThrow();
  });

  it('encrypts non-ascii payloads correctly', () => {
    const value = 'señal-日本語-🔐';
    expect(cryptoBox.decrypt(cryptoBox.encrypt(value))).toBe(value);
  });
});
