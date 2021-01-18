
import { textarea } from './validations';

describe('Field Validations', () => {
  describe('textarea', () => {
    it('should validate', () => {
      const val = 'test';
      const result = textarea(val);
      expect(result).toBe(true);
    });
    it('should show default message when required and not present', () => {
      const val = undefined;
      const result = textarea(val, { required: true });
      expect(result).toBe('This field is required.');
    });

    it('should handle undefined', () => {
      const val = undefined;
      const result = textarea(val);
      expect(result).toBe(true);
    });
    it('should validate maxLength', () => {
      const val = 'toolong';
      const result = textarea(val, { maxLength: 5 });
      expect(result).toBe('This value must be shorter than the max length of 5 characters.');
    });

    it('should validate minLength', () => {
      const val = 'short';
      const result = textarea(val, { minLength: 10 });
      expect(result).toBe('This value must be longer than the minimum length of 10 characters.');
    });
  });
});
