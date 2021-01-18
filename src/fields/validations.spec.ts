
import { text, textarea, password } from './validations';

const minLengthMessage = (length: number) => `This value must be longer than the minimum length of ${length} characters.`;
const maxLengthMessage = (length: number) => `This value must be shorter than the max length of ${length} characters.`;
const requiredMessage = 'This field is required.';

describe('Field Validations', () => {
  describe('text', () => {
    it('should validate', () => {
      const val = 'test';
      const result = text(val);
      expect(result).toBe(true);
    });
    it('should show required message', () => {
      const val = undefined;
      const result = text(val, { required: true });
      expect(result).toBe(requiredMessage);
    });
    it('should handle undefined', () => {
      const val = undefined;
      const result = text(val);
      expect(result).toBe(true);
    });
    it('should validate maxLength', () => {
      const val = 'toolong';
      const result = text(val, { maxLength: 5 });
      expect(result).toBe(maxLengthMessage(5));
    });
    it('should validate minLength', () => {
      const val = 'short';
      const result = text(val, { minLength: 10 });
      expect(result).toBe(minLengthMessage(10));
    });
    it('should validate maxLength with no value', () => {
      const val = undefined;
      const result = text(val, { maxLength: 5 });
      expect(result).toBe(true);
    });
    it('should validate minLength with no value', () => {
      const val = undefined;
      const result = text(val, { minLength: 10 });
      expect(result).toBe(true);
    });
  });

  describe('textarea', () => {
    it('should validate', () => {
      const val = 'test';
      const result = textarea(val);
      expect(result).toBe(true);
    });
    it('should show required message', () => {
      const val = undefined;
      const result = textarea(val, { required: true });
      expect(result).toBe(requiredMessage);
    });

    it('should handle undefined', () => {
      const val = undefined;
      const result = textarea(val);
      expect(result).toBe(true);
    });
    it('should validate maxLength', () => {
      const val = 'toolong';
      const result = textarea(val, { maxLength: 5 });
      expect(result).toBe(maxLengthMessage(5));
    });

    it('should validate minLength', () => {
      const val = 'short';
      const result = textarea(val, { minLength: 10 });
      expect(result).toBe(minLengthMessage(10));
    });
    it('should validate maxLength with no value', () => {
      const val = undefined;
      const result = textarea(val, { maxLength: 5 });
      expect(result).toBe(true);
    });
    it('should validate minLength with no value', () => {
      const val = undefined;
      const result = textarea(val, { minLength: 10 });
      expect(result).toBe(true);
    });
  });

  describe('password', () => {
    it('should validate', () => {
      const val = 'test';
      const result = password(val);
      expect(result).toBe(true);
    });
    it('should show required message', () => {
      const val = undefined;
      const result = password(val, { required: true });
      expect(result).toBe(requiredMessage);
    });

    it('should handle undefined', () => {
      const val = undefined;
      const result = password(val);
      expect(result).toBe(true);
    });
    it('should validate maxLength', () => {
      const val = 'toolong';
      const result = password(val, { maxLength: 5 });
      expect(result).toBe(maxLengthMessage(5));
    });
    it('should validate minLength', () => {
      const val = 'short';
      const result = password(val, { minLength: 10 });
      expect(result).toBe(minLengthMessage(10));
    });
    it('should validate maxLength with no value', () => {
      const val = undefined;
      const result = password(val, { maxLength: 5 });
      expect(result).toBe(true);
    });
    it('should validate minLength with no value', () => {
      const val = undefined;
      const result = password(val, { minLength: 10 });
      expect(result).toBe(true);
    });
  });
});
