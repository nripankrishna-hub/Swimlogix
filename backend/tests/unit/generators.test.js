const {
  generateInstitutionCode,
  generatePin,
  generateOtp,
  generateTempPassword,
  CODE_CHARSET,
} = require('../../src/utils/generators');

describe('generators', () => {
  it('creates a 6 character institution code from the readable charset', () => {
    const code = generateInstitutionCode();
    expect(code).toHaveLength(6);
    expect([...code].every((c) => CODE_CHARSET.includes(c))).toBe(true);
    // Ambiguous glyphs must never appear (users read these codes over the phone).
    expect(code).not.toMatch(/[O0I1]/);
  });

  it('generates distinct institution codes across many draws', () => {
    const codes = new Set(Array.from({ length: 500 }, () => generateInstitutionCode()));
    expect(codes.size).toBeGreaterThan(480);
  });

  it('creates a 4-digit attendance PIN inside 1000-9999', () => {
    for (let i = 0; i < 200; i += 1) {
      const pin = generatePin();
      expect(pin).toMatch(/^\d{4}$/);
      expect(Number(pin)).toBeGreaterThanOrEqual(1000);
      expect(Number(pin)).toBeLessThanOrEqual(9999);
    }
  });

  it('creates numeric OTPs of the requested length', () => {
    expect(generateOtp()).toMatch(/^\d{6}$/);
    expect(generateOtp(4)).toMatch(/^\d{4}$/);
  });

  it('creates temporary passwords satisfying the complexity policy', () => {
    const password = generateTempPassword(10);
    expect(password).toHaveLength(10);
    expect(password).toMatch(/[A-Z]/);
    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/\d/);
    expect(password).toMatch(/[@#$%&*!?]/);
  });
});
