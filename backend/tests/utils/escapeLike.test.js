// FILE: backend/tests/utils/escapeLike.test.js
const { escapeLike } = require('../../src/utils/escapeLike');

describe('escapeLike() (wildcards LIKE)', () => {
  it('escapes % so it is matched literally', () => {
    expect(escapeLike('100%')).toBe('100\\%');
  });

  it('escapes _ so it is matched literally', () => {
    expect(escapeLike('a_b')).toBe('a\\_b');
  });

  it('escapes the escape character itself', () => {
    expect(escapeLike('back\\slash')).toBe('back\\\\slash');
  });

  it('escapes combined attack-ish input', () => {
    expect(escapeLike('%_\\x')).toBe('\\%\\_\\\\x');
  });

  it('leaves normal search text untouched', () => {
    expect(escapeLike('María González')).toBe('María González');
  });

  it('coerces non-strings safely', () => {
    expect(escapeLike(123)).toBe('123');
  });
});
