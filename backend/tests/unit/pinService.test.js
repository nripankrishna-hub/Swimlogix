const { isValidPinFormat, maskPin, PIN_MIN, PIN_MAX } = require('../../src/services/pinService');

describe('pinService (pure helpers)', () => {
  describe('isValidPinFormat', () => {
    it.each(['1000', '4321', '9999'])('accepts %s', (pin) => {
      expect(isValidPinFormat(pin)).toBe(true);
    });

    it.each(['0999', '10000', 'abcd', '12', '', null, undefined, '12.34'])('rejects %s', (pin) => {
      expect(isValidPinFormat(pin)).toBe(false);
    });

    it('exposes the expected numeric bounds', () => {
      expect(PIN_MIN).toBe(1000);
      expect(PIN_MAX).toBe(9999);
    });
  });

  describe('maskPin', () => {
    it('masks all but the last digit', () => {
      expect(maskPin('4821')).toBe('•••1');
    });

    it('returns null for empty input', () => {
      expect(maskPin(null)).toBeNull();
      expect(maskPin('')).toBeNull();
    });
  });
});
