const { normalizePhone, isValidPhone } = require('../../src/utils/phone');
const { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken } = require('../../src/utils/token');

describe('phone utils', () => {
  it('normalises formatting characters and country prefixes', () => {
    expect(normalizePhone('+91 98765-43210')).toBe('919876543210');
    expect(normalizePhone('0091 9876543210')).toBe('919876543210');
    expect(normalizePhone('9876543210')).toBe('9876543210');
  });

  it('validates 10-15 digit numbers', () => {
    expect(isValidPhone('9876543210')).toBe(true);
    expect(isValidPhone('+91 98765 43210')).toBe(true);
    expect(isValidPhone('12345')).toBe(false);
    expect(isValidPhone('')).toBe(false);
  });
});

describe('token utils', () => {
  const user = { _id: '65f0000000000000000000aa', role: 'admin', institutionId: '65f0000000000000000000bb' };

  it('round-trips an access token', () => {
    const payload = verifyAccessToken(signAccessToken(user));
    expect(payload.sub).toBe(user._id);
    expect(payload.role).toBe('admin');
    expect(payload.institutionId).toBe(user.institutionId);
    expect(payload.type).toBe('access');
  });

  it('round-trips a refresh token', () => {
    const payload = verifyRefreshToken(signRefreshToken(user));
    expect(payload.type).toBe('refresh');
  });

  it('rejects a refresh token used as an access token', () => {
    expect(() => verifyAccessToken(signRefreshToken(user))).toThrow();
  });
});
