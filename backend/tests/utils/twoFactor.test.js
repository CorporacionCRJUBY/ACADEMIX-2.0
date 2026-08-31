// FILE: backend/tests/utils/twoFactor.test.js
const twoFactor = require('../../src/utils/twoFactor');

describe('TOTP (RFC 6238)', () => {
  it('generateSecret() returns 32 base32 chars (160 bits)', () => {
    const secret = twoFactor.generateSecret();
    expect(secret).toMatch(/^[A-Z2-7]{32}$/);
  });

  it('verifies the code generated for the same instant', () => {
    const secret = twoFactor.generateSecret();
    const now = Date.now();
    const code = twoFactor.generateTOTP(secret, now);
    expect(twoFactor.verifyTOTP(secret, code)).toBe(true);
  });

  it('rejects a wrong code', () => {
    const secret = twoFactor.generateSecret();
    const code = twoFactor.generateTOTP(secret);
    const wrong = code === '000000' ? '111111' : '000000';
    expect(twoFactor.verifyTOTP(secret, wrong)).toBe(false);
  });

  it('rejects malformed tokens without throwing', () => {
    const secret = twoFactor.generateSecret();
    expect(twoFactor.verifyTOTP(secret, '12345')).toBe(false);
    expect(twoFactor.verifyTOTP(secret, 'abcdef')).toBe(false);
    expect(twoFactor.verifyTOTP(secret, '')).toBe(false);
    expect(twoFactor.verifyTOTP(secret, null)).toBe(false);
    expect(twoFactor.verifyTOTP(secret, '1234567')).toBe(false);
  });

  it('rejects a code from far outside the ±1 step window', () => {
    const secret = twoFactor.generateSecret();
    const now = Date.now();
    const oldCode = twoFactor.generateTOTP(secret, now - 10 * 60 * 1000);
    expect(twoFactor.verifyTOTP(secret, oldCode)).toBe(false);
  });

  it('base32 round-trips arbitrary buffers', () => {
    const buffer = Buffer.from([0, 1, 2, 250, 251, 252, 253, 254, 255]);
    const decoded = twoFactor.base32Decode(twoFactor.base32Encode(buffer));
    expect(decoded).toEqual(buffer);
  });

  it('buildOtpAuthUrl() produces a standard otpauth URI', () => {
    const url = twoFactor.buildOtpAuthUrl('JBSWY3DPEHPK3PXP', 'admin@academix.test');
    expect(url).toContain('otpauth://totp/');
    expect(url).toContain('secret=JBSWY3DPEHPK3PXP');
    expect(url).toContain('issuer=ACADEMIX');
    expect(url).toContain(encodeURIComponent('admin@academix.test'));
  });
});

describe('Backup codes', () => {
  it('generates 10 unique XXXX-XXXX codes without ambiguous chars', () => {
    const codes = twoFactor.generateBackupCodes();
    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
    for (const code of codes) {
      expect(code).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/);
    }
  });

  it('consumes exactly one matching code and returns the rest', async () => {
    const plain = twoFactor.generateBackupCodes(3);
    const hashes = await twoFactor.hashBackupCodes(plain);
    expect(hashes).toHaveLength(3);
    // Los hashes nunca contienen el código en claro.
    for (const hash of hashes) {
      for (const code of plain) {
        expect(hash).not.toContain(code);
      }
    }

    const remaining = await twoFactor.consumeBackupCode(plain[1], hashes);
    expect(remaining).toHaveLength(2);

    // El mismo código ya no sirve (es de un solo uso).
    const again = await twoFactor.consumeBackupCode(plain[1], remaining);
    expect(again).toBeNull();

    // Los otros siguen funcionando.
    const last = await twoFactor.consumeBackupCode(plain[0], remaining);
    expect(last).toHaveLength(1);
  });

  it('rejects unknown codes and bad input', async () => {
    const hashes = await twoFactor.hashBackupCodes(twoFactor.generateBackupCodes(2));
    expect(await twoFactor.consumeBackupCode('ZZZZ-ZZZZ', hashes)).toBeNull();
    expect(await twoFactor.consumeBackupCode('', hashes)).toBeNull();
    expect(await twoFactor.consumeBackupCode(null, hashes)).toBeNull();
    expect(await twoFactor.consumeBackupCode('XXXX-XXXX', [])).toBeNull();
  });
});
