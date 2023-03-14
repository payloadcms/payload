import { text, textarea, password, select, point, number, relationship } from './validations';
import { ValidateOptions } from './config/types';

const t = jest.fn((string) => string);

let options: ValidateOptions<any, any, any> = {
  operation: 'create',
  data: undefined,
  siblingData: undefined,
  t,
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
      expect(result).toBe('validation:required');
    });
    it('should handle undefined', () => {
      const val = undefined;
      const result = text(val, options);
      expect(result).toBe(true);
    });
    it('should validate maxLength', () => {
      const val = 'toolong';
      const result = text(val, { ...options, maxLength: 5 });
      expect(result).toBe('validation:shorterThanMax');
    });
    it('should validate minLength', () => {
      const val = 'short';
      const result = text(val, { ...options, minLength: 10 });
      expect(result).toBe('validation:longerThanMin');
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
      expect(result).toBe('validation:required');
    });

    it('should handle undefined', () => {
      const val = undefined;
      const result = textarea(val, options);
      expect(result).toBe(true);
    });
    it('should validate maxLength', () => {
      const val = 'toolong';
      const result = textarea(val, { ...options, maxLength: 5 });
      expect(result).toBe('validation:shorterThanMax');
    });

    it('should validate minLength', () => {
      const val = 'short';
      const result = textarea(val, { ...options, minLength: 10 });
      expect(result).toBe('validation:longerThanMin');
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
    const passwordOptions = {
      ...options,
      type: 'password',
      name: 'test',
    };
    it('should validate', () => {
      const val = 'test';
      const result = password(val, passwordOptions);
      expect(result).toBe(true);
    });
    it('should show required message', () => {
      const val = undefined;
      const result = password(val, { ...passwordOptions, required: true });
      expect(result).toBe('validation:required');
    });
    it('should handle undefined', () => {
      const val = undefined;
      const result = password(val, passwordOptions);
      expect(result).toBe(true);
    });
    it('should validate maxLength', () => {
      const val = 'toolong';
      const result = password(val, { ...passwordOptions, maxLength: 5 });
      expect(result).toBe('validation:shorterThanMax');
    });
    it('should validate minLength', () => {
      const val = 'short';
      const result = password(val, { ...passwordOptions, minLength: 10 });
      expect(result).toBe('validation:longerThanMin');
    });
    it('should validate maxLength with no value', () => {
      const val = undefined;
      const result = password(val, { ...passwordOptions, maxLength: 5 });
      expect(result).toBe(true);
    });
    it('should validate minLength with no value', () => {
      const val = undefined;
      const result = password(val, { ...passwordOptions, minLength: 10 });
      expect(result).toBe(true);
    });
  });

  describe('point', () => {
    const pointOptions = {
      ...options,
      type: 'point',
      name: 'point',
    };
    it('should validate numbers', () => {
      const val = ['0.1', '0.2'];
      const result = point(val, pointOptions);
      expect(result).toBe(true);
    });
    it('should validate strings that could be numbers', () => {
      const val = ['0.1', '0.2'];
      const result = point(val, pointOptions);
      expect(result).toBe(true);
    });
    it('should show required message when undefined', () => {
      const val = undefined;
      const result = point(val, { ...pointOptions, required: true });
      expect(result).not.toBe(true);
    });
    it('should show required message when array', () => {
      const val = [];
      const result = point(val, { ...pointOptions, required: true });
      expect(result).not.toBe(true);
    });
    it('should show required message when array of undefined', () => {
      const val = [undefined, undefined];
      const result = point(val, { ...pointOptions, required: true });
      expect(result).not.toBe(true);
    });
    it('should handle undefined not required', () => {
      const val = undefined;
      const result = password(val, pointOptions);
      expect(result).toBe(true);
    });
    it('should handle empty array not required', () => {
      const val = [];
      const result = point(val, pointOptions);
      expect(result).toBe(true);
    });
    it('should handle array of undefined not required', () => {
      const val = [undefined, undefined];
      const result = point(val, pointOptions);
      expect(result).toBe(true);
    });
    it('should prevent text input', () => {
      const val = ['bad', 'input'];
      const result = point(val, pointOptions);
      expect(result).not.toBe(true);
    });
    it('should prevent missing value', () => {
      const val = [0.1];
      const result = point(val, pointOptions);
      expect(result).not.toBe(true);
    });
  });

  describe('relationship', () => {
    const relationshipOptions = {
      ...options,
      relationTo: 'relation',
      payload: {
        collections: {
          relation: {
            config: {
              slug: 'relation',
              fields: [{
                name: 'id',
                type: 'text',
              }],
            },
          },
        },
      },
    };
    it('should handle required', async () => {
      const val = undefined;
      const result = await relationship(val, { ...relationshipOptions, required: true });
      expect(result).not.toBe(true);
    });
    it('should handle required with hasMany', async () => {
      const val = [];
      const result = await relationship(val, { ...relationshipOptions, required: true, hasMany: true });
      expect(result).not.toBe(true);
    });
    it('should enforce hasMany min', async () => {
      const minOptions = {
        ...relationshipOptions,
        hasMany: true,
        min: 2,
      };

      const val = ['a'];

      const result = await relationship(val, minOptions);
      expect(result).not.toBe(true);

      const allowed = await relationship(['a', 'b'], minOptions);
      expect(allowed).toStrictEqual(true);
    });
    it('should enforce hasMany max', async () => {
      const maxOptions = {
        ...relationshipOptions,
        max: 2,
        hasMany: true,
      };
      let val = ['a', 'b', 'c'];

      const result = await relationship(val, maxOptions);
      expect(result).not.toBe(true);

      val = ['a'];
      const allowed = await relationship(val, maxOptions);
      expect(allowed).toStrictEqual(true);
    });
  });

  describe('select', () => {
    const selectOptions = {
      ...options,
      type: 'select',
      options: ['one', 'two', 'three'],
    };
    const optionsRequired = {
      ...selectOptions,
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
      ...selectOptions,
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
      const result = select(val, selectOptions);
      expect(result).toStrictEqual(true);
    });
    it('should prevent invalid input', () => {
      const val = 'bad';
      const result = select(val, selectOptions);
      expect(result).not.toStrictEqual(true);
    });
    it('should allow null input', () => {
      const val = null;
      const result = select(val, selectOptions);
      expect(result).toStrictEqual(true);
    });
    it('should allow undefined input', () => {
      let val;
      const result = select(val, selectOptions);
      expect(result).toStrictEqual(true);
    });
    it('should prevent empty string input', () => {
      const val = '';
      const result = select(val, selectOptions);
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
      const result = select(val, selectOptions);
      expect(result).toStrictEqual(true);
    });
    it('should prevent invalid input with hasMany', () => {
      const val = ['one', 'bad'];
      const result = select(val, selectOptions);
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
  describe('number', () => {
    const numberOptions = {
      ...options,
      type: 'number',
      name: 'test',
    };
    it('should validate', () => {
      const val = 1;
      const result = number(val, numberOptions);
      expect(result).toBe(true);
    });
    it('should validate 2', () => {
      const val = 1.5;
      const result = number(val, numberOptions);
      expect(result).toBe(true);
    });
    it('should show invalid number message', () => {
      const val = 'test';
      const result = number(val, { ...numberOptions });
      expect(result).toBe('validation:enterNumber');
    });
    it('should handle empty value', () => {
      const val = '';
      const result = number(val, { ...numberOptions });
      expect(result).toBe(true);
    });
    it('should handle required value', () => {
      const val = '';
      const result = number(val, { ...numberOptions, required: true });
      expect(result).toBe('validation:enterNumber');
    });
    it('should validate minValue', () => {
      const val = 2.4;
      const result = number(val, { ...numberOptions, min: 2.5 });
      expect(result).toBe('validation:lessThanMin');
    });
    it('should validate maxValue', () => {
      const val = 1.25;
      const result = number(val, { ...numberOptions, max: 1 });
      expect(result).toBe('validation:greaterThanMax');
    });
  });
});
