// FILE: backend/tests/utils/pick.test.js
const { pick } = require('../../src/utils/pick');

describe('pick()', () => {
  it('keeps only the allowed fields', () => {
    const payload = { first_name: 'Maria', last_name: 'Gonzalez', status: 'ACTIVE' };
    const result = pick(payload, ['first_name', 'last_name']);
    expect(result).toEqual({ first_name: 'Maria', last_name: 'Gonzalez' });
  });

  it('drops fields not in the whitelist, e.g. an unknown/typo field', () => {
    // Regression test for hallazgo #5: a typo'd field like `condition_name`
    // (instead of `medical_condition`) used to reach the raw INSERT and
    // blow up with a 500 + stack trace. Now it must be silently dropped.
    const payload = { medical_condition: 'Asthma', condition_name: 'typo' };
    const result = pick(payload, ['medical_condition']);
    expect(result).toEqual({ medical_condition: 'Asthma' });
    expect(result).not.toHaveProperty('condition_name');
  });

  it('never lets the client override protected/internal fields', () => {
    // created_by, deleted_at, code, id are intentionally excluded from
    // every service's ALLOWED_FIELDS list, so even if a malicious client
    // sends them, pick() must not surface them.
    const payload = { first_name: 'Maria', created_by: 999, deleted_at: null, id: 1 };
    const result = pick(payload, ['first_name']);
    expect(result).toEqual({ first_name: 'Maria' });
  });

  it('ignores explicit undefined values', () => {
    const result = pick({ status: undefined, name: 'X' }, ['status', 'name']);
    expect(result).toEqual({ name: 'X' });
  });

  it('returns an empty object for missing/empty payloads', () => {
    expect(pick(null, ['a'])).toEqual({});
    expect(pick(undefined, ['a'])).toEqual({});
    expect(pick({}, ['a'])).toEqual({});
  });
});
