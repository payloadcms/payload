import { text, textarea, password, select } from './validations';
import { ValidateOptions } from './config/types';

const minLengthMessage = (length: number) => `This value must be longer than the minimum length of ${length} characters.`;
const maxLengthMessage = (length: number) => `This value must be shorter than the max length of ${length} characters.`;
const requiredMessage = 'This field is required.';
let options: ValidateOptions<any, any, any> = {
  operation: 'create',
  data: undefined,
  siblingData: undefined,
};

describe('Field Validations', () => {
  describe('text', () => {
    it('should validate', () => {
      const val = 'test';
      const result = text(val, options);
      expect(result).toBe(true);
    });
    it('should show required message', () => {
      const val = undefined;
      const result = text(val, { ...options, required: true });
      expect(result).toBe(requiredMessage);
    });
    it('should handle undefined', () => {
      const val = undefined;
      const result = text(val, options);
      expect(result).toBe(true);
    });
    it('should validate maxLength', () => {
      const val = 'toolong';
      const result = text(val, { ...options, maxLength: 5 });
      expect(result).toBe(maxLengthMessage(5));
    });
    it('should validate minLength', () => {
      const val = 'short';
      const result = text(val, { ...options, minLength: 10 });
      expect(result).toBe(minLengthMessage(10));
    });
    it('should validate maxLength with no value', () => {
      const val = undefined;
      const result = text(val, { ...options, maxLength: 5 });
      expect(result).toBe(true);
    });
    it('should validate minLength with no value', () => {
      const val = undefined;
      const result = text(val, { ...options, minLength: 10 });
      expect(result).toBe(true);
    });
  });

  describe('textarea', () => {
    options = { ...options, field: { type: 'textarea', name: 'test' } };
    it('should validate', () => {
      const val = 'test';
      const result = textarea(val, options);
      expect(result).toBe(true);
    });
    it('should show required message', () => {
      const val = undefined;
      const result = textarea(val, { ...options, required: true });
      expect(result).toBe(requiredMessage);
    });

    it('should handle undefined', () => {
      const val = undefined;
      const result = textarea(val, options);
      expect(result).toBe(true);
    });
    it('should validate maxLength', () => {
      const val = 'toolong';
      const result = textarea(val, { ...options, maxLength: 5 });
      expect(result).toBe(maxLengthMessage(5));
    });

    it('should validate minLength', () => {
      const val = 'short';
      const result = textarea(val, { ...options, minLength: 10 });
      expect(result).toBe(minLengthMessage(10));
    });
    it('should validate maxLength with no value', () => {
      const val = undefined;
      const result = textarea(val, { ...options, maxLength: 5 });
      expect(result).toBe(true);
    });
    it('should validate minLength with no value', () => {
      const val = undefined;
      const result = textarea(val, { ...options, minLength: 10 });
      expect(result).toBe(true);
    });
  });

  describe('password', () => {
    options.type = 'password';
    options.name = 'test';
    it('should validate', () => {
      const val = 'test';
      const result = password(val, options);
      expect(result).toBe(true);
    });
    it('should show required message', () => {
      const val = undefined;
      const result = password(val, { ...options, required: true });
      expect(result).toBe(requiredMessage);
    });
    it('should handle undefined', () => {
      const val = undefined;
      const result = password(val, options);
      expect(result).toBe(true);
    });
    it('should validate maxLength', () => {
      const val = 'toolong';
      const result = password(val, { ...options, maxLength: 5 });
      expect(result).toBe(maxLengthMessage(5));
    });
    it('should validate minLength', () => {
      const val = 'short';
      const result = password(val, { ...options, minLength: 10 });
      expect(result).toBe(minLengthMessage(10));
    });
    it('should validate maxLength with no value', () => {
      const val = undefined;
      const result = password(val, { ...options, maxLength: 5 });
      expect(result).toBe(true);
    });
    it('should validate minLength with no value', () => {
      const val = undefined;
      const result = password(val, { ...options, minLength: 10 });
      expect(result).toBe(true);
    });
  });

  describe('select', () => {
    options.type = 'select';
    options.options = ['one', 'two', 'three'];
    const optionsRequired = {
      ...options,
      required: true,
      options: [{
        value: 'one',
        label: 'One',
      }, {
        value: 'two',
        label: 'two',
      }, {
        value: 'three',
        label: 'three',
      }],
    };
    const optionsWithEmptyString = {
      ...options,
      options: [{
        value: '',
        label: 'None',
      }, {
        value: 'option',
        label: 'Option',
      }],
    };
    it('should allow valid input', () => {
      const val = 'one';
      const result = select(val, options);
      expect(result).toStrictEqual(true);
    });
    it('should prevent invalid input', () => {
      const val = 'bad';
      const result = select(val, options);
      expect(result).not.toStrictEqual(true);
    });
    it('should allow null input', () => {
      const val = null;
      const result = select(val, options);
      expect(result).toStrictEqual(true);
    });
    it('should allow undefined input', () => {
      let val;
      const result = select(val, options);
      expect(result).toStrictEqual(true);
    });
    it('should prevent empty string input', () => {
      const val = '';
      const result = select(val, options);
      expect(result).not.toStrictEqual(true);
    });
    it('should prevent undefined input with required', () => {
      let val;
      const result = select(val, optionsRequired);
      expect(result).not.toStrictEqual(true);
    });
    it('should prevent empty string input with required', () => {
      const result = select('', optionsRequired);
      expect(result).not.toStrictEqual(true);
    });
    it('should prevent undefined input with required and hasMany', () => {
      let val;
      options.hasMany = true;
      const result = select(val, optionsRequired);
      expect(result).not.toStrictEqual(true);
    });
    it('should prevent empty array input with required and hasMany', () => {
      optionsRequired.hasMany = true;
      const result = select([], optionsRequired);
      expect(result).not.toStrictEqual(true);
    });
    it('should prevent empty string array input with required and hasMany', () => {
      options.hasMany = true;
      const result = select([''], optionsRequired);
      expect(result).not.toStrictEqual(true);
    });
    it('should prevent null input with required and hasMany', () => {
      const val = null;
      options.hasMany = true;
      const result = select(val, optionsRequired);
      expect(result).not.toStrictEqual(true);
    });
    it('should allow valid input with option objects', () => {
      const val = 'one';
      options.hasMany = false;
      const result = select(val, optionsRequired);
      expect(result).toStrictEqual(true);
    });
    it('should prevent invalid input with option objects', () => {
      const val = 'bad';
      options.hasMany = false;
      const result = select(val, optionsRequired);
      expect(result).not.toStrictEqual(true);
    });
    it('should allow empty string input with option object', () => {
      const val = '';
      const result = select(val, optionsWithEmptyString);
      expect(result).toStrictEqual(true);
    });
    it('should allow empty string input with option object and required', () => {
      const val = '';
      optionsWithEmptyString.required = true;
      const result = select(val, optionsWithEmptyString);
      expect(result).toStrictEqual(true);
    });
    it('should allow valid input with hasMany', () => {
      const val = ['one', 'two'];
      const result = select(val, options);
      expect(result).toStrictEqual(true);
    });
    it('should prevent invalid input with hasMany', () => {
      const val = ['one', 'bad'];
      const result = select(val, options);
      expect(result).not.toStrictEqual(true);
    });
    it('should allow valid input with hasMany option objects', () => {
      const val = ['one', 'three'];
      optionsRequired.hasMany = true;
      const result = select(val, optionsRequired);
      expect(result).toStrictEqual(true);
    });
    it('should prevent invalid input with hasMany option objects', () => {
      const val = ['three', 'bad'];
      optionsRequired.hasMany = true;
      const result = select(val, optionsRequired);
      expect(result).not.toStrictEqual(true);
    });
  });
});
